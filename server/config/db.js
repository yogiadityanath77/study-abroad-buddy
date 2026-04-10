// server/config/db.js
const mongoose = require('mongoose');

// Connects to MongoDB Atlas using the URI from .env
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1); // Stop the server if DB fails to connect
  }
};

module.exports = connectDB;