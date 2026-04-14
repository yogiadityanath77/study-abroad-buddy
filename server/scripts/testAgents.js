// Tests all five agents end-to-end with realistic inputs.
// Prints the full response from each agent so you can review quality.
// Usage: node server/scripts/testAgents.js
// ChromaDB must be running before running this script.

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const visaAgent = require('../agents/visaAgent');
const healthAgent = require('../agents/healthAgent');
const cultureAgent = require('../agents/cultureAgent');
const housingAgent = require('../agents/housingAgent');
const generalAgent = require('../agents/generalAgent');

// Shared test profile — simulates a student from India going to Germany
const PROFILE = {
  homeCountry: 'India',
  destinationCountry: 'Germany',
  destinationCity: 'Berlin',
  travelStartDate: new Date('2025-09-01'),
  travelEndDate: new Date('2026-07-31'),
};

// Prints a section header, runs the agent, prints the response, handles errors
const testAgent = async (name, agentFn) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`AGENT: ${name}`);
  console.log('='.repeat(60));

  try {
    const answer = await agentFn();
    console.log(answer);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
  }
};

const runAllTests = async () => {
  console.log('Testing all agents...');
  console.log(`Profile: ${PROFILE.homeCountry} → ${PROFILE.destinationCity}, ${PROFILE.destinationCountry}`);

  await testAgent('Visa Agent', () =>
    visaAgent.run({
      userMessage: 'What documents do I need for a German student visa?',
      homeCountry: PROFILE.homeCountry,
      destinationCountry: PROFILE.destinationCountry,
    })
  );

  await testAgent('Health Agent', () =>
    healthAgent.run({
      userMessage: 'What vaccines do I need before going to Germany?',
      destinationCountry: PROFILE.destinationCountry,
      travelStartDate: PROFILE.travelStartDate,
    })
  );

  await testAgent('Culture Agent', () =>
    cultureAgent.run({
      userMessage: 'What are the most important cultural rules I should know in Germany?',
      destinationCountry: PROFILE.destinationCountry,
    })
  );

  await testAgent('Housing Agent', () =>
    housingAgent.run({
      userMessage: 'How much does student accommodation cost in Berlin and where should I look?',
      destinationCity: PROFILE.destinationCity,
      destinationCountry: PROFILE.destinationCountry,
      travelStartDate: PROFILE.travelStartDate,
      travelEndDate: PROFILE.travelEndDate,
    })
  );

  await testAgent('General Agent', () =>
    generalAgent.run({
      userMessage: 'What should I pack for a year studying in Germany?',
      destinationCountry: PROFILE.destinationCountry,
      destinationCity: PROFILE.destinationCity,
      // Simulating last 5 messages — empty array is fine for first message
      recentMessages: [],
    })
  );

  console.log(`\n${'='.repeat(60)}`);
  console.log('All agent tests complete.');
};

runAllTests();