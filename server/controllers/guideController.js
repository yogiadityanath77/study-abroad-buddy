const User = require('../models/User');
const GuideCache = require('../models/GuideCache');
const visaAgent = require('../agents/visaAgent');
const healthAgent = require('../agents/healthAgent');
const cultureAgent = require('../agents/cultureAgent');
const housingAgent = require('../agents/housingAgent');

// Maps each guide type to its agent's getGuideContent function.
const GUIDE_AGENT_MAP = {
  visa: visaAgent,
  health: healthAgent,
  culture: cultureAgent,
  housing: housingAgent,
};

// Checks whether a cached guide entry is still valid for the user's current profile.
// Returns false if any of the profile fields used to generate the cache have changed.
const isCacheValid = (cache, user) => {
  if (!cache) return false;
  const g = cache.generatedFor;
  return (
    g.homeCountry === user.homeCountry &&
    g.destinationCountry === user.destinationCountry &&
    g.destinationCity === user.destinationCity &&
    String(g.travelStartDate) === String(user.travelStartDate) &&
    String(g.travelEndDate) === String(user.travelEndDate)
  );
};

// Loads the guide for the requested type.
// Checks the MongoDB cache first — if valid, returns cached content immediately.
// If no cache or profile has changed, calls the agent, caches the result, then returns it.
const getGuide = async (req, res) => {
  const { type } = req.params;
  const validTypes = ['visa', 'health', 'culture', 'housing'];

  try {
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid guide type' });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check the cache first.
    const cached = await GuideCache.findOne({ userId: user._id, type });

    if (isCacheValid(cached, user)) {
      return res.status(200).json({
        type,
        destination: {
          country: user.destinationCountry || 'Not set',
          city: user.destinationCity || 'Not set',
        },
        homeCountry: user.homeCountry || 'Not set',
        content: cached.content,
        fromCache: true,
      });
    }

    // Cache is missing or stale — call the agent.
    const agent = GUIDE_AGENT_MAP[type];
    const content = await agent.getGuideContent({
      homeCountry: user.homeCountry,
      destinationCountry: user.destinationCountry,
      destinationCity: user.destinationCity,
      travelStartDate: user.travelStartDate,
      travelEndDate: user.travelEndDate,
    });

    // Save or replace the cache entry for this user + type.
    // findOneAndUpdate with upsert: true creates it if missing, replaces it if stale.
    await GuideCache.findOneAndUpdate(
  { userId: user._id, type },
  {
    content,
    generatedFor: {
      homeCountry: user.homeCountry,
      destinationCountry: user.destinationCountry,
      destinationCity: user.destinationCity,
      travelStartDate: user.travelStartDate,
      travelEndDate: user.travelEndDate,
    },
  },
  { upsert: true, returnDocument: 'after' }
);

    res.status(200).json({
      type,
      destination: {
        country: user.destinationCountry || 'Not set',
        city: user.destinationCity || 'Not set',
      },
      homeCountry: user.homeCountry || 'Not set',
      content,
      fromCache: false,
    });
  } catch (error) {
    // Log internally but never expose raw agent/OpenAI error messages to the client.
    console.error(`Guide controller error [${req.params.type}]:`, error.message);
    res.status(500).json({
      message: 'Could not load your guide right now. Please try again in a moment.',
    });
    
  }
};

module.exports = { getGuide };