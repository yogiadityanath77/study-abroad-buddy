// server/agents/generalAgent.js

const openaiClient = require('../config/openaiClient');

// General agent — LLM only, no ChromaDB.
// Handles anything that is not visa, health, culture, or housing:
// packing, budgets, language tips, logistics, homesickness, emotions, general questions.
// Receives the last 5 chat messages as conversation context so it can give coherent follow-up replies.
// Returns a plain text answer string.
const run = async ({ userMessage, recentMessages, destinationCountry, destinationCity }) => {
  try {
    const systemPrompt = `You are a friendly and practical study abroad assistant helping a student who is moving to ${destinationCity}, ${destinationCountry} for university.
You handle general questions about studying abroad that are not specifically about visas, health, culture, or housing.
This includes: packing lists, budgeting and money management, language learning tips, booking flights, logistics of moving abroad, dealing with homesickness, adjusting to student life, and any other practical concerns.
Be warm, encouraging, and specific. The student may be anxious about their move — be supportive as well as practical.`;

    // Build the messages array: system prompt + last 5 messages as history + current message
    // This gives the agent conversation context so it can handle follow-up questions naturally
    const messages = [{ role: 'system', content: systemPrompt }];

    if (recentMessages && recentMessages.length > 0) {
      for (const msg of recentMessages) {
        // ChatHistory uses role: 'bot' but OpenAI expects role: 'assistant'
        messages.push({
          role: msg.role === 'bot' ? 'assistant' : 'user',
          content: msg.message,
        });
      }
    }

    // Add the current user message last
    messages.push({ role: 'user', content: userMessage });

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      messages,
    });

    return response.choices[0].message.content;
  } catch (error) {
    throw new Error(`General agent failed: ${error.message}`);
  }
};

// Streaming chat function — identical messages array construction as run(),
// yields tokens one by one as an async generator.
const stream = async function* ({ userMessage, recentMessages, destinationCountry, destinationCity }) {
  try {
    const systemPrompt = `You are a friendly and practical study abroad assistant helping a student who is moving to ${destinationCity}, ${destinationCountry} for university.
You handle general questions about studying abroad that are not specifically about visas, health, culture, or housing.
This includes: packing lists, budgeting and money management, language learning tips, booking flights, logistics of moving abroad, dealing with homesickness, adjusting to student life, and any other practical concerns.
Be warm, encouraging, and specific. The student may be anxious about their move — be supportive as well as practical.`;

    const messages = [{ role: 'system', content: systemPrompt }];

    if (recentMessages && recentMessages.length > 0) {
      for (const msg of recentMessages) {
        messages.push({
          role: msg.role === 'bot' ? 'assistant' : 'user',
          content: msg.message,
        });
      }
    }

    messages.push({ role: 'user', content: userMessage });

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      stream: true,
      messages,
    });

    for await (const chunk of response) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) {
        yield token;
      }
    }
  } catch (error) {
    throw new Error(`General agent stream failed: ${error.message}`);
  }
};

module.exports = { run, stream };