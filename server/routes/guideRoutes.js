// server/routes/guideRoutes.js
const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { getGuide } = require('../controllers/guideController');

// GET /api/guide/visa
// GET /api/guide/health
// GET /api/guide/culture
// GET /api/guide/housing
router.get('/:type', protect, getGuide);

module.exports = router;