// server/socket/chatSocket.js

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ChatHistory = require('../models/ChatHistory');
const { classifyIntent } = require('../router/intentClassifier');
const visaAgent = require('../agents/visaAgent');
const healthAgent = require('../agents/healthAgent');
const cultureAgent = require('../agents/cultureAgent');
const housingAgent = require('../agents/housingAgent');
const generalAgent = require('../agents/generalAgent');

// Same AGENT_MAP shape as agentRouter.js
const AGENT_MAP = {
  visa: visaAgent,
  health: healthAgent,
  culture: cultureAgent,
  housing: housingAgent,
  general: generalAgent,
};

const MAX_MESSAGE_LENGTH = 2000;

// Creates the Socket.io server, attaches it to the HTTP server,
// registers the JWT auth middleware, and sets up all socket event handlers.
// Called once from server.js at startup.
const initChatSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      // Must match the CORS config in server.js exactly.
      // In production this is the Vercel URL set via CLIENT_URL env var.
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // JWT auth middleware -- runs before every connection.
  // Reads token from socket.handshake.auth.token (set by client/src/api/socket.js).
  // Attaches decoded payload to socket.user -- same shape as authMiddleware.js.
  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;

    if (!token) {
      return next(new Error('No token, access denied'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id, name, email }
      next();
    } catch (error) {
      return next(new Error('Token is invalid or expired'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log('Socket connected: ' + socket.id + ' (user: ' + socket.user.id + ')');

    // chat:message -- receives user message, streams agent response token by token,
    // saves both messages to ChatHistory, emits chat:done.
    socket.on('chat:message', async (data) => {
      const userMessage = typeof data.message === 'string' ? data.message.trim() : '';

      if (!userMessage) {
        return socket.emit('chat:error', { message: 'Message cannot be empty' });
      }

      if (userMessage.length > MAX_MESSAGE_LENGTH) {
        return socket.emit('chat:error', {
          message: 'Message is too long. Please keep it under ' + MAX_MESSAGE_LENGTH + ' characters.',
        });
      }

      try {
        const user = await User.findById(socket.user.id).select('-password');
        if (!user) {
          return socket.emit('chat:error', { message: 'User not found' });
        }

        const recentMessagesDesc = await ChatHistory.find({ userId: socket.user.id })
          .sort({ createdAt: -1 })
          .limit(5);
        const recentMessages = recentMessagesDesc.reverse();

        const intent = await classifyIntent(userMessage);
        const agent = AGENT_MAP[intent] || AGENT_MAP.general;

        const userProfile = {
          homeCountry: user.homeCountry,
          destinationCountry: user.destinationCountry,
          destinationCity: user.destinationCity,
          travelStartDate: user.travelStartDate,
          travelEndDate: user.travelEndDate,
        };

        const streamIterable = await agent.stream({
          userMessage,
          recentMessages,
          ...userProfile,
        });

        let fullAnswer = '';

        for await (const token of streamIterable) {
          fullAnswer += token;
          socket.emit('chat:token', { token });
        }

        // Save user message then bot reply to ChatHistory.
        // routeMessage() is NOT called here -- it calls run() and would create duplicates.
        await ChatHistory.create({
          userId: socket.user.id,
          role: 'user',
          message: userMessage,
          intent,
        });

        const savedBotMessage = await ChatHistory.create({
          userId: socket.user.id,
          role: 'bot',
          message: fullAnswer,
          intent,
        });

        socket.emit('chat:done', { intent, savedBotMessage });
      } catch (error) {
        console.error('chat:message error (user: ' + socket.user.id + '):', error.message);
        socket.emit('chat:error', {
          message: 'Could not send message. Please try again.',
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected: ' + socket.id);
    });
  });

  return io;
};

module.exports = { initChatSocket };