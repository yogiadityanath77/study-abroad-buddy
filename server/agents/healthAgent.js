// server/agents/healthAgent.js

const { ChatOpenAI } = require('@langchain/openai');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence, RunnableLambda } = require('@langchain/core/runnables');

const openaiClient = require('../config/openaiClient');
const { ragQuery } = require('../utils/ragQuery');

// Fixed disclaimer appended to every chat response — matches Phase 1 behaviour.
const DOCTOR_DISCLAIMER = '\n\nConsult a doctor before travelling.';

// ── LangChain chain (built once at module load) ──────────────────────────────
// Same pattern as visaAgent: input → { context, formattedDate, userMessage, destinationCountry }
// → prompt → model → string. The disclaimer is NOT appended inside the chain —
// run() appends it after the chain returns, stream() yields it as a final chunk.

const chatModel = new ChatOpenAI({
  model: 'gpt-4o',
  temperature: 0.3,
  streaming: true,
});

// System prompt kept EXACTLY the same wording as Phase 1.
const systemTemplate = `You are a travel health assistant for international students.
The student is travelling to {destinationCountry} starting {formattedDate}.
Use the following travel health information to answer their question clearly and helpfully.
If the specific information is not in the provided context, give sensible general guidance and say it is general advice.
Focus on practical steps the student can take before and after arrival.

Health information context:
{context}`;

const healthPrompt = ChatPromptTemplate.fromMessages([
  ['system', systemTemplate],
  ['user', '{userMessage}'],
]);

// Retrieves top 4 health_docs chunks and joins them.
const buildContext = new RunnableLambda({
  func: async ({ userMessage, destinationCountry }) => {
    const searchQuery = `${userMessage} ${destinationCountry} student travel health`;
    const chunks = await ragQuery('health_docs', searchQuery, 4);
    return chunks.join('\n\n---\n\n');
  },
});

// Formats travelStartDate as a readable string, matching Phase 1 formatting.
const formatDate = (travelStartDate) => {
  if (!travelStartDate) return 'an upcoming date';
  return new Date(travelStartDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const healthChain = RunnableSequence.from([
  {
    userMessage: (input) => input.userMessage,
    destinationCountry: (input) => input.destinationCountry,
    formattedDate: (input) => formatDate(input.travelStartDate),
    context: buildContext,
  },
  healthPrompt,
  chatModel,
  new StringOutputParser(),
]);

// ── Exports ──────────────────────────────────────────────────────────────────

// Chat function — invokes the chain and appends the doctor disclaimer.
// Same input/output contract as Phase 1.
const run = async ({ userMessage, destinationCountry, travelStartDate }) => {
  try {
    const answer = await healthChain.invoke({
      userMessage,
      destinationCountry,
      travelStartDate,
    });
    return `${answer}${DOCTOR_DISCLAIMER}`;
  } catch (error) {
    throw new Error(`Health agent failed: ${error.message}`);
  }
};

// Streaming chat function — yields tokens from the chain, then yields the
// disclaimer as a final chunk. chatSocket.js accumulates every yield into
// fullAnswer so the cached value includes the disclaimer too.
const stream = async function* ({ userMessage, destinationCountry, travelStartDate }) {
  try {
    const chainStream = await healthChain.stream({
      userMessage,
      destinationCountry,
      travelStartDate,
    });

    for await (const chunk of chainStream) {
      if (chunk) {
        yield chunk;
      }
    }

    // Final chunk — matches Phase 1 stream() behaviour.
    yield DOCTOR_DISCLAIMER;
  } catch (error) {
    throw new Error(`Health agent stream failed: ${error.message}`);
  }
};

// Guide page function — UNCHANGED from Phase 1/2.
// Kept on raw OpenAI SDK because structured JSON output doesn't benefit from LangChain.
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