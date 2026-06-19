import { anthropic, SONNET } from './client';
import { UPDATE_MEMORY_SYSTEM } from './prompts';
import { SEED_MEMORY, SAMPLE_WEATHER } from './fixtures';
import { formatWeather } from './utils';

// Edit these to match a real or hypothetical run
const weather = SAMPLE_WEATHER;
const runDescription = 'Tempo 10k, targeting ~160bpm';
const originalSuggestion =
  'Go with a long-sleeve base layer and shorts — skip the wind layer for a tempo effort at this temperature. At 160bpm you will heat up fast enough that the 22 km/h wind will not be a problem.';
const feedback =
  'Wore the base layer and shorts, felt perfect for the first 5k but got noticeably chilly in the last 3k once pace dropped. Should have brought a thin wind layer I could have tied around my waist.';
const memoryBefore = SEED_MEMORY; // swap to '' to test cold-start

const userMessage = `Current memory:
${memoryBefore || '(none)'}

Weather at the time of the run:
${formatWeather(weather)}

Run: ${runDescription || 'Not specified'}

Original suggestion:
${originalSuggestion || '(none)'}

Feedback:
${feedback}`;

async function main() {
  console.log('=== Input ===');
  console.log(userMessage);
  console.log('\n=== Updated memory ===');

  const response = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 512,
    system: UPDATE_MEMORY_SYSTEM,
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = response.content[0];
  if (block.type !== 'text') throw new Error(`Unexpected block type: ${block.type}`);
  console.log(block.text);
}

main().catch(console.error);
