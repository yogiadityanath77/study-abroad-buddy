const chromaClient = require('../config/chromaClient');
const { embedText } = require('./embedder');

// Queries a ChromaDB collection and returns the top n most relevant text chunks.
// Takes the collection name, the query string, and how many results to return.
// Returns an array of strings (the document chunks), ready to inject into a prompt.
const ragQuery = async (collectionName, queryText, nResults = 4) => {
  try {
    // Get the collection — pass embeddingFunction: null because we supply our own vectors
    const collection = await chromaClient.getOrCreateCollection({
      name: collectionName,
      embeddingFunction: null,
    });

    // Embed the query text using OpenAI text-embedding-3-small
    const queryEmbedding = await embedText(queryText);

    // Query ChromaDB for the top nResults most similar chunks
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults,
    });

    // results.documents is a nested array: [[chunk1, chunk2, chunk3, chunk4]]
    // Flatten and filter out any null/empty results
    const chunks = results.documents[0].filter(Boolean);
    return chunks;
  } catch (error) {
    throw new Error(`ragQuery failed for collection "${collectionName}": ${error.message}`);
  }
};

module.exports = { ragQuery };