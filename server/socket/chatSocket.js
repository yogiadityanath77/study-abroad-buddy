// server/socket/chatSocket.js

const { Server } = require('socket.io');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ChatHistory = require('../models/ChatHistory');
const { classifyIntent } = require('../router/intentClassifier');
const visaAgent = require('../agents/visaAgent');
const healthAgent = require('../agents/healthAgent');
const cultureAgent = require('../agents/cultureAgent');
const housingAgent = require('../agents/housingAgent');
const generalAgent = require('../agents/generalAgent');
const redisClient = require('../config/redisClient');

// Same AGENT_MAP shape as agentRouter.js
const AGENT_MAP = {
  visa: visaAgent,
  health: healthAgent,
  culture: cultureAgent,
  housing: housingAgent,
  general: generalAgent,
};

const MAX_MESSAGE_LENGTH = 2000;

// Cache entries live for 1 hour. Long enough for repeated/common queries to hit,
// short enough that stale answers don't stick around after source data updates.
const CACHE_TTL_SECONDS = 3600;

// General agent replies depend on the last 5 messages (conversation context),
// so caching them by (intent + message + country) alone would serve stale answers
// that ignore the ongoing conversation. Skip the cache for general intent.
const CACHEABLE_INTENTS = new Set(['visa', 'health', 'culture', 'housing']);

// Builds a deterministic md5 hash of (intent + userMessage + destinationCountry).
// md5 is fine here because we're not using it for security — we just need a short,
// stable, fixed-length key. Including intent prevents collisions when the same
// question is classified differently. Including destinationCountry prevents
// two users going to different countries getting each other's cached answers.
const buildCacheKey = (intent, userMessage, destinationCountry) => {
  const country = destinationCountry || 'unknown';
  const raw = `${intent}|${userMessage}|${country}`;
  const hash = crypto.createHash('md5').update(raw).digest('hex');
  return `chat:${hash}`;
};

// Reads a cached answer from Redis. Returns the string on hit, null on miss.
// Any Redis error is swallowed and treated as a miss so chat keeps working.
const getCachedAnswer = async (key) => {
  if (!redisClient) return null;
  try {
    const cached = await redisClient.get(key);
    return cached;
  } catch (error) {
    console.warn('Redis get failed:', error.message);
    return null;
  }
};

// Writes an answer to Redis with the TTL. Fire-and-forget semantics —
// any error is logged and swallowed so a cache failure never breaks chat.
const setCachedAnswer = async (key, answer) => {
  if (!redisClient) return;
  try {
    await redisClient.set(key, answer, 'EX', CACHE_TTL_SECONDS);
  } catch (error) {
    console.warn('Redis set failed:', error.message);
  }
};

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

    // chat:message -- receives user message, streams agent response token by token
    // (or emits the cached answer in one chunk), saves both messages to ChatHistory,
    // emits chat:done with a fromCache flag.
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

        console.log('[chat:message] userId:', socket.user.id);
        console.log('[chat:message] message:', userMessage);
        console.log('[chat:message] intent:', intent);
        console.log('[chat:message] userProfile:', JSON.stringify(userProfile));

        // ── Cache lookup ────────────────────────────────────────────────
        // Only cache deterministic, profile-bound answers. General agent replies
        // depend on recent chat history so we always run them fresh.
        const cacheKey = buildCacheKey(intent, userMessage, user.destinationCountry);
        const cacheable = CACHEABLE_INTENTS.has(intent);
        const cachedAnswer = cacheable ? await getCachedAnswer(cacheKey) : null;

        let fullAnswer = '';
        let fromCache = false;

        if (cachedAnswer) {
          // Cache hit — emit the full answer as a single token chunk.
          // ChatPage's handleToken creates the streaming bubble on first token
          // and appends on subsequent ones, so one big chunk just fills it instantly.
          fromCache = true;
          fullAnswer = cachedAnswer;
          socket.emit('chat:token', { token: cachedAnswer });
        } else {
          // Cache miss — call the agent and stream tokens as they arrive.
          const streamIterable = await agent.stream({
            userMessage,
            recentMessages,
            ...userProfile,
          });

          for await (const token of streamIterable) {
            fullAnswer += token;
            socket.emit('chat:token', { token });
          }

          // Write to cache after the full answer has streamed successfully.
          // We only cache successful streams — never partial answers from a failed one.
          if (cacheable && fullAnswer.length > 0) {
            await setCachedAnswer(cacheKey, fullAnswer);
          }
        }

        // Save user message then bot reply to ChatHistory — runs on both
        // cache hit and cache miss. Each user still needs their own history
        // entry for /api/chat/history on reload and for the general agent's
        // conversation context on subsequent messages.
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

        console.log('[chat:message] fromCache:', fromCache);
        console.log('[chat:message] answer length:', fullAnswer.length);
        console.log('[chat:message] answer first 200 chars:', fullAnswer.slice(0, 200));

        socket.emit('chat:done', { intent, savedBotMessage, fromCache });
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