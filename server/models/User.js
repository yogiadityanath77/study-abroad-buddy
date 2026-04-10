// server/models/User.js
const mongoose = require('mongoose');

// Defines the shape of every user document in MongoDB
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    homeCountry: {
      type: String,
      default: '',
    },
    destinationCountry: {
      type: String,
      default: '',
    },
    destinationCity: {
      type: String,
      default: '',
    },
    university: {
      type: String,
      default: '',
    },
    travelStartDate: {
      type: Date,
      default: null,
    },
    travelEndDate: {
      type: Date,
      default: null,
    },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    checklist: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model('User', userSchema);