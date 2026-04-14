const mongoose = require('mongoose');

// Caches AI-generated guide content per user per guide type.
// Avoids calling the agent on every page load — content is regenerated
// only when the cache is missing or the user's profile changes.
const guideCacheSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['visa', 'health', 'culture', 'housing'],
      required: true,
    },
    // The AI-generated content object — shape matches what each guide page expects.
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    // Snapshot of profile fields used to generate this cache entry.
    // If any of these change, the cache is invalidated and regenerated.
    generatedFor: {
      homeCountry: String,
      destinationCountry: String,
      destinationCity: String,
      travelStartDate: Date,
      travelEndDate: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index — one cache entry per user per guide type.
guideCacheSchema.index({ userId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('GuideCache', guideCacheSchema);