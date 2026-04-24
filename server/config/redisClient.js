// server/config/redisClient.js
// ioredis client wrapping the Upstash Redis instance.
// The client is exported as a singleton — one connection for the whole server process.
// All Redis errors are caught by the caller (chatSocket.js) so a Redis outage never
// takes chat down — we simply fall through to calling the agent.

const Redis = require('ioredis');

// Lazily construct the client only if REDIS_URL is set.
// In local dev without Redis, this stays null and all cache lookups skip cleanly.
let redisClient = null;

if (process.env.REDIS_URL) {
  // Upstash URLs use the rediss:// scheme (TLS). ioredis handles that automatically.
  // maxRetriesPerRequest: 2 prevents requests from hanging forever if Redis is down.
  // enableOfflineQueue: false makes commands fail fast instead of queuing while disconnected.
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    lazyConnect: false,
  });

  redisClient.on('connect', () => {
    console.log('Redis: connected');
  });

  // Log and swallow connection errors so they don't crash the process.
  // Individual command errors are still surfaced to the caller via try/catch.
  redisClient.on('error', (err) => {
    console.warn('Redis error:', err.message);
  });
} else {
  console.warn('REDIS_URL not set — agent response caching is disabled');
}

module.exports = redisClient;