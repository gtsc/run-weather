import { anthropic, HAIKU } from '../client';
import { RECOMMEND_SYSTEM, UPDATE_MEMORY_SYSTEM } from '../prompts';
import { formatWeather } from '../utils';
import { CASES } from './cases';
import { judge, type JudgeVerdict } from './judge';

// Pass 'sonnet' as the first arg to compare models:
//   npx tsx lab/eval/run.ts
//   npx tsx lab/eval/run.ts sonnet
const modelArg = process.argv[2];
const REC_MODEL = modelArg === 'sonnet' ? 'claude-sonnet-4-6' : HAIKU;

function truncate(s: string, max = 120): string {
  const single = s.replace(/\s+/g, ' ').trim();
  return single.length > max ? single.slice(0, max) + '…' : single;
}

async function getRecommendation(
  weatherFormatted: string,
  runDescription: string,
  memory: string,
): Promise<string> {
  const userMessage = `Weather:\n${weatherFormatted}\n\nRun: ${runDescription || 'Not specified'}\n\nPersonal notes:\n${memory || '(none)'}`;
  const response = await anthropic.messages.create({
    model: REC_MODEL,
    max_tokens: 256,
    system: RECOMMEND_SYSTEM,
    messages: [{ role: 'user', content: userMessage }],
  });
  const block = response.content[0];
  if (block.type !== 'text') throw new Error('Unexpected block type');
  return block.text.trim();
}

async function getUpdatedMemory(
  weatherFormatted: string,
  runDescription: string,
  originalSuggestion: string,
  feedback: string,
  memoryBefore: string,
): Promise<string> {
  const userMessage = [
    `Current memory:\n${memoryBefore || '(none)'}`,
    `Weather at the time of the run:\n${weatherFormatted}`,
    `Run: ${runDescription || 'Not specified'}`,
    `Original suggestion:\n${originalSuggestion}`,
    `Feedback:\n${feedback}`,
  ].join('\n\n');

  const response = await anthropic.messages.create({
    model: REC_MODEL,
    max_tokens: 512,
    system: UPDATE_MEMORY_SYSTEM,
    messages: [{ role: 'user', content: userMessage }],
  });
  const block = response.content[0];
  if (block.type !== 'text') throw new Error('Unexpected block type');
  return block.text.trim();
}

function printVerdict(verdict: JudgeVerdict, hasExpectedRec1: boolean): void {
  if (hasExpectedRec1 && verdict.rec1Pass !== null) {
    const icon = verdict.rec1Pass ? '  ✓' : '  ✗';
    console.log(`${icon} rec-1: ${verdict.rec1Reasoning}`);
  }
  const icon = verdict.rec2Pass ? '  ✓' : '  ✗';
  console.log(`${icon} rec-2: ${verdict.rec2Reasoning}`);
}

async function main(): Promise<void> {
  console.log(`Model: ${REC_MODEL}`);
  console.log(`Cases: ${CASES.length}\n`);

  const failures: string[] = [];

  for (let i = 0; i < CASES.length; i++) {
    const c = CASES[i];
    console.log(`[${i + 1}/${CASES.length}] ${c.name}`);

    try {
      const weatherFormatted = formatWeather(c.weather);

      const rec1 = await getRecommendation(weatherFormatted, c.runDescription, c.memoryBefore);
      console.log(`  rec-1: ${truncate(rec1)}`);

      const updatedMemory = await getUpdatedMemory(
        weatherFormatted,
        c.runDescription,
        rec1,
        c.feedback,
        c.memoryBefore,
      );

      const rec2 = await getRecommendation(weatherFormatted, c.runDescription, updatedMemory);
      console.log(`  rec-2: ${truncate(rec2)}`);

      const verdict = await judge({
        weatherFormatted,
        runDescription: c.runDescription,
        memoryBefore: c.memoryBefore,
        rec1,
        expectedRec1: c.expectedRecommendation1,
        feedback: c.feedback,
        updatedMemory,
        rec2,
        expectedLesson: c.expectedLesson,
      });

      printVerdict(verdict, !!c.expectedRecommendation1);

      if (verdict.overallPass) {
        console.log('  ✓ PASS\n');
      } else {
        console.log('  ✗ FAIL\n');
        failures.push(c.name);
      }
    } catch (err) {
      console.log(`  ✗ ERROR: ${err instanceof Error ? err.message : String(err)}\n`);
      failures.push(`${c.name} (error)`);
    }
  }

  const passed = CASES.length - failures.length;
  console.log('─'.repeat(40));
  console.log(`${passed}/${CASES.length} passed`);
  if (failures.length > 0) {
    console.log(`Failed: ${failures.join(', ')}`);
  }
}

main().catch(console.error);
