// server/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes'); // ADD THIS 1
const userRoutes = require('./routes/userRoutes'); // ADD THIS 2
const chatRoutes = require('./routes/chatRoutes'); // ADD THIS 3
const guideRoutes = require('./routes/guideRoutes'); // ADD THIS 4
// Load .env variables before anything else
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());           // Allows requests from your React frontend
app.use(express.json());   // Parses incoming JSON request bodies

// Health check route — lets you confirm the server is running
app.get('/', (req, res) => {
  res.json({ message: 'Study Abroad Buddy API is running' });
});

// Placeholder

app.use('/api/auth', authRoutes); // ADD THIS 1
app.use('/api/user', userRoutes); // ADD THIS 2
app.use('/api/chat', chatRoutes); // ADD THIS 3
app.use('/api/guide', guideRoutes); // ADD THIS 4

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});