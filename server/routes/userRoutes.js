// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { getProfile, updateProfile, updateChecklist, changePassword } = require('../controllers/userController');

// All user routes are protected — JWT required
router.get('/profile', protect, getProfile);
router.patch('/profile', protect, updateProfile);
router.patch('/checklist', protect, updateChecklist);
router.patch('/password', protect, changePassword);

module.exports = router;