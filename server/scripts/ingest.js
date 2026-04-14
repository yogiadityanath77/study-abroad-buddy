// Reads all .txt files from server/data/visa, server/data/health, server/data/culture,
// chunks each file into overlapping segments, embeds each chunk using OpenAI,
// and upserts them into the corresponding ChromaDB collection.
// Skips files that have already been ingested — safe to re-run when adding new files.
// Usage: node server/scripts/ingest.js
// Run from inside the server/ folder.

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const chromaClient = require('../config/chromaClient');
const { embedText } = require('../utils/embedder');

// Map each data folder to its ChromaDB collection
const INGEST_TARGETS = [
  { folder: path.join(__dirname, '../data/visa'),    collection: 'visa_docs' },
  { folder: path.join(__dirname, '../data/health'),  collection: 'health_docs' },
  { folder: path.join(__dirname, '../data/culture'), collection: 'culture_docs' },
];

// Splits a long text into overlapping chunks.
// chunkSize: number of characters per chunk
// overlap: number of characters to repeat at the start of the next chunk
// Overlap ensures sentences split across a chunk boundary are still retrievable.
const chunkText = (text, chunkSize = 800, overlap = 100) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    start += chunkSize - overlap;
  }

  // Filter out any chunks that are too short to be meaningful
  return chunks.filter((chunk) => chunk.length > 50);
};

// Processes one folder: reads all .txt files, checks which are new,
// chunks and embeds new files only, upserts into ChromaDB.
// Returns the number of NEW chunks added in this run.
const ingestFolder = async (folderPath, collectionName) => {
  console.log(`\n--- Ingesting "${collectionName}" from ${folderPath} ---`);

  // Get the collection — embeddingFunction: null because we supply our own vectors
  const collection = await chromaClient.getOrCreateCollection({
    name: collectionName,
    embeddingFunction: null,
  });

  const files = fs.readdirSync(folderPath).filter((f) => f.endsWith('.txt'));

  if (files.length === 0) {
    console.log(`  No .txt files found in ${folderPath} — skipping`);
    return 0;
  }

  let newChunks = 0;

  for (const file of files) {
    // Check if this file's first chunk already exists in the collection.
    // If chunk_0 exists, the whole file was previously ingested — skip it.
    const firstChunkId = `${file}_chunk_0`;
    const existing = await collection.get({ ids: [firstChunkId] });

    if (existing.ids.length > 0) {
      console.log(`  ${file} → already ingested, skipping`);
      continue;
    }

    // File is new — read, chunk, embed, and upsert
    const filePath = path.join(folderPath, file);
    const rawText = fs.readFileSync(filePath, 'utf-8');
    const chunks = chunkText(rawText);

    console.log(`  ${file} → ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `${file}_chunk_${i}`;
      const embedding = await embedText(chunks[i]);

      // upsert: inserts if ID does not exist, replaces if it does
      await collection.upsert({
        ids: [chunkId],
        embeddings: [embedding],
        documents: [chunks[i]],
        metadatas: [{ source: file, chunkIndex: i }],
      });

      process.stdout.write(`    chunk ${i + 1}/${chunks.length} embedded\r`);
    }

    console.log(`    chunk ${chunks.length}/${chunks.length} embedded ✓`);
    newChunks += chunks.length;
  }

  const finalCount = await collection.count();
  console.log(`  Collection "${collectionName}" now has ${finalCount} items total`);
  return newChunks;
};

// Main entry point — runs all three ingest targets in sequence
const ingest = async () => {
  console.log('Starting ingestion...');
  console.log(`ChromaDB: ${process.env.CHROMA_URL || 'http://localhost:8000'}`);

  let grandTotal = 0;

  try {
    for (const target of INGEST_TARGETS) {
      const count = await ingestFolder(target.folder, target.collection);
      grandTotal += count;
    }

    if (grandTotal === 0) {
      console.log('\nNo new files found. All collections are up to date.');
    } else {
      console.log(`\nIngestion complete. ${grandTotal} new chunks embedded.`);
    }
  } catch (error) {
    console.error('\nIngestion failed:', error.message);
    process.exit(1);
  }
};

ingest();