// server/agents/visaAgent.js

const { ChatOpenAI } = require('@langchain/openai');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence, RunnableLambda } = require('@langchain/core/runnables');

const openaiClient = require('../config/openaiClient');
const { ragQuery } = require('../utils/ragQuery');

// ── LangChain chain (built once at module load) ──────────────────────────────
// The chain is a RunnableSequence (LCEL):
//   input → { context, userMessage, homeCountry, destinationCountry } → prompt → model → string
//
// The context step calls our existing ragQuery() so the Pinecone retrieval
// stays identical to the Phase 1/2 behaviour (same search-query augmentation,
// same graceful fallback to [] on Pinecone failure). We are not using
// @langchain/pinecone -- that package pins an older Pinecone SDK and would
// conflict with the v7 client we already have.

// Chat model for free-form answers -- matches Phase 2 Week 1 settings.
// streaming: true so chain.stream() yields real tokens as they arrive from OpenAI.
const chatModel = new ChatOpenAI({
  model: 'gpt-4o',
  temperature: 0.3,
  streaming: true,
});

// System prompt kept EXACTLY the same wording as the Phase 1 visaAgent.
// LangChain templates use {varName} for substitution, so literal curly braces in
// the prompt text must be escaped as {{ and }} -- there are none here, good.
const systemTemplate = `You are a visa guidance assistant for international students.
The student is travelling from {homeCountry} to {destinationCountry} for university study.
Use the following official visa information to answer their question accurately and clearly.
If the information needed is not in the provided context, say so honestly -- do not invent visa requirements.
Always recommend the student verify requirements with the official embassy website before applying.

Visa information context:
{context}`;

const visaPrompt = ChatPromptTemplate.fromMessages([
  ['system', systemTemplate],
  ['user', '{userMessage}'],
]);

// Retrieves the top 4 visa_docs chunks and joins them into a single context string.
// Wrapped in RunnableLambda so it can slot into the chain as a regular step.
// The input is the full chain input object; the output is the joined string.
const buildContext = new RunnableLambda({
  func: async ({ userMessage, homeCountry, destinationCountry }) => {
    const searchQuery = `${userMessage} ${homeCountry} to ${destinationCountry} student visa`;
    const chunks = await ragQuery('visa_docs', searchQuery, 4);
    return chunks.join('\n\n---\n\n');
  },
});

// The full chain:
// 1. Spread the input object as-is AND compute context from it in parallel
// 2. Feed the combined object to the prompt template
// 3. Pipe the rendered prompt to the chat model
// 4. Parse the AIMessage output into a plain string
const visaChain = RunnableSequence.from([
  {
    userMessage: (input) => input.userMessage,
    homeCountry: (input) => input.homeCountry,
    destinationCountry: (input) => input.destinationCountry,
    context: buildContext,
  },
  visaPrompt,
  chatModel,
  new StringOutputParser(),
]);

// ── Exports ──────────────────────────────────────────────────────────────────

// Chat function -- free-form answer for use in the AI chat page and guide cache.
// Invokes the chain and returns the full answer as a single string.
// Same input/output contract as Phase 1 so chatSocket.js, agentRouter.js, and
// any callers of run() continue to work without any changes.
const run = async ({ userMessage, homeCountry, destinationCountry }) => {
  try {
    const answer = await visaChain.invoke({
      userMessage,
      homeCountry,
      destinationCountry,
    });
    return answer;
  } catch (error) {
    throw new Error(`Visa agent failed: ${error.message}`);
  }
};

// Streaming chat function -- yields tokens one by one as an async generator.
// chatSocket.js iterates this with for-await-of and emits each token immediately.
// The LCEL chain streams natively because chatModel has streaming: true and
// StringOutputParser passes chunks through as plain strings.
const stream = async function* ({ userMessage, homeCountry, destinationCountry }) {
  try {
    const chainStream = await visaChain.stream({
      userMessage,
      homeCountry,
      destinationCountry,
    });

    // Each chunk is already a string because of StringOutputParser.
    // Skip empty chunks so chatSocket.js does not emit blank chat:token events.
    for await (const chunk of chainStream) {
      if (chunk) {
        yield chunk;
      }
    }
  } catch (error) {
    throw new Error(`Visa agent stream failed: ${error.message}`);
  }
};

// Guide page function -- UNCHANGED from Phase 1/2.
// Returns structured JSON for the visa guide page. Intentionally stays on the
// raw OpenAI SDK because this is a structured-JSON call, not streaming chat,
// and the guide cache in MongoDB makes this a cold path. No value in refactoring.
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