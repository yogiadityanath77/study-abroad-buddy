// One-off script — run once to create the three ChromaDB collections.
// Safe to re-run: getOrCreateCollection does nothing if the collection already exists.
// Usage: node server/scripts/createCollections.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const chromaClient = require('../config/chromaClient');

const COLLECTIONS = ['visa_docs', 'health_docs', 'culture_docs'];

const createCollections = async () => {
  console.log(`Connecting to ChromaDB at ${process.env.CHROMA_URL || 'http://localhost:8000'} ...\n`);

  try {
    for (const name of COLLECTIONS) {
      // Pass embeddingFunction: null so ChromaDB does not attempt to load
      // its default embedder. We supply our own vectors at ingest and query time.
      const collection = await chromaClient.getOrCreateCollection({
        name,
        embeddingFunction: null,
      });

      const count = await collection.count();
      console.log(`✓ ${name} — created / already exists — ${count} items`);
    }

    console.log('\nAll collections ready. ChromaDB setup complete.');
  } catch (error) {
    console.error('✗ createCollections failed:', error.message);
    process.exit(1);
  }
};

createCollections();