const openaiClient = require('../config/openaiClient');

// Classifies a user's message into one of five intents:
// visa, health, culture, housing, or general.
// Uses gpt-4o-mini at temperature 0 for fast, deterministic classification.
// Returns the intent string. Falls back to "general" if parsing fails for any reason.
const classifyIntent = async (message) => {
  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 20,
      messages: [
        {
          role: 'system',
          content: `You are an intent classifier for a study abroad assistant app.
Classify the user's message into exactly one of these five categories:
- visa: questions about visas, documents, embassy, residence permits, work rights, blocked accounts
- health: questions about vaccines, insurance, medications, doctors, mental health, hospitals, tap water safety, food safety, homesickness, anxiety, wellbeing
- culture: questions about social norms, tipping, transport, food, SIM cards, language, customs
- housing: questions about accommodation, rent, apartments, dormitories, lease, housing platforms
- general: anything else — packing, budgeting, flights, logistics, emotions, language learning, general advice

Reply with a single JSON object and nothing else. Example: {"intent":"visa"}`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
    });

    const raw = response.choices[0].message.content.trim();
    const parsed = JSON.parse(raw);

    const validIntents = ['visa', 'health', 'culture', 'housing', 'general'];

    // Validate the returned intent is one of the five allowed values
    if (parsed.intent && validIntents.includes(parsed.intent)) {
      return parsed.intent;
    }

    // Intent was parsed but not a valid value — fall back to general
    return 'general';
  } catch (error) {
    // JSON parse failed or API call failed — always fall back to general
    // so the user still gets a response rather than an error
    console.error('classifyIntent fallback triggered:', error.message);
    return 'general';
  }
};

module.exports = { classifyIntent };