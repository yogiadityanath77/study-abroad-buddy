// tests/__mocks__/openaiClient.js
// Manual mock for config/openaiClient.js
// Replaces the real OpenAI SDK client during all unit tests.
// Tests that need to control OpenAI responses mock this object directly.

const openaiClient = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
};

module.exports = openaiClient;