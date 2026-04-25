// tests/agentRouter.test.js
// Unit tests for routeMessage in agentRouter.
// Mocks: intentClassifier, all 5 agents, ChatHistory model.
// Verifies that the right agent is called for each intent and that
// both messages are saved to ChatHistory.

jest.mock('../router/intentClassifier');
jest.mock('../agents/visaAgent');
jest.mock('../agents/healthAgent');
jest.mock('../agents/cultureAgent');
jest.mock('../agents/housingAgent');
jest.mock('../agents/generalAgent');
jest.mock('../models/ChatHistory');

const { routeMessage } = require('../router/agentRouter');
const { classifyIntent } = require('../router/intentClassifier');
const visaAgent = require('../agents/visaAgent');
const healthAgent = require('../agents/healthAgent');
const cultureAgent = require('../agents/cultureAgent');
const housingAgent = require('../agents/housingAgent');
const generalAgent = require('../agents/generalAgent');
const ChatHistory = require('../models/ChatHistory');

const mockUserProfile = {
  id: 'user123',
  homeCountry: 'India',
  destinationCountry: 'United Kingdom',
  destinationCity: 'London',
  travelStartDate: '2025-09-01',
  travelEndDate: '2026-06-30',
};

beforeEach(() => {
  jest.clearAllMocks();
  ChatHistory.create = jest.fn().mockResolvedValue({});
});

describe('agentRouter — routeMessage', () => {

  test('routes to visaAgent when intent is visa', async () => {
    classifyIntent.mockResolvedValue('visa');
    visaAgent.run = jest.fn().mockResolvedValue('Visa answer');

    const result = await routeMessage({
      userMessage: 'Do I need a visa?',
      userProfile: mockUserProfile,
      recentMessages: [],
    });

    expect(visaAgent.run).toHaveBeenCalledTimes(1);
    expect(result.intent).toBe('visa');
    expect(result.answer).toBe('Visa answer');
  });

  test('routes to healthAgent when intent is health', async () => {
    classifyIntent.mockResolvedValue('health');
    healthAgent.run = jest.fn().mockResolvedValue('Health answer');

    const result = await routeMessage({
      userMessage: 'What vaccines do I need?',
      userProfile: mockUserProfile,
      recentMessages: [],
    });

    expect(healthAgent.run).toHaveBeenCalledTimes(1);
    expect(result.intent).toBe('health');
    expect(result.answer).toBe('Health answer');
  });

  test('routes to cultureAgent when intent is culture', async () => {
    classifyIntent.mockResolvedValue('culture');
    cultureAgent.run = jest.fn().mockResolvedValue('Culture answer');

    const result = await routeMessage({
      userMessage: 'How does tipping work?',
      userProfile: mockUserProfile,
      recentMessages: [],
    });

    expect(cultureAgent.run).toHaveBeenCalledTimes(1);
    expect(result.intent).toBe('culture');
  });

  test('routes to housingAgent when intent is housing', async () => {
    classifyIntent.mockResolvedValue('housing');
    housingAgent.run = jest.fn().mockResolvedValue('Housing answer');

    const result = await routeMessage({
      userMessage: 'How do I find a flat in London?',
      userProfile: mockUserProfile,
      recentMessages: [],
    });

    expect(housingAgent.run).toHaveBeenCalledTimes(1);
    expect(result.intent).toBe('housing');
  });

  test('routes to generalAgent when intent is general', async () => {
    classifyIntent.mockResolvedValue('general');
    generalAgent.run = jest.fn().mockResolvedValue('General answer');

    const result = await routeMessage({
      userMessage: 'What should I pack?',
      userProfile: mockUserProfile,
      recentMessages: [],
    });

    expect(generalAgent.run).toHaveBeenCalledTimes(1);
    expect(result.intent).toBe('general');
  });

  test('falls back to generalAgent when intent is unknown', async () => {
    classifyIntent.mockResolvedValue('unknown_intent');
    generalAgent.run = jest.fn().mockResolvedValue('Fallback answer');

    const result = await routeMessage({
      userMessage: 'Something weird',
      userProfile: mockUserProfile,
      recentMessages: [],
    });

    expect(generalAgent.run).toHaveBeenCalledTimes(1);
    expect(result.answer).toBe('Fallback answer');
  });

  test('saves exactly 2 ChatHistory entries — one user, one bot', async () => {
    classifyIntent.mockResolvedValue('visa');
    visaAgent.run = jest.fn().mockResolvedValue('Visa answer');

    await routeMessage({
      userMessage: 'Do I need a visa?',
      userProfile: mockUserProfile,
      recentMessages: [],
    });

    expect(ChatHistory.create).toHaveBeenCalledTimes(2);
  });

  test('saves user message with role user and correct intent', async () => {
    classifyIntent.mockResolvedValue('health');
    healthAgent.run = jest.fn().mockResolvedValue('Health answer');

    await routeMessage({
      userMessage: 'Do I need vaccines?',
      userProfile: mockUserProfile,
      recentMessages: [],
    });

    expect(ChatHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'user',
        message: 'Do I need vaccines?',
        intent: 'health',
        userId: 'user123',
      })
    );
  });

  test('saves bot reply with role bot and correct intent', async () => {
    classifyIntent.mockResolvedValue('health');
    healthAgent.run = jest.fn().mockResolvedValue('Health answer');

    await routeMessage({
      userMessage: 'Do I need vaccines?',
      userProfile: mockUserProfile,
      recentMessages: [],
    });

    expect(ChatHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'bot',
        message: 'Health answer',
        intent: 'health',
        userId: 'user123',
      })
    );
  });

});
