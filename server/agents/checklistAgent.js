const openaiClient = require('../config/openaiClient');

// Generates a personalised pre-departure checklist for a student going abroad.
// LLM-only — no ChromaDB. Uses destination, university, and trip dates as context.
// Returns an array of strings, each one a specific actionable checklist item.
const generateChecklist = async ({ homeCountry, destinationCountry, destinationCity, university, travelStartDate, travelEndDate }) => {
  try {
    let durationText = 'an extended period';
    if (travelStartDate && travelEndDate) {
      const start = new Date(travelStartDate);
      const end = new Date(travelEndDate);
      const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));
      durationText = `approximately ${months} month${months !== 1 ? 's' : ''}`;
    }

    const formattedStart = travelStartDate
      ? new Date(travelStartDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'an upcoming date';

    const systemPrompt = `You are a study abroad advisor helping a student prepare for their trip.
Generate a personalised pre-departure checklist of exactly 12 items for this student.

Student profile:
- Travelling from: ${homeCountry}
- Destination: ${destinationCity}, ${destinationCountry}
- University: ${university || 'their university'}
- Trip duration: ${durationText}
- Departure: ${formattedStart}

Rules for the checklist:
- Each item must be a specific, actionable task (not vague advice)
- Cover a mix of: visa/documents, health, finances, accommodation, packing, university admin, communication, and practical logistics
- Make items specific to ${destinationCountry} where possible (e.g. mention specific document names, local apps, or country-specific requirements)
- Write each item as a short imperative sentence starting with a verb (e.g. "Apply for student visa", "Open a Wise account for international transfers")
- Do not number the items

Return ONLY a valid JSON array of exactly 12 strings. No markdown, no backticks, no explanation.
Example format: ["Item one", "Item two", "Item three"]`;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.4,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Generate the checklist for a student from ${homeCountry} going to ${destinationCity}, ${destinationCountry}.`,
        },
      ],
    });

    const raw = response.choices[0].message.content.trim();
    const parsed = JSON.parse(raw);

    // Validate the response is an array of strings before returning.
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Checklist agent returned invalid format');
    }

    return parsed;
  } catch (error) {
    throw new Error(`Checklist agent failed: ${error.message}`);
  }
};

module.exports = { generateChecklist };