// Tests the intent classifier against 20 queries covering all five intents.
// Prints each query, the expected intent, the actual intent, and pass/fail.
// Usage: node server/scripts/testClassifier.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { classifyIntent } = require('../router/intentClassifier');

// 20 test cases — 4 per intent category
const TEST_CASES = [
  // visa
  { message: 'What documents do I need for a German student visa?', expected: 'visa' },
  { message: 'How long does visa processing take for the UK?', expected: 'visa' },
  { message: 'Do I need a blocked account to study in Germany?', expected: 'visa' },
  { message: 'Can I work while on a student visa in France?', expected: 'visa' },

  // health
  { message: 'What vaccines do I need before going to Germany?', expected: 'health' },
  { message: 'How do I get health insurance as a student in the UK?', expected: 'health' },
  { message: 'Is the tap water safe to drink in France?', expected: 'health' },
  { message: 'I am feeling really homesick and anxious about moving abroad', expected: 'health' },

  // culture
  { message: 'How much should I tip in restaurants in Germany?', expected: 'culture' },
  { message: 'What are the quiet hours rules in Germany?', expected: 'culture' },
  { message: 'How do I buy a SIM card in the UK?', expected: 'culture' },
  { message: 'Is it rude to be late in France?', expected: 'culture' },

  // housing
  { message: 'How much does student accommodation cost in Berlin?', expected: 'housing' },
  { message: 'What is the best website to find a flat in London?', expected: 'housing' },
  { message: 'What should I look for in a rental contract in France?', expected: 'housing' },
  { message: 'Is it better to live in a student dorm or a shared apartment?', expected: 'housing' },

  // general
  { message: 'What should I pack for a year abroad in Germany?', expected: 'general' },
  { message: 'How much money do I need per month as a student in Paris?', expected: 'general' },
  { message: 'How do I book cheap flights to Europe?', expected: 'general' },
  { message: 'Any tips for making friends when you first arrive?', expected: 'general' },
];

const runTests = async () => {
  console.log('Running intent classifier tests...\n');

  let passed = 0;
  let failed = 0;

  for (const test of TEST_CASES) {
    const actual = await classifyIntent(test.message);
    const ok = actual === test.expected;

    if (ok) {
      passed++;
      console.log(`✓ [${actual}] "${test.message}"`);
    } else {
      failed++;
      console.log(`✗ [${actual}] expected [${test.expected}] — "${test.message}"`);
    }
  }

  console.log(`\n${passed}/${TEST_CASES.length} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('\nFailed cases are worth reviewing — consider tweaking the classifier system prompt.');
  } else {
    console.log('\nAll tests passed.');
  }
};

runTests();