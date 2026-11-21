/** Geometry for a day's score curve in a 240×100 viewBox (stretched to fit). */

export const VIEW_W = 240;
export const VIEW_H = 100;
/** Scores below this sit on the baseline; most of the interesting range is 40–100. */
export const SCORE_FLOOR = 40;
/** Score bands shaded behind the curve. */
export const GOOD_SCORE = 80;
export const GREAT_SCORE = 90;

const PAD_TOP = 6;

/** x of an hour's centre, in viewBox units. */
export const xOf = (hour: number) => ((hour + 0.5) / 24) * VIEW_W;

/** y of a score, in viewBox units (0 = top). */
export function yOf(score: number): number {
  const t = (Math.max(score, SCORE_FLOOR) - SCORE_FLOOR) / (100 - SCORE_FLOOR);
  return VIEW_H - t * (VIEW_H - PAD_TOP);
}

export function linePath(scores: number[]): string {
  return 'M' + scores.map((s, h) => `${xOf(h).toFixed(1)},${yOf(s).toFixed(1)}`).join(' L');
}

export function areaPath(scores: number[]): string {
  const last = scores.length - 1;
  return `${linePath(scores)} L${xOf(last).toFixed(1)},${VIEW_H} L${xOf(0).toFixed(1)},${VIEW_H} Z`;
}

/** Contiguous runs of hours where `flags[h]` is true, as [start, end) hour ranges. */
export function runs(flags: boolean[]): [number, number][] {
  const out: [number, number][] = [];
  let start = -1;
  flags.forEach((on, h) => {
    if (on && start === -1) start = h;
    if (!on && start !== -1) {
      out.push([start, h]);
      start = -1;
    }
  });
  if (start !== -1) out.push([start, flags.length]);
  return out;
}
