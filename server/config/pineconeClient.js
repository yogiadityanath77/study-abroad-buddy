// server/config/pineconeClient.js

const { Pinecone } = require('@pinecone-database/pinecone');

// Initialises the Pinecone client using the API key from .env.
// pineconeIndex is the live index object — call .namespace() on it in ragQuery.js.
// This file is required at startup so any misconfiguration surfaces immediately.
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Returns a ready-to-use index object pointed at the study-abroad index.
// All upsert and query calls go through this object.
const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX);

module.exports = pineconeIndex;