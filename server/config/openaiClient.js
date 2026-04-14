const OpenAI = require('openai');

// Initialise a single OpenAI client using the API key from .env.
// All agents and the embedder import this instance — never create a second client.
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = openaiClient;