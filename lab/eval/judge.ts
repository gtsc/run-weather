import { anthropic } from '../client';

const JUDGE_SYSTEM = `\
You are a judge evaluating an AI-powered running clothing advisor.

Running clothing terminology:
- Base layer: the shirt worn on skin (t-shirt or long-sleeve thermal)
- Mid-layer: an insulating layer (fleece, gilet) worn between base and shell
- Wind layer: a lightweight windproof jacket — blocks wind, not waterproof
- Waterproof shell: a fully waterproof jacket — needed for moderate/heavy rain
- Ear coverage: buff, headband, or hat covering ears

You receive:
1. Weather conditions
2. The runner's personal memory (calibrated preferences — may be empty)
3. Planned run description
4. Recommendation 1 — made before any feedback, using only the above
5. What recommendation 1 should say (may be absent for learning cases where rec-1 is expected to be wrong)
6. The runner's post-run feedback
7. The updated memory — after incorporating feedback
8. Recommendation 2 — made after the memory update
9. The expected lesson — what rec-2 and the updated memory should reflect

Evaluation rules:
- If expected rec-1 is provided: judge rec-1 strictly. Including a garment that should be omitted, or omitting one that should be included, is a FAIL.
- For rec-2: check whether the updated memory reflects the expected lesson AND whether rec-2 acts on it. Rec-2 making the same mistake as rec-1 is a FAIL even if the memory improved.
- For noise-rejection cases (expected lesson says "memory should remain essentially unchanged"): PASS only if the updated memory contains no new durable lessons attributable to the circumstantial feedback.

Output valid JSON only — no markdown fences, no other text:
{
  "rec1_pass": true | false | null,
  "rec1_reasoning": "one concise sentence",
  "rec2_pass": true | false,
  "rec2_reasoning": "one concise sentence",
  "overall_pass": true | false
}

overall_pass is true only when rec1_pass is not false AND rec2_pass is true.`;

export interface JudgeInput {
  weatherFormatted: string;
  runDescription: string;
  memoryBefore: string;
  rec1: string;
  expectedRec1?: string;
  feedback: string;
  updatedMemory: string;
  rec2: string;
  expectedLesson: string;
}

export interface JudgeVerdict {
  rec1Pass: boolean | null;
  rec1Reasoning: string;
  rec2Pass: boolean;
  rec2Reasoning: string;
  overallPass: boolean;
}

function buildUserMessage(input: JudgeInput): string {
  const parts: string[] = [
    `Weather:\n${input.weatherFormatted}`,
    `Personal memory:\n${input.memoryBefore || '(none)'}`,
    `Run: ${input.runDescription || 'Not specified'}`,
    `Recommendation 1:\n${input.rec1}`,
  ];

  if (input.expectedRec1) {
    parts.push(`Expected recommendation 1:\n${input.expectedRec1}`);
  }

  parts.push(
    `Runner feedback:\n${input.feedback}`,
    `Updated memory:\n${input.updatedMemory}`,
    `Recommendation 2:\n${input.rec2}`,
    `Expected lesson:\n${input.expectedLesson}`,
  );

  return parts.join('\n\n');
}

export async function judge(input: JudgeInput): Promise<JudgeVerdict> {
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    system: JUDGE_SYSTEM,
    messages: [{ role: 'user', content: buildUserMessage(input) }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Judge returned no text block');
  }

  let raw = textBlock.text.trim();
  // Strip markdown code fences if the model adds them despite instructions
  raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

  const parsed = JSON.parse(raw) as {
    rec1_pass: boolean | null;
    rec1_reasoning: string;
    rec2_pass: boolean;
    rec2_reasoning: string;
    overall_pass: boolean;
  };

  return {
    rec1Pass: parsed.rec1_pass,
    rec1Reasoning: parsed.rec1_reasoning,
    rec2Pass: parsed.rec2_pass,
    rec2Reasoning: parsed.rec2_reasoning,
    overallPass: parsed.overall_pass,
  };
}
