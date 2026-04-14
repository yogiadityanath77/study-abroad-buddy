const openaiClient = require('../config/openaiClient');

// Takes a plain text string and returns an embedding vector (array of floats).
// Uses text-embedding-3-small — cheapest OpenAI embedding model, good enough for RAG.
// Called by ingest.js (at build time) and ragQuery.js (at runtime per user query).
const embedText = async (text) => {
  try {
    const response = await openaiClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding; // array of 1536 floats
  } catch (error) {
    throw new Error(`embedText failed: ${error.message}`);
  }
};

module.exports = { embedText };