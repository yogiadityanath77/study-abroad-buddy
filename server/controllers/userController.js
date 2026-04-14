// server/controllers/userController.js
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { isEndAfterStart } = require('../middleware/validate');
const { generateChecklist } = require('../agents/checklistAgent');

// Returns full user document excluding password field.
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// Updates only the fields present in req.body — does not overwrite missing fields.
// Validates date order if both dates are provided.
const updateProfile = async (req, res) => {
  const {
    homeCountry, destinationCountry, destinationCity,
    university, travelStartDate, travelEndDate, onboardingComplete,
    tickedDocs, tickedVaccines,
  } = req.body;
  try {
    // Validate date order if both dates are present in this request.
    if (travelStartDate && travelEndDate) {
      if (!isEndAfterStart(travelStartDate, travelEndDate)) {
        return res.status(400).json({ message: 'Return date must be after departure date' });
      }
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (homeCountry !== undefined) user.homeCountry = homeCountry;
    if (destinationCountry !== undefined) user.destinationCountry = destinationCountry;
    if (destinationCity !== undefined) user.destinationCity = destinationCity;
    if (university !== undefined) user.university = university;
    if (travelStartDate !== undefined) user.travelStartDate = travelStartDate;
    if (travelEndDate !== undefined) user.travelEndDate = travelEndDate;
    if (onboardingComplete !== undefined) user.onboardingComplete = onboardingComplete;
    if (tickedDocs !== undefined) user.tickedDocs = tickedDocs;
    if (tickedVaccines !== undefined) user.tickedVaccines = tickedVaccines;
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
      tickedDocs: updatedUser.tickedDocs,
      tickedVaccines: updatedUser.tickedVaccines,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// Replaces entire checklist (ticked items) array — validates that input is an array.
const updateChecklist = async (req, res) => {
  const { checklist } = req.body;
  try {
    if (!Array.isArray(checklist)) {
      return res.status(400).json({ message: 'Checklist must be an array' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { checklist },
      { returnDocument: 'after' }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ checklist: user.checklist });
  } catch (error) {
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// Returns AI-generated checklist items and the user's ticked items.
// Calls the agent only if checklistItems is empty — otherwise returns cached items.
const getChecklist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    let { checklistItems } = user;
    if (!checklistItems || checklistItems.length === 0) {
      checklistItems = await generateChecklist({
        homeCountry: user.homeCountry,
        destinationCountry: user.destinationCountry,
        destinationCity: user.destinationCity,
        university: user.university,
        travelStartDate: user.travelStartDate,
        travelEndDate: user.travelEndDate,
      });
      user.checklistItems = checklistItems;
      await user.save();
    }
    res.status(200).json({
      checklistItems,
      checklist: user.checklist,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not load checklist. Please refresh.' });
  }
};

// Verifies current password then replaces it with a new hashed password.
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
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

module.exports = { getProfile, updateProfile, updateChecklist, getChecklist, changePassword };