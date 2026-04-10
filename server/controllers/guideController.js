// server/controllers/guideController.js
const User = require('../models/User');

// Hardcoded placeholder content for each guide type
// These will be replaced by real agent responses in Week 3
const placeholderContent = {
  visa: {
    visaType: 'Student Visa (Type D)',
    requiredDocuments: [
      'Valid passport',
      'University acceptance letter',
      'Proof of financial means',
      'Health insurance',
      'Passport photos',
    ],
    processingTime: '4 to 8 weeks',
    embassyLink: 'https://www.auswaertiges-amt.de',
    notes: 'This is placeholder content — real data will be loaded in Week 3.',
  },
  health: {
    vaccines: [
      'Routine vaccines (MMR, Tdap)',
      'Hepatitis A',
      'Hepatitis B',
    ],
    foodWaterSafety: 'Tap water is generally safe in most of Europe.',
    insuranceTips: 'Get an EHIC card if travelling within Europe.',
    emergencyContacts: {
      police: '110',
      ambulance: '112',
    },
    notes: 'This is placeholder content — real data will be loaded in Week 3.',
  },
  culture: {
    socialNorms: 'Punctuality is highly valued.',
    tipping: 'Round up the bill or tip 5 to 10% in restaurants.',
    transport: 'Excellent public transport — get a monthly pass.',
    food: 'Try local markets for affordable fresh food.',
    simCards: 'Prepaid SIMs available at airports and supermarkets.',
    notes: 'This is placeholder content — real data will be loaded in Week 3.',
  },
  housing: {
    accommodationTypes: [
      'Student dormitory (Studentenwohnheim)',
      'Shared apartment (WG)',
      'Private studio',
    ],
    rentRanges: '300 to 800 EUR per month depending on city and type.',
    searchPlatforms: [
      'https://www.uniplaces.com',
      'https://www.wg-gesucht.de',
      'https://www.studitemps.de',
    ],
    leaseTips: 'Start searching at least 3 months before arrival.',
    notes: 'This is placeholder content — real data will be loaded in Week 3.',
  },
};

// Returns the guide for the requested type, personalised with user's destination
const getGuide = async (req, res) => {
  const { type } = req.params;
  const validTypes = ['visa', 'health', 'culture', 'housing'];

  try {
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid guide type' });
    }

    // Load user profile so we can personalise the response later
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      type,
      destination: {
        country: user.destinationCountry || 'Not set',
        city: user.destinationCity || 'Not set',
      },
      homeCountry: user.homeCountry || 'Not set',
      content: placeholderContent[type],
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getGuide };