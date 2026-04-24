// server/agents/generalAgent.js

const { ChatOpenAI } = require('@langchain/openai');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const { HumanMessage, AIMessage } = require('@langchain/core/messages');

// ── LangChain chain (built once at module load) ──────────────────────────────
// LLM-only, no RAG. Uses MessagesPlaceholder to inject the last 5 chat messages
// as structured message objects (HumanMessage/AIMessage) instead of stringifying them.
// This is the canonical LangChain way to handle chat history — the model sees
// the history as real prior turns rather than as text embedded in the system prompt.

const chatModel = new ChatOpenAI({
  model: 'gpt-4o',
  temperature: 0.7,
  streaming: true,
});

const systemTemplate = `You are a friendly and practical study abroad assistant helping a student who is moving to {destinationCity}, {destinationCountry} for university.
You handle general questions about studying abroad that are not specifically about visas, health, culture, or housing.
This includes: packing lists, budgeting and money management, language learning tips, booking flights, logistics of moving abroad, dealing with homesickness, adjusting to student life, and any other practical concerns.
Be warm, encouraging, and specific. The student may be anxious about their move — be supportive as well as practical.`;

const generalPrompt = ChatPromptTemplate.fromMessages([
  ['system', systemTemplate],
  new MessagesPlaceholder('history'),
  ['user', '{userMessage}'],
]);

// Converts the Mongoose ChatHistory documents to LangChain message objects.
// ChatHistory uses role: 'user' | 'bot'; LangChain uses HumanMessage | AIMessage.
const toHistoryMessages = (recentMessages) => {
  if (!recentMessages || recentMessages.length === 0) return [];
  return recentMessages.map((msg) =>
    msg.role === 'bot' ? new AIMessage(msg.message) : new HumanMessage(msg.message)
  );
};

const generalChain = RunnableSequence.from([
  {
    userMessage: (input) => input.userMessage,
    destinationCity: (input) => input.destinationCity,
    destinationCountry: (input) => input.destinationCountry,
    history: (input) => toHistoryMessages(input.recentMessages),
  },
  generalPrompt,
  chatModel,
  new StringOutputParser(),
]);

// ── Exports ──────────────────────────────────────────────────────────────────

const run = async ({ userMessage, recentMessages, destinationCountry, destinationCity }) => {
  try {
    const answer = await generalChain.invoke({
      userMessage,
      recentMessages,
      destinationCountry,
      destinationCity,
    });
    return answer;
  } catch (error) {
    throw new Error(`General agent failed: ${error.message}`);
  }
};

const stream = async function* ({ userMessage, recentMessages, destinationCountry, destinationCity }) {
  try {
    const chainStream = await generalChain.stream({
      userMessage,
      recentMessages,
      destinationCountry,
      destinationCity,
    });

    for await (const chunk of chainStream) {
      if (chunk) {
        yield chunk;
      }
    }
  } catch (error) {
    throw new Error(`General agent stream failed: ${error.message}`);
  }
};

module.exports = { run, stream };