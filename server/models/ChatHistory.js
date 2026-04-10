// server/models/ChatHistory.js
const mongoose = require('mongoose');

// Stores every message sent and received in the chat
const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'bot'], // only these two values are allowed
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    intent: {
      type: String,
      enum: ['visa', 'health', 'culture', 'housing', 'general'],
      default: 'general',
    },
  },
  {
    timestamps: true, // createdAt is how we sort chat history
  }
);

module.exports = mongoose.model('ChatHistory', chatHistorySchema);