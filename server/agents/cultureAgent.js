const openaiClient = require('../config/openaiClient');
const { ragQuery } = require('../utils/ragQuery');

// Chat function — free-form answer for use in the AI chat page.
const run = async ({ userMessage, destinationCountry }) => {
  try {
    const searchQuery = `${userMessage} ${destinationCountry} culture customs student`;
    const chunks = await ragQuery('culture_docs', searchQuery, 4);
    const context = chunks.join('\n\n---\n\n');

    const systemPrompt = `You are a culture guide assistant for international students moving to ${destinationCountry}.
Use the following cultural information to answer the student's question helpfully and practically.
Be specific to ${destinationCountry} where possible. If the information is not in the provided context,
draw on general knowledge but make clear it is general guidance rather than destination-specific.
Aim to help the student feel confident and prepared for daily life in their new country.

Culture information context:
${context}`;

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
    throw new Error(`Culture agent failed: ${error.message}`);
  }
};

// Guide page function — returns structured JSON for the culture guide page.
// Returns an object with socialNorms, tipping, transport, food, simCards, notes.
const getGuideContent = async ({ destinationCountry }) => {
  try {
    const searchQuery = `${destinationCountry} culture social norms tipping transport food SIM cards student`;
    const chunks = await ragQuery('culture_docs', searchQuery, 4);
    const context = chunks.join('\n\n---\n\n');

    const systemPrompt = `You are a culture guide assistant for international students moving to ${destinationCountry}.
Use the following cultural information to produce a structured guide.

Culture information context:
${context}

Return ONLY a valid JSON object with exactly these keys:
{
  "socialNorms": "two or three sentences about key social norms and etiquette in ${destinationCountry}",
  "tipping": "one or two sentences about tipping customs",
  "transport": "one or two sentences about public transport options and tips",
  "food": "one or two sentences about local food culture and practical tips",
  "simCards": "one or two sentences about getting a SIM card as an international student",
  "notes": "one sentence of general cultural advice"
}
Return nothing except the JSON object. No markdown, no backticks, no explanation.`;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate the culture guide for a student moving to ${destinationCountry}.` },
      ],
    });

    const raw = response.choices[0].message.content.trim();
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (error) {
    throw new Error(`Culture agent getGuideContent failed: ${error.message}`);
  }
};

module.exports = { run, getGuideContent };