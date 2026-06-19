# Phase 0: Prompt Lab + Evals Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone TypeScript lab (`lab/`) for iterating on the two core AI prompts (recommend + update-memory) and an eval suite that grades whether recommendations improve after feedback.

**Architecture:** Plain TypeScript scripts run with `tsx`, no Svelte/Vite involved. Two prompts live in `lab/prompts.ts` and are called from interactive scripts (`recommend.ts`, `update-memory.ts`) for manual iteration, then exercised automatically by `lab/eval/run.ts` which uses Claude-as-judge to grade quality. All lab code is self-contained — no imports from `src/`.

**Tech Stack:** `@anthropic-ai/sdk`, `dotenv`, `tsx` (all dev dependencies); Claude Sonnet (`claude-sonnet-4-6`) for recommendations and memory updates; Claude Opus 4.8 (`claude-opus-4-8`) for judging. Note: Haiku was evaluated and rejected (9/19 eval pass rate vs Sonnet's 15/19 baseline before prompt iteration).

---

### Task 1: Install dependencies and scaffold

**Files:**
- Modify: `package.json`
- Create: `lab/client.ts`
- Create: `.env.example`

**Step 1: Install packages**

```bash
npm install --save-dev @anthropic-ai/sdk dotenv tsx
```

Expected: packages added to `devDependencies` in `package.json`.

**Step 2: Add lab scripts to package.json**

In the `"scripts"` section of `package.json`, add:

```json
"lab:recommend": "tsx lab/recommend.ts",
"lab:update": "tsx lab/update-memory.ts",
"lab:eval": "tsx lab/eval/run.ts"
```

**Step 3: Create `lab/client.ts`**

```typescript
import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY not set — copy .env.example to .env.local and add your key');
}

export const anthropic = new Anthropic();
export const HAIKU = 'claude-haiku-4-5-20251001';
```

**Step 4: Create `.env.example`**

```
ANTHROPIC_API_KEY=your-key-here
```

**Step 5: Copy to `.env.local` and add real key (manual)**

```bash
cp .env.example .env.local
# Edit .env.local and add your Anthropic API key
```

**Step 6: Verify dotenv loads the key**

```bash
npx tsx -e "import 'dotenv/config'; console.log(process.env.ANTHROPIC_API_KEY ? 'key loaded' : 'key missing')"
```

Expected: `key loaded`

**Step 7: Commit**

```bash
git add package.json package-lock.json lab/client.ts .env.example
git commit -m "feat: scaffold prompt lab with Anthropic SDK and dotenv"
```

---

### Task 2: Weather formatting utility

**Files:**
- Create: `lab/utils.ts`

**Step 1: Create `lab/utils.ts`**

```typescript
export interface WeatherInput {
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  weatherDescription: string;
  precipProbability: number;
  dewPoint: number;
}

export function formatWeather(w: WeatherInput): string {
  return `${w.weatherDescription}, ${w.temperature}°C (feels like ${w.feelsLike}°C), wind ${w.windSpeed} km/h, ${w.precipProbability}% rain chance, dew point ${w.dewPoint}°C`;
}
```

**Step 2: Verify it compiles**

```bash
npx tsx -e "import { formatWeather } from './lab/utils.ts'; console.log(formatWeather({ temperature: 10, feelsLike: 7, windSpeed: 20, weatherDescription: 'Partly cloudy', precipProbability: 15, dewPoint: 5 }))"
```

Expected: `Partly cloudy, 10°C (feels like 7°C), wind 20 km/h, 15% rain chance, dew point 5°C`

**Step 3: Commit**

```bash
git add lab/utils.ts
git commit -m "feat: add lab weather formatting utility"
```

---

### Task 3: System prompts

**Files:**
- Create: `lab/prompts.ts`

**Step 1: Create `lab/prompts.ts`**

```typescript
export const RECOMMEND_SYSTEM = `You are a personal running coach helping a runner decide what to wear.

You know the runner through their personal notes below. Use them to tailor your advice — they capture preferences ("I run cold") and lessons from past runs.

Given the weather conditions and the planned run, recommend what to wear in 2-4 sentences. Be specific: name garments (e.g. "light long-sleeve base layer", "running tights"). Start directly with the recommendation — no preamble, no "Based on the conditions...".

If the notes are empty, rely on general running knowledge.`;

export const UPDATE_MEMORY_SYSTEM = `You maintain a runner's personal notes. These notes personalise future clothing recommendations for this specific runner.

When given run details and feedback, update the notes to capture any new lesson.

Rules:
- Stay under 200 words total
- Write in second person ("you tend to run cold", "you overheat quickly")
- Preserve existing useful information
- Update or remove anything the feedback contradicts
- Only add something if the feedback reveals a genuinely useful pattern
- If the feedback adds nothing new, return the notes unchanged
- Return only the notes — no preamble, no explanation, no surrounding quotes`;
```

**Step 2: Commit**

```bash
git add lab/prompts.ts
git commit -m "feat: add recommendation and memory-update system prompts"
```

---

### Task 4: Recommendation script

**Files:**
- Create: `lab/recommend.ts`

**Step 1: Create `lab/recommend.ts`**

```typescript
import { anthropic, HAIKU } from './client.ts';
import { RECOMMEND_SYSTEM } from './prompts.ts';
import { formatWeather } from './utils.ts';

async function main() {
  // Edit these to test different scenarios
  const weather = {
    temperature: 10,
    feelsLike: 7,
    windSpeed: 20,
    weatherDescription: 'Partly cloudy',
    precipProbability: 15,
    dewPoint: 5,
  };
  const runDescription = 'Easy 10k';
  const memory = `You tend to run cold. You dislike arm warmers.`;

  const userMessage = `Weather: ${formatWeather(weather)}
Run: ${runDescription || 'Not specified'}

Runner notes:
${memory || '(none yet)'}`;

  console.log('\n--- Input ---');
  console.log(userMessage);

  const response = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 256,
    system: RECOMMEND_SYSTEM,
    messages: [{ role: 'user', content: userMessage }],
  });

  console.log('\n--- Recommendation ---');
  console.log(response.content[0].type === 'text' ? response.content[0].text : '');
  console.log('---\n');
}

main().catch(console.error);
```

**Step 2: Run it**

```bash
npm run lab:recommend
```

Expected: a 2-4 sentence clothing recommendation printed to stdout.

**Step 3: Iterate on the prompt**

Edit `lab/prompts.ts` → `RECOMMEND_SYSTEM` until the output feels right. Things to check:
- Does it name specific garments?
- Does it skip the preamble?
- Does it respect the memory notes (e.g. no arm warmers if memory says so)?
- Does it stay concise?

Try: empty memory, cold weather, tempo run, warm humid day. Re-run after each change.

**Step 4: Commit when satisfied**

```bash
git add lab/recommend.ts lab/prompts.ts
git commit -m "feat: add recommendation lab script with iterated system prompt"
```

---

### Task 5: Memory update script

**Files:**
- Create: `lab/update-memory.ts`

**Step 1: Create `lab/update-memory.ts`**

```typescript
import { anthropic, HAIKU } from './client.ts';
import { UPDATE_MEMORY_SYSTEM } from './prompts.ts';
import { formatWeather } from './utils.ts';

async function main() {
  // Edit these to test different scenarios
  const weather = {
    temperature: 8,
    feelsLike: 5,
    windSpeed: 25,
    weatherDescription: 'Overcast',
    precipProbability: 20,
    dewPoint: 3,
  };
  const runDescription = 'Easy 10k';
  const originalSuggestion = 'Shorts and a t-shirt should be fine for 8°C with some wind.';
  const feedback = 'Wore shorts and a t-shirt, was very cold the whole run, especially my legs.';
  const memoryBefore = '';

  const userMessage = `Run details:
- Conditions: ${formatWeather(weather)}
- Run type: ${runDescription}
- Suggested clothing: ${originalSuggestion}
- Feedback: ${feedback}

Current notes:
${memoryBefore || '(empty)'}`;

  console.log('\n--- Input ---');
  console.log(userMessage);

  const response = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 512,
    system: UPDATE_MEMORY_SYSTEM,
    messages: [{ role: 'user', content: userMessage }],
  });

  const updatedMemory = response.content[0].type === 'text' ? response.content[0].text : '';

  console.log('\n--- Memory before ---');
  console.log(memoryBefore || '(empty)');
  console.log('\n--- Memory after ---');
  console.log(updatedMemory);
  console.log('---\n');
}

main().catch(console.error);
```

**Step 2: Run it**

```bash
npm run lab:update
```

Expected: updated memory text that captures the lesson ("needs leg coverage below ~8°C feels-like").

**Step 3: Iterate on the prompt**

Edit `lab/prompts.ts` → `UPDATE_MEMORY_SYSTEM` until updates feel right. Check:
- Does it write in second person?
- Does it stay concise?
- Does it preserve unrelated existing notes?
- Does it not invent things not in the feedback?
- Does it correctly update contradicting info?

Try with a non-empty `memoryBefore` and conflicting feedback. Re-run after each change.

**Step 4: Commit when satisfied**

```bash
git add lab/update-memory.ts lab/prompts.ts
git commit -m "feat: add memory-update lab script with iterated prompt"
```

---

### Task 6: Eval test cases

**Files:**
- Create: `lab/eval/cases.ts`

**Step 1: Create `lab/eval/cases.ts`**

```typescript
import type { WeatherInput } from '../utils.ts';

export interface EvalCase {
  description: string;
  weather: WeatherInput;
  runDescription: string;
  memoryBefore: string;
  feedback: string;
  expectedLesson: string;
}

export const cases: EvalCase[] = [
  {
    description: 'Cold underdressed — empty memory',
    weather: {
      temperature: 8,
      feelsLike: 5,
      windSpeed: 25,
      weatherDescription: 'Overcast',
      precipProbability: 20,
      dewPoint: 3,
    },
    runDescription: 'Easy 10k',
    memoryBefore: '',
    feedback: 'Wore shorts and a t-shirt, was very cold the whole run, especially my legs.',
    expectedLesson: 'Needs leg coverage (tights or leggings) when feels-like is below about 8°C',
  },
  {
    description: 'Warm overdressed on tempo run',
    weather: {
      temperature: 16,
      feelsLike: 15,
      windSpeed: 10,
      weatherDescription: 'Mainly clear',
      precipProbability: 0,
      dewPoint: 8,
    },
    runDescription: 'Tempo 5k',
    memoryBefore: 'You tend to run cold and prefer an extra layer in cool weather.',
    feedback:
      'Wore long tights and a thermal long-sleeve, was absolutely drenched in sweat. Way too warm for a fast effort.',
    expectedLesson:
      'Tempo runs generate a lot of heat — needs lighter clothing than easy runs at the same temperature',
  },
  {
    description: 'High dew point discomfort',
    weather: {
      temperature: 20,
      feelsLike: 20,
      windSpeed: 5,
      weatherDescription: 'Partly cloudy',
      precipProbability: 10,
      dewPoint: 17,
    },
    runDescription: 'Easy long run 15k',
    memoryBefore: '',
    feedback:
      'Felt way hotter than 20°C should feel. Sweat was not evaporating at all. Was exhausted much earlier than expected.',
    expectedLesson:
      'High dew point (above ~16°C) makes runs feel much harder and hotter — dress lighter and expect slower pace',
  },
  {
    description: 'Rain jacket overkill for low rain probability',
    weather: {
      temperature: 12,
      feelsLike: 10,
      windSpeed: 15,
      weatherDescription: 'Slight rain showers',
      precipProbability: 55,
      dewPoint: 7,
    },
    runDescription: 'Easy 8k',
    memoryBefore: '',
    feedback:
      'Wore a full waterproof jacket, overheated badly. It barely rained and a light windshell would have been plenty.',
    expectedLesson:
      'A full rain jacket is unnecessary when rain probability is below ~70% — a windshell or lightweight top is enough',
  },
  {
    description: 'Existing preference is preserved after positive feedback',
    weather: {
      temperature: 9,
      feelsLike: 7,
      windSpeed: 18,
      weatherDescription: 'Overcast',
      precipProbability: 15,
      dewPoint: 4,
    },
    runDescription: 'Easy 12k',
    memoryBefore:
      'You dislike arm warmers and find them uncomfortable. You prefer a long-sleeve base layer over arm warmers.',
    feedback: 'Wore a long-sleeve base layer, felt good. No issues.',
    expectedLesson: 'Dislike of arm warmers is preserved in updated notes',
  },
];
```

**Step 2: Verify it compiles**

```bash
npx tsx -e "import { cases } from './lab/eval/cases.ts'; console.log(cases.length + ' cases loaded')"
```

Expected: `5 cases loaded`

**Step 3: Commit**

```bash
git add lab/eval/cases.ts
git commit -m "feat: add eval test cases for prompt quality assessment"
```

---

### Task 7: LLM-as-judge

**Files:**
- Create: `lab/eval/judge.ts`

**Step 1: Create `lab/eval/judge.ts`**

```typescript
import { anthropic, HAIKU } from '../client.ts';
import { formatWeather } from '../utils.ts';
import type { EvalCase } from './cases.ts';

const JUDGE_SYSTEM = `You are grading whether a running AI assistant correctly learned from feedback.

Evaluate two things:
1. Did the updated runner notes capture the expected lesson from the feedback?
2. Did the subsequent clothing recommendation reflect that lesson?

Respond in exactly this format (no other text):
NOTES_CAPTURED: yes|no
NOTES_REASON: <one sentence>
RECOMMENDATION_IMPROVED: yes|no
RECOMMENDATION_REASON: <one sentence>`;

export interface JudgeResult {
  notesCaptured: boolean;
  notesReason: string;
  recommendationImproved: boolean;
  recommendationReason: string;
}

export async function judge(
  evalCase: EvalCase,
  updatedMemory: string,
  recommendation: string
): Promise<JudgeResult> {
  const userMessage = `Feedback given: "${evalCase.feedback}"
Weather: ${formatWeather(evalCase.weather)}
Run type: ${evalCase.runDescription}
Expected lesson: ${evalCase.expectedLesson}

Updated runner notes:
${updatedMemory || '(empty)'}

Subsequent recommendation:
${recommendation}`;

  const response = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 256,
    system: JUDGE_SYSTEM,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  return {
    notesCaptured: /^NOTES_CAPTURED: yes/m.test(text),
    notesReason: text.match(/^NOTES_REASON: (.+)$/m)?.[1] ?? '(parse error)',
    recommendationImproved: /^RECOMMENDATION_IMPROVED: yes/m.test(text),
    recommendationReason: text.match(/^RECOMMENDATION_REASON: (.+)$/m)?.[1] ?? '(parse error)',
  };
}
```

**Step 2: Commit**

```bash
git add lab/eval/judge.ts
git commit -m "feat: add LLM-as-judge for eval grading"
```

---

### Task 8: Eval runner

**Files:**
- Create: `lab/eval/run.ts`

**Step 1: Create `lab/eval/run.ts`**

```typescript
import { anthropic, HAIKU } from '../client.ts';
import { RECOMMEND_SYSTEM, UPDATE_MEMORY_SYSTEM } from '../prompts.ts';
import { formatWeather } from '../utils.ts';
import { cases } from './cases.ts';
import { judge } from './judge.ts';

async function updateMemory(
  weatherText: string,
  runDescription: string,
  originalSuggestion: string,
  feedback: string,
  memoryBefore: string
): Promise<string> {
  const response = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 512,
    system: UPDATE_MEMORY_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Run details:
- Conditions: ${weatherText}
- Run type: ${runDescription}
- Suggested clothing: ${originalSuggestion}
- Feedback: ${feedback}

Current notes:
${memoryBefore || '(empty)'}`,
      },
    ],
  });
  return response.content[0].type === 'text' ? response.content[0].text : '';
}

async function recommend(
  weatherText: string,
  runDescription: string,
  memory: string
): Promise<string> {
  const response = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 256,
    system: RECOMMEND_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Weather: ${weatherText}
Run: ${runDescription || 'Not specified'}

Runner notes:
${memory || '(none yet)'}`,
      },
    ],
  });
  return response.content[0].type === 'text' ? response.content[0].text : '';
}

async function main() {
  let passed = 0;
  let failed = 0;

  for (const c of cases) {
    console.log(`\n━━━ ${c.description} ━━━`);

    const weatherText = formatWeather(c.weather);

    // Step 1: get a baseline recommendation (what Claude would have suggested before feedback)
    const originalSuggestion = await recommend(weatherText, c.runDescription, c.memoryBefore);

    // Step 2: update memory based on feedback
    const updatedMemory = await updateMemory(
      weatherText,
      c.runDescription,
      originalSuggestion,
      c.feedback,
      c.memoryBefore
    );

    // Step 3: get a new recommendation using updated memory
    const updatedRecommendation = await recommend(weatherText, c.runDescription, updatedMemory);

    // Step 4: judge both
    const result = await judge(c, updatedMemory, updatedRecommendation);

    const pass = result.notesCaptured && result.recommendationImproved;
    if (pass) passed++;
    else failed++;

    console.log(`Status:  ${pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Notes:   ${result.notesCaptured ? '✓' : '✗'} ${result.notesReason}`);
    console.log(`Reco:    ${result.recommendationImproved ? '✓' : '✗'} ${result.recommendationReason}`);
    console.log(`\nUpdated memory:\n${updatedMemory}`);
    console.log(`\nRecommendation:\n${updatedRecommendation}`);
  }

  console.log(`\n━━━ Results: ${passed}/${cases.length} passed ━━━`);
  if (failed > 0) process.exit(1);
}

main().catch(console.error);
```

**Step 2: Run the eval**

```bash
npm run lab:eval
```

Expected: output for each of the 5 cases with PASS/FAIL, then a summary line. First run may not be 5/5 — that's fine. Note which cases fail and why.

**Step 3: If cases are failing, iterate on the prompts**

Common failure patterns:
- Notes not capturing lesson → tighten `UPDATE_MEMORY_SYSTEM` (be more explicit about "always capture a lesson if the runner felt uncomfortable")
- Recommendation not reflecting notes → tighten `RECOMMEND_SYSTEM` (emphasise reading the notes)
- Judge being too strict or too lenient → adjust `JUDGE_SYSTEM` in `judge.ts`

After each prompt change, re-run `npm run lab:eval`.

**Step 4: Commit when eval passes (target ≥ 4/5)**

```bash
git add lab/eval/run.ts
git commit -m "feat: add eval runner — N/5 cases passing"
```

---

## Done when

- `npm run lab:recommend` produces sensible clothing recommendations for varied weather + memory inputs
- `npm run lab:update` produces concise, second-person memory updates that capture genuine lessons
- `npm run lab:eval` reports ≥ 4/5 passing
- Both system prompts feel stable — changing weather/memory inputs produces predictably good output
