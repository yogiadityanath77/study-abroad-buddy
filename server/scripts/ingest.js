// server/scripts/ingest.js
// Reads all .txt files from server/data/visa, server/data/health, server/data/culture,
// chunks each file into overlapping segments, embeds each chunk using OpenAI,
// and upserts them into the corresponding Pinecone namespace.
// Skips files that have already been ingested -- safe to re-run when adding new files.
// Usage: node server/scripts/ingest.js
// Run from inside the server/ folder.

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const pineconeIndex = require('../config/pineconeClient');
const { embedText } = require('../utils/embedder');

// Maps each data folder to its Pinecone namespace.
const INGEST_TARGETS = [
  { folder: path.join(__dirname, '../data/visa'),    namespace: 'visa_docs' },
  { folder: path.join(__dirname, '../data/health'),  namespace: 'health_docs' },
  { folder: path.join(__dirname, '../data/culture'), namespace: 'culture_docs' },
];

// Splits a long text into overlapping chunks.
const chunkText = (text, chunkSize = 800, overlap = 100) => {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    start += chunkSize - overlap;
  }
  return chunks.filter((chunk) => chunk.length > 50);
};

// Checks if a file was already ingested by querying Pinecone with a metadata filter.
const isFileIngested = async (ns, filename) => {
  try {
    const dummyEmbedding = await embedText('check');
    const result = await ns.query({
      vector: dummyEmbedding,
      topK: 1,
      includeMetadata: true,
      filter: { source: { $eq: filename } },
    });
    return result.matches.length > 0;
  } catch (err) {
    console.warn('    isFileIngested check failed:', err.message);
    return false;
  }
};

// Processes one folder -- reads .txt files, skips already-ingested ones,
// embeds and upserts new ones into Pinecone in batches of 100.
// Returns the number of new chunks added.
const ingestFolder = async (folderPath, namespace) => {
  console.log('\n--- Ingesting "' + namespace + '" from ' + folderPath + ' ---');

  const ns = pineconeIndex.namespace(namespace);
  const files = fs.readdirSync(folderPath).filter((f) => f.endsWith('.txt'));

  if (files.length === 0) {
    console.log('  No .txt files found -- skipping');
    return 0;
  }

  let newChunks = 0;

  for (const file of files) {
    const alreadyIngested = await isFileIngested(ns, file);
    if (alreadyIngested) {
      console.log('  ' + file + ' already ingested, skipping');
      continue;
    }

    const filePath = path.join(folderPath, file);
    const rawText = fs.readFileSync(filePath, 'utf-8');
    const chunks = chunkText(rawText);
    console.log('  ' + file + ' -> ' + chunks.length + ' chunks');

    const records = [];

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await embedText(chunks[i]);

      // text-embedding-3-small always returns exactly 1536 floats.
      // Skip any chunk that produces an unexpected result.
      if (!Array.isArray(embedding) || embedding.length !== 1536) {
        console.warn('    chunk ' + i + ' invalid embedding -- skipping');
        continue;
      }

      records.push({
        id: file + '_chunk_' + i,
        values: embedding,
        metadata: {
          source: file,
          chunkIndex: i,
          // Text stored in metadata so ragQuery.js can retrieve it on query.
          // Pinecone does not return raw document text -- only vectors and metadata.
          text: chunks[i],
          namespace,
        },
      });

      process.stdout.write('    ' + (i + 1) + '/' + chunks.length + ' embedded\r');
    }

    if (records.length === 0) {
      console.log('\n    no valid records produced for ' + file + ' -- skipping upsert');
      continue;
    }

    // SDK v7 upsert takes { records: [...] } -- NOT a bare array.
    const BATCH_SIZE = 100;
    for (let b = 0; b < records.length; b += BATCH_SIZE) {
      const batch = records.slice(b, b + BATCH_SIZE);
      await ns.upsert({ records: batch });
    }

    console.log('\n    ' + records.length + ' records upserted');
    newChunks += records.length;
  }

  const stats = await pineconeIndex.describeIndexStats();
  const nsStats = stats.namespaces && stats.namespaces[namespace];
  const count = nsStats ? (nsStats.recordCount || nsStats.vectorCount || 0) : 'unknown';
  console.log('  Namespace "' + namespace + '" now has ' + count + ' vectors total');

  return newChunks;
};

// Main entry point
const ingest = async () => {
  console.log('Starting ingestion...');
  console.log('Pinecone index: ' + process.env.PINECONE_INDEX);

  let grandTotal = 0;

  try {
    for (const target of INGEST_TARGETS) {
      const count = await ingestFolder(target.folder, target.namespace);
      grandTotal += count;
    }

    if (grandTotal === 0) {
      console.log('\nNo new files found. All namespaces are up to date.');
    } else {
      console.log('\nIngestion complete. ' + grandTotal + ' new records upserted to Pinecone.');
    }
  } catch (error) {
    console.error('\nIngestion failed:', error.message);
    process.exit(1);
  }
};

ingest();