// server/agents/visaAgent.js

const openaiClient = require('../config/openaiClient');
const { ragQuery } = require('../utils/ragQuery');

// Chat function — free-form answer for use in the AI chat page.
// Retrieves top 4 RAG chunks and returns a prose answer string.
const run = async ({ userMessage, homeCountry, destinationCountry }) => {
  try {
    const searchQuery = `${userMessage} ${homeCountry} to ${destinationCountry} student visa`;
    const chunks = await ragQuery('visa_docs', searchQuery, 4);
    const context = chunks.join('\n\n---\n\n');

    const systemPrompt = `You are a visa guidance assistant for international students.
The student is travelling from ${homeCountry} to ${destinationCountry} for university study.
Use the following official visa information to answer their question accurately and clearly.
If the information needed is not in the provided context, say so honestly — do not invent visa requirements.
Always recommend the student verify requirements with the official embassy website before applying.

Visa information context:
${context}`;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    throw new Error(`Visa agent failed: ${error.message}`);
  }
};

// Streaming chat function — same RAG retrieval and system prompt as run(),
// but yields tokens one by one as an async generator.
// chatSocket.js iterates this with for-await-of and emits each token immediately.
const stream = async function* ({ userMessage, homeCountry, destinationCountry }) {
  try {
    const searchQuery = `${userMessage} ${homeCountry} to ${destinationCountry} student visa`;
    const chunks = await ragQuery('visa_docs', searchQuery, 4);
    const context = chunks.join('\n\n---\n\n');

    const systemPrompt = `You are a visa guidance assistant for international students.
The student is travelling from ${homeCountry} to ${destinationCountry} for university study.
Use the following official visa information to answer their question accurately and clearly.
If the information needed is not in the provided context, say so honestly — do not invent visa requirements.
Always recommend the student verify requirements with the official embassy website before applying.

Visa information context:
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

    // Iterate the OpenAI stream and yield each text delta as it arrives.
    // choices[0].delta.content is undefined on the first and last chunks — skip those.
    for await (const chunk of response) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) {
        yield token;
      }
    }
  } catch (error) {
    throw new Error(`Visa agent stream failed: ${error.message}`);
  }
};

// Guide page function — returns structured JSON for the visa guide page.
// Returns an object with visaType, requiredDocuments, processingTime, embassyLink, notes.
const getGuideContent = async ({ homeCountry, destinationCountry }) => {
  try {
    const searchQuery = `${homeCountry} to ${destinationCountry} student visa requirements documents`;
    const chunks = await ragQuery('visa_docs', searchQuery, 4);
    const context = chunks.join('\n\n---\n\n');

    const systemPrompt = `You are a visa guidance assistant for international students.
The student is travelling from ${homeCountry} to ${destinationCountry} for university study.
Use the following visa information to produce a structured guide.

Visa information context:
${context}

Return ONLY a valid JSON object with exactly these keys:
{
  "visaType": "the name of the visa required (e.g. Student Visa Type D, Tier 4 Student Visa)",
  "requiredDocuments": ["document 1", "document 2", "document 3"],
  "processingTime": "realistic processing time as a string (e.g. 4 to 8 weeks)",
  "embassyLink": "the official embassy or visa application website URL",
  "notes": "one or two sentences of important additional advice"
}
Return nothing except the JSON object. No markdown, no backticks, no explanation.`;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.1,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate the visa guide for a student from ${homeCountry} travelling to ${destinationCountry}.` },
      ],
    });

    const raw = response.choices[0].message.content.trim();
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (error) {
    throw new Error(`Visa agent getGuideContent failed: ${error.message}`);
  }
};

module.exports = { run, stream, getGuideContent };