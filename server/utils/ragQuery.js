// server/utils/ragQuery.js

const pineconeIndex = require('../config/pineconeClient');
const { embedText } = require('./embedder');

// Queries a Pinecone namespace and returns the top n most relevant text chunks.
// Drop-in replacement for the ChromaDB version -- same function signature,
// same return shape (array of strings), so no changes needed in any agent.
//
// collectionName maps directly to a Pinecone namespace.
// Returns an empty array if Pinecone is unreachable so agents fall back gracefully.
const ragQuery = async (collectionName, queryText, nResults = 4) => {
  try {
    const queryEmbedding = await embedText(queryText);

    // SDK v7 query shape -- vector, topK, includeMetadata, optional filter.
    const results = await pineconeIndex.namespace(collectionName).query({
      vector: queryEmbedding,
      topK: nResults,
      includeMetadata: true,
    });

    // Extract text from metadata -- stored there at ingest time because
    // Pinecone does not return raw document text separately from vectors.
    const chunks = results.matches
      .map((match) => match.metadata && match.metadata.text)
      .filter(Boolean);

    return chunks;
  } catch (error) {
    console.warn('ragQuery fallback (Pinecone unavailable): ' + error.message);
    return [];
  }
};

module.exports = { ragQuery };