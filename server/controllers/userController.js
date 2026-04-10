// server/controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
// Returns the logged-in user's full profile
const getProfile = async (req, res) => {
  try {
    // req.user.id comes from the JWT via authMiddleware
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Updates the logged-in user's profile fields
const updateProfile = async (req, res) => {
  const {
    homeCountry,
    destinationCountry,
    destinationCity,
    university,
    travelStartDate,
    travelEndDate,
    onboardingComplete,
  } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only update fields that were actually sent in the request
    if (homeCountry !== undefined) user.homeCountry = homeCountry;
    if (destinationCountry !== undefined) user.destinationCountry = destinationCountry;
    if (destinationCity !== undefined) user.destinationCity = destinationCity;
    if (university !== undefined) user.university = university;
    if (travelStartDate !== undefined) user.travelStartDate = travelStartDate;
    if (travelEndDate !== undefined) user.travelEndDate = travelEndDate;
    if (onboardingComplete !== undefined) user.onboardingComplete = onboardingComplete;

    const updatedUser = await user.save();

    res.status(200).json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      homeCountry: updatedUser.homeCountry,
      destinationCountry: updatedUser.destinationCountry,
      destinationCity: updatedUser.destinationCity,
      university: updatedUser.university,
      travelStartDate: updatedUser.travelStartDate,
      travelEndDate: updatedUser.travelEndDate,
      onboardingComplete: updatedUser.onboardingComplete,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Replaces the user's checklist array with the new one sent from frontend
const updateChecklist = async (req, res) => {
  const { checklist } = req.body;

  try {
    if (!Array.isArray(checklist)) {
      return res.status(400).json({ message: 'Checklist must be an array' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { checklist },
      { new: true } // returns the updated document, not the old one
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ checklist: user.checklist });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verifies current password then replaces it with a new hashed password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getProfile, updateProfile, updateChecklist, changePassword };