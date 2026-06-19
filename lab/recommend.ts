import { anthropic, SONNET } from './client';
import { RECOMMEND_SYSTEM } from './prompts';
import { SEED_MEMORY, SAMPLE_WEATHER } from './fixtures';
import { formatWeather } from './utils';

// Edit these to try different scenarios
const weather = SAMPLE_WEATHER;
const runDescription = 'Tempo 10k, targeting ~160bpm';
const memory = SEED_MEMORY; // swap to '' to test cold-start

const userMessage = `Weather:
${formatWeather(weather)}

Run: ${runDescription || 'Not specified'}

Personal notes:
${memory || '(none)'}`;

async function main() {
  console.log('=== Input ===');
  console.log(userMessage);
  console.log('\n=== Recommendation ===');

  const response = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 256,
    system: RECOMMEND_SYSTEM,
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = response.content[0];
  if (block.type !== 'text') throw new Error(`Unexpected block type: ${block.type}`);
  console.log(block.text);
}

main().catch(console.error);
