// server/controllers/chatController.js
const ChatHistory = require('../models/ChatHistory');

// Returns the last 30 messages for the logged-in user
const getHistory = async (req, res) => {
  try {
    const messages = await ChatHistory.find({ userId: req.user.id })
      .sort({ createdAt: 1 }) // oldest first so chat renders in order
      .limit(30);

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Saves a user message to DB — bot reply will be added later when agents are wired up
const sendMessage = async (req, res) => {
  const { message } = req.body;

  try {
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    // Save the user's message
    const userMessage = await ChatHistory.create({
      userId: req.user.id,
      role: 'user',
      message: message.trim(),
      intent: 'general',
    });

    // Placeholder bot reply — will be replaced by agentRouter in Week 4
    const botMessage = await ChatHistory.create({
      userId: req.user.id,
      role: 'bot',
      message: 'I am still being set up. Check back soon!',
      intent: 'general',
    });

    res.status(201).json({
      userMessage,
      botMessage,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getHistory, sendMessage };