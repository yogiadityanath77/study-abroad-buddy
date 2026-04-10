// server/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { getHistory, sendMessage } = require('../controllers/chatController');

// All chat routes are protected — JWT required
router.get('/history', protect, getHistory);
router.post('/message', protect, sendMessage);

module.exports = router;