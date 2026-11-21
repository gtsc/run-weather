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

/**
 * Band colours as hex, for places that can't use the CSS tokens (the Scriptable widget).
 * Keep in sync with --run-great/ok/poor-{l,d} in app.css.
 */
export const BAND_HEX: Record<'light' | 'dark', Record<Band, string>> = {
  light: { great: '#2f5fd0', ok: '#8593a8', poor: '#cc5f1f' },
  dark: { great: '#6690e6', ok: '#5a6a80', poor: '#d4783a' },
};
