// server/agents/housingAgent.js

const openaiClient = require('../config/openaiClient');

// Chat function — free-form answer for use in the AI chat page.
const run = async ({ userMessage, destinationCity, destinationCountry, travelStartDate, travelEndDate }) => {
  try {
    let durationText = 'an extended period';
    if (travelStartDate && travelEndDate) {
      const start = new Date(travelStartDate);
      const end = new Date(travelEndDate);
      const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));
      durationText = `approximately ${months} month${months !== 1 ? 's' : ''}`;
    }

    const systemPrompt = `You are a student housing advisor for international students.
The student is moving to ${destinationCity}, ${destinationCountry} for ${durationText} to study at university.
Answer their housing question with practical, specific advice for ${destinationCity}.
Cover relevant topics such as: types of student accommodation available, typical rent ranges for the area,
the best platforms and websites to search for housing, lease terms and tenant rights,
what to watch out for in rental contracts, and tips for finding housing as an international student.
Be honest about costs and timelines. If you are unsure of very specific current prices, give a realistic range and say it may vary.`;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.5,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    throw new Error(`Housing agent failed: ${error.message}`);
  }
};

// Streaming chat function — same durationText calculation and system prompt as run(),
// yields tokens one by one as an async generator.
const stream = async function* ({ userMessage, destinationCity, destinationCountry, travelStartDate, travelEndDate }) {
  try {
    let durationText = 'an extended period';
    if (travelStartDate && travelEndDate) {
      const start = new Date(travelStartDate);
      const end = new Date(travelEndDate);
      const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));
      durationText = `approximately ${months} month${months !== 1 ? 's' : ''}`;
    }

    const systemPrompt = `You are a student housing advisor for international students.
The student is moving to ${destinationCity}, ${destinationCountry} for ${durationText} to study at university.
Answer their housing question with practical, specific advice for ${destinationCity}.
Cover relevant topics such as: types of student accommodation available, typical rent ranges for the area,
the best platforms and websites to search for housing, lease terms and tenant rights,
what to watch out for in rental contracts, and tips for finding housing as an international student.
Be honest about costs and timelines. If you are unsure of very specific current prices, give a realistic range and say it may vary.`;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.5,
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
  } catch (error) {
    throw new Error(`Housing agent stream failed: ${error.message}`);
  }
};

// Guide page function — returns structured JSON for the housing guide page.
// Returns an object with accommodationTypes, rentRanges, searchPlatforms, leaseTips, notes.
const getGuideContent = async ({ destinationCity, destinationCountry, travelStartDate, travelEndDate }) => {
  try {
    let durationText = 'an extended period';
    if (travelStartDate && travelEndDate) {
      const start = new Date(travelStartDate);
      const end = new Date(travelEndDate);
      const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));
      durationText = `approximately ${months} month${months !== 1 ? 's' : ''}`;
    }

    const systemPrompt = `You are a student housing advisor for international students.
The student is moving to ${destinationCity}, ${destinationCountry} for ${durationText}.

Return ONLY a valid JSON object with exactly these keys:
{
  "accommodationTypes": ["type 1", "type 2", "type 3"],
  "rentRanges": "realistic rent range for ${destinationCity} as a string",
  "searchPlatforms": ["https://platform1.com", "https://platform2.com", "https://platform3.com"],
  "leaseTips": "two or three sentences of practical lease and rental advice for international students in ${destinationCity}",
  "notes": "one sentence of important additional housing advice"
}
Return nothing except the JSON object. No markdown, no backticks, no explanation.`;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.1,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate the housing guide for a student moving to ${destinationCity}, ${destinationCountry}.` },
      ],
    });

    const raw = response.choices[0].message.content.trim();
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (error) {
    throw new Error(`Housing agent getGuideContent failed: ${error.message}`);
  }
};

module.exports = { run, stream, getGuideContent };