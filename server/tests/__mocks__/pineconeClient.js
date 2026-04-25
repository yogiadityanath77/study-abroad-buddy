// tests/__mocks__/pineconeClient.js
// Manual mock for config/pineconeClient.js
// Returns a fake Pinecone index object so agents never hit the real SDK.

const pineconeClient = {
  namespace: jest.fn().mockReturnValue({
    query: jest.fn().mockResolvedValue({ matches: [] }),
    upsert: jest.fn().mockResolvedValue({}),
  }),
};

module.exports = pineconeClient;