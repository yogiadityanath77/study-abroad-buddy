// server/controllers/chatController.js
const ChatHistory = require('../models/ChatHistory');
const User = require('../models/User');
const { routeMessage } = require('../router/agentRouter');

const MAX_MESSAGE_LENGTH = 2000;

// Returns the last 30 messages for the logged-in user, sorted oldest first.
const getHistory = async (req, res) => {
  try {
    const messages = await ChatHistory.find({ userId: req.user.id })
      .sort({ createdAt: 1 })
      .limit(30);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Could not load chat history. Please refresh.' });
  }
};

// Receives the user's message, routes it through the agent pipeline,
// and returns both the saved user message and bot reply.
// routeMessage() saves both messages to ChatHistory internally —
// do NOT add any ChatHistory.create() calls here or duplicates will be created.
const sendMessage = async (req, res) => {
  const { message } = req.body;
  try {
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    if (message.trim().length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        message: `Message is too long. Please keep it under ${MAX_MESSAGE_LENGTH} characters.`,
      });
    }
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const recentMessagesDesc = await ChatHistory.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);
    const recentMessages = recentMessagesDesc.reverse();
    const userProfile = {
      id: user._id,
      homeCountry: user.homeCountry,
      destinationCountry: user.destinationCountry,
      destinationCity: user.destinationCity,
      travelStartDate: user.travelStartDate,
      travelEndDate: user.travelEndDate,
    };
    const { answer, intent } = await routeMessage({
      userMessage: message.trim(),
      userProfile,
      recentMessages,
    });
    const saved = await ChatHistory.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(2);
    const botMessage = saved[0];
    const userMessage = saved[1];
    res.status(201).json({ userMessage, botMessage });
  } catch (error) {
    res.status(500).json({ message: 'Could not send message. Please try again.' });
  }
};

module.exports = { getHistory, sendMessage };