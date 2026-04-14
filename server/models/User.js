const mongoose = require('mongoose');

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
    // The ticked items — array of item strings the user has checked off.
    checklist: {
      type: [String],
      default: [],
    },
    // The AI-generated full list of checklist items.
    // Populated once on first dashboard load, regenerated if profile changes.
    checklistItems: {
      type: [String],
      default: [],
    },
    // Ticked visa documents — persisted so they survive page refresh.
    tickedDocs: {
      type: [String],
      default: [],
    },
    // Ticked vaccine items — persisted so they survive page refresh.
    tickedVaccines: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);