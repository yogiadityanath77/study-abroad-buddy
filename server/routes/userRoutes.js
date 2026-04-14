const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  getProfile,
  updateProfile,
  updateChecklist,
  getChecklist,
  changePassword,
} = require('../controllers/userController');

router.get('/profile', protect, getProfile);
router.patch('/profile', protect, updateProfile);
router.get('/checklist', protect, getChecklist);
router.patch('/checklist', protect, updateChecklist);
router.patch('/password', protect, changePassword);

module.exports = router;