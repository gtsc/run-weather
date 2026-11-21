/** Score bands: the one visual language for "is this hour good to run?". */

export type Band = 'great' | 'ok' | 'poor';

export const GREAT_SCORE = 85;
export const POOR_BELOW = 65;

export function bandOf(score: number): Band {
  return score >= GREAT_SCORE ? 'great' : score < POOR_BELOW ? 'poor' : 'ok';
}

export const BAND_LABEL: Record<Band, string> = { great: 'Great', ok: 'OK', poor: 'Poor' };

/** Tailwind background class per band (tokens in app.css). */
export const BAND_BG: Record<Band, string> = {
  great: 'bg-run-great',
  ok: 'bg-run-ok',
  poor: 'bg-run-poor',
};
