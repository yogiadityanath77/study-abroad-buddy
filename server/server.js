// server/server.js

// Load .env variables before anything else
require('dotenv').config(); // must be the very first line

const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const guideRoutes = require('./routes/guideRoutes');
const { initChatSocket } = require('./socket/chatSocket');

// Ensure GuideCache model is registered with Mongoose on startup.
require('./models/GuideCache');

// Connect to MongoDB
connectDB();

const app = express();

// Create the HTTP server manually so Socket.io can share the same port.
const server = http.createServer(app);

// Initialise Socket.io and attach it to the HTTP server.
initChatSocket(server);

// CORS config -- allows requests from the React frontend.
// In development CLIENT_URL is not set so all origins are allowed.
// In production CLIENT_URL is set to the Vercel URL on Render.
const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'Study Abroad Buddy API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/guide', guideRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});