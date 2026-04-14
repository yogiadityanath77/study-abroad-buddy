const { classifyIntent } = require('./intentClassifier');
const visaAgent = require('../agents/visaAgent');
const healthAgent = require('../agents/healthAgent');
const cultureAgent = require('../agents/cultureAgent');
const housingAgent = require('../agents/housingAgent');
const generalAgent = require('../agents/generalAgent');
const ChatHistory = require('../models/ChatHistory');

// Maps each intent string to its corresponding agent module
const AGENT_MAP = {
  visa: visaAgent,
  health: healthAgent,
  culture: cultureAgent,
  housing: housingAgent,
  general: generalAgent,
};

// Main router function. Takes the user's message and their full profile,
// classifies the intent, picks the right agent, runs it, saves both messages
// to ChatHistory in MongoDB, and returns { answer, intent }.
// userProfile must include: id, homeCountry, destinationCountry, destinationCity,
// travelStartDate, travelEndDate.
// recentMessages is an array of the last 5 ChatHistory documents (for general agent context).
const routeMessage = async ({ userMessage, userProfile, recentMessages }) => {
  // Step 1 — classify the intent
  const intent = await classifyIntent(userMessage);

  // Step 2 — pick the correct agent
  const agent = AGENT_MAP[intent] || AGENT_MAP.general;

  // Step 3 — run the agent with the relevant context fields
  // Each agent only uses the fields it needs — passing all of them is harmless
  const answer = await agent.run({
    userMessage,
    homeCountry: userProfile.homeCountry,
    destinationCountry: userProfile.destinationCountry,
    destinationCity: userProfile.destinationCity,
    travelStartDate: userProfile.travelStartDate,
    travelEndDate: userProfile.travelEndDate,
    recentMessages,
  });

  // Step 4 — save user message to ChatHistory
  await ChatHistory.create({
    userId: userProfile.id,
    role: 'user',
    message: userMessage,
    intent,
  });

  // Step 5 — save bot reply to ChatHistory
  await ChatHistory.create({
    userId: userProfile.id,
    role: 'bot',
    message: answer,
    intent,
  });

  return { answer, intent };
};

module.exports = { routeMessage };