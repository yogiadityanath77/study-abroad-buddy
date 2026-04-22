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

// Same AGENT_MAP shape as agentRouter.js — picks the right agent by intent string.
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
      // In production (Week 3) this will be replaced with the Vercel URL.
      // For now allow all origins so local dev works without extra config.
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  // ─── JWT auth middleware ───────────────────────────────────────────────────
  // Runs before every connection. Reads the token from socket.handshake.auth.token,
  // which is where socket.io-client sends it (set in client/src/api/socket.js).
  // Attaches the decoded payload to socket.user exactly like authMiddleware.js does
  // for HTTP routes — same jwt.verify call, same { id, name, email } shape.
  // Calling next(new Error(...)) rejects the connection before it opens.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

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

  // ─── Connection handler ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.user.id})`);

    // ── chat:message ──────────────────────────────────────────────────────────
    // Receives the user's message, routes it through the intent classifier and
    // the correct agent's stream() function, emits tokens one by one as they
    // arrive, then saves both messages to ChatHistory and emits chat:done.
    //
    // Events emitted:
    //   chat:token  { token: string }                — one per streamed token
    //   chat:done   { intent, savedBotMessage }       — after stream completes
    //   chat:error  { message: string }               — on any failure
    socket.on('chat:message', async (data) => {
      const userMessage = typeof data?.message === 'string' ? data.message.trim() : '';

      // ── Input validation ────────────────────────────────────────────────────
      if (!userMessage) {
        return socket.emit('chat:error', { message: 'Message cannot be empty' });
      }

      if (userMessage.length > MAX_MESSAGE_LENGTH) {
        return socket.emit('chat:error', {
          message: `Message is too long. Please keep it under ${MAX_MESSAGE_LENGTH} characters.`,
        });
      }

      try {
        // ── Load user profile ─────────────────────────────────────────────────
        // Agents need homeCountry, destinationCountry, destinationCity, and dates.
        // socket.user only has { id, name, email } from the JWT — must hit MongoDB.
        const user = await User.findById(socket.user.id).select('-password');
        if (!user) {
          return socket.emit('chat:error', { message: 'User not found' });
        }

        // ── Load recent messages for general agent context ────────────────────
        // Same logic as chatController.js — descending then reverse for oldest-first order.
        const recentMessagesDesc = await ChatHistory.find({ userId: socket.user.id })
          .sort({ createdAt: -1 })
          .limit(5);
        const recentMessages = recentMessagesDesc.reverse();

        // ── Classify intent ───────────────────────────────────────────────────
        const intent = await classifyIntent(userMessage);

        // ── Pick agent ────────────────────────────────────────────────────────
        const agent = AGENT_MAP[intent] || AGENT_MAP.general;

        // ── Stream tokens ─────────────────────────────────────────────────────
        // agent.stream() returns an async iterable of token strings.
        // Each token is emitted immediately so the client can append it to the
        // streaming bubble without waiting for the full response.
        // The full answer is accumulated here for saving to ChatHistory.
        const userProfile = {
          homeCountry: user.homeCountry,
          destinationCountry: user.destinationCountry,
          destinationCity: user.destinationCity,
          travelStartDate: user.travelStartDate,
          travelEndDate: user.travelEndDate,
        };

        const stream = await agent.stream({
          userMessage,
          recentMessages,
          ...userProfile,
        });

        let fullAnswer = '';

        for await (const token of stream) {
          fullAnswer += token;
          socket.emit('chat:token', { token });
        }

        // ── Save to ChatHistory ───────────────────────────────────────────────
        // chatSocket saves directly — routeMessage() is NOT called here.
        // routeMessage() calls run(), not stream(), and saves internally.
        // Calling it here would create duplicate ChatHistory entries.
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

        // ── Signal completion ─────────────────────────────────────────────────
        // intent is needed so the client can render the correct agent badge.
        // savedBotMessage is the full Mongoose document — client replaces the
        // streaming bubble with it to get a real _id and createdAt timestamp.
        socket.emit('chat:done', { intent, savedBotMessage });
      } catch (error) {
        console.error(`chat:message error (user: ${socket.user.id}):`, error.message);
        socket.emit('chat:error', {
          message: 'Could not send message. Please try again.',
        });
      }
    });

    // ── disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = { initChatSocket };