const { ChromaClient } = require('chromadb');

// Initialise a single ChromaDB client pointed at the local ChromaDB server.
// host and port are used instead of the deprecated 'path' option.
const url = new URL(process.env.CHROMA_URL || 'http://localhost:8000');

const chromaClient = new ChromaClient({
  host: url.hostname,       // 'localhost'
  port: parseInt(url.port), // 8000
  ssl: url.protocol === 'https:',
});

module.exports = chromaClient;