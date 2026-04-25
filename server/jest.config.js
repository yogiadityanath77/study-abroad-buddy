// jest.config.js
// Place this file in the server/ folder alongside package.json

module.exports = {
  testEnvironment: 'node',
  // Intercept external SDK clients before any module loads them.
  // Prevents crashes on missing OPENAI_API_KEY / PINECONE_API_KEY during tests.
  moduleNameMapper: {
    '^../config/openaiClient$': '<rootDir>/tests/__mocks__/openaiClient.js',
    '^../../config/openaiClient$': '<rootDir>/tests/__mocks__/openaiClient.js',
    '^../config/pineconeClient$': '<rootDir>/tests/__mocks__/pineconeClient.js',
    '^../../config/pineconeClient$': '<rootDir>/tests/__mocks__/pineconeClient.js',
  },
};