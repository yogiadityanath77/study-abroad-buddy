// server/agents/healthAgent.js

const openaiClient = require('../config/openaiClient');
const { ragQuery } = require('../utils/ragQuery');

// Chat function — free-form answer for use in the AI chat page.
// Always appends the doctor disclaimer to every response.
const run = async ({ userMessage, destinationCountry, travelStartDate }) => {
  try {
    const formattedDate = travelStartDate
      ? new Date(travelStartDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'an upcoming date';

    const searchQuery = `${userMessage} ${destinationCountry} student travel health`;
    const chunks = await ragQuery('health_docs', searchQuery, 4);
    const context = chunks.join('\n\n---\n\n');

    const systemPrompt = `You are a travel health assistant for international students.
The student is travelling to ${destinationCountry} starting ${formattedDate}.
Use the following travel health information to answer their question clearly and helpfully.
If the specific information is not in the provided context, give sensible general guidance and say it is general advice.
Focus on practical steps the student can take before and after arrival.

Health information context:
${context}`;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    const answer = response.choices[0].message.content;
    return `${answer}\n\nConsult a doctor before travelling.`;
  } catch (error) {
    throw new Error(`Health agent failed: ${error.message}`);
  }
};

// Streaming chat function — same RAG retrieval and system prompt as run().
// Yields tokens one by one, then yields the doctor disclaimer as a final token
// after the OpenAI stream closes. This matches the behaviour of run() exactly.
const stream = async function* ({ userMessage, destinationCountry, travelStartDate }) {
  try {
    const formattedDate = travelStartDate
      ? new Date(travelStartDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'an upcoming date';

    const searchQuery = `${userMessage} ${destinationCountry} student travel health`;
    const chunks = await ragQuery('health_docs', searchQuery, 4);
    const context = chunks.join('\n\n---\n\n');

    const systemPrompt = `You are a travel health assistant for international students.
The student is travelling to ${destinationCountry} starting ${formattedDate}.
Use the following travel health information to answer their question clearly and helpfully.
If the specific information is not in the provided context, give sensible general guidance and say it is general advice.
Focus on practical steps the student can take before and after arrival.

Health information context:
${context}`;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    for await (const chunk of response) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) {
        yield token;
      }
    }

    // Emit the disclaimer as a final token after the stream ends.
    // run() appends it as a string suffix — stream() yields it the same way
    // so the accumulated fullAnswer in chatSocket.js includes it automatically.
    yield '\n\nConsult a doctor before travelling.';
  } catch (error) {
    throw new Error(`Health agent stream failed: ${error.message}`);
  }
};

// Guide page function — returns structured JSON for the health guide page.
// Returns an object with vaccines, foodWaterSafety, insuranceTips, emergencyContacts, notes.
const getGuideContent = async ({ destinationCountry, travelStartDate }) => {
  try {
    const searchQuery = `${destinationCountry} student travel health vaccines insurance emergency`;
    const chunks = await ragQuery('health_docs', searchQuery, 4);
    const context = chunks.join('\n\n---\n\n');

    const formattedDate = travelStartDate
      ? new Date(travelStartDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'an upcoming date';

    const systemPrompt = `You are a travel health assistant for international students.
The student is travelling to ${destinationCountry} starting ${formattedDate}.
Use the following travel health information to produce a structured guide.

Health information context:
${context}

Return ONLY a valid JSON object with exactly these keys:
{
  "vaccines": ["vaccine 1", "vaccine 2", "vaccine 3"],
  "foodWaterSafety": "one or two sentences about food and water safety in ${destinationCountry}",
  "insuranceTips": "one or two sentences of practical health insurance advice for this destination",
  "emergencyContacts": { "police": "number", "ambulance": "number", "emergency": "number" },
  "notes": "Consult a doctor before travelling."
}
Return nothing except the JSON object. No markdown, no backticks, no explanation.`;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.1,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate the health guide for a student travelling to ${destinationCountry}.` },
      ],
    });

    const raw = response.choices[0].message.content.trim();
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (error) {
    throw new Error(`Health agent getGuideContent failed: ${error.message}`);
  }
};

module.exports = { run, stream, getGuideContent };