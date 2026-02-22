import { fetchForecast } from '../lib/api/forecast';
import { scoreHour } from '../lib/scoring/engine';
import { findRunWindows } from '../lib/scoring/windows';
import { scoreColorHex, formatHour } from '../lib/utils/format';
import type { HourData, Preferences, ScoredHour } from '../lib/types';

// ── Scriptable global declarations ──────────────────────────────────────────
// These objects are injected by the Scriptable runtime; they are not imports.
declare const Script: { setWidget(_w: any): void };
declare const ListWidget: { new (): any };
declare const Color: { new (_hex: string, _alpha?: number): any };
declare const Font: {
  systemFont(_size: number): any;
  boldSystemFont(_size: number): any;
};
declare const Location: {
  setAccuracyToHundredMeters(): void;
  current(): Promise<{ latitude: number; longitude: number }>;
};
declare const config: { runsInWidget: boolean };
// ────────────────────────────────────────────────────────────────────────────

const DEFAULT_PREFS: Preferences = {
  rainTolerance: 0.3,
  tempMin: -2,
  tempMax: 25,
  durationHours: 1,
};

/** Convert "rgb(r, g, b)" from scoreColorHex() to a Scriptable Color object. */
function toColor(rgb: string): InstanceType<typeof Color> {
  const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return new Color('#888888');
  const h = (n: string) => parseInt(n).toString(16).padStart(2, '0');
  return new Color(`#${h(m[1])}${h(m[2])}${h(m[3])}`);
}

function dayLabel(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  return dateStr;
}

function renderDay(widget: any, date: string, dayHours: HourData[]): void {
  const scored: ScoredHour[] = dayHours.map((h) => ({
    ...h,
    score: scoreHour(h, DEFAULT_PREFS),
  }));
  const scores = scored.map((h) => h.score);
  const windows = findRunWindows(scored, scores, DEFAULT_PREFS.durationHours);
  const best = windows[0];

  // Row 1: day label + best window time
  const header = widget.addStack();
  header.layoutHorizontally();

  const label = header.addText(dayLabel(date));
  label.font = Font.boldSystemFont(13);
  label.textColor = new Color('#ffffff');

  header.addSpacer();

  const bestLabel = best ? `${formatHour(best.startHour)}–${formatHour(best.endHour)}` : '–';
  const bestText = header.addText(bestLabel);
  bestText.font = Font.systemFont(12);
  bestText.textColor = new Color('#8e8e93');

  widget.addSpacer(4);

  // Row 2: 24 coloured hour segments
  const bar = widget.addStack();
  bar.layoutHorizontally();
  bar.cornerRadius = 3;

  for (const hour of scored) {
    const cell = bar.addStack();
    cell.backgroundColor = toColor(scoreColorHex(hour.score));
    cell.cornerRadius = 2;
    cell.addSpacer(); // flexible spacer → equal-width cells
  }
}

async function run(): Promise<void> {
  const widget = new ListWidget();
  widget.backgroundColor = new Color('#1c1c1e');
  widget.setPadding(12, 14, 12, 14);

  try {
    Location.setAccuracyToHundredMeters();
    const loc = await Location.current();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const hours = await fetchForecast(loc.latitude, loc.longitude, timezone);

    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

    for (const [i, date] of [today, tomorrow].entries()) {
      if (i > 0) widget.addSpacer(8);
      const dayHours = hours.filter((h: HourData) => h.date === date);
      renderDay(widget, date, dayHours);
    }
  } catch (e) {
    const errStack = widget.addStack();
    const errText = errStack.addText(`Error: ${e}`);
    errText.textColor = new Color('#8e8e93');
    errText.font = Font.systemFont(12);
  }

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    await widget.presentMedium();
  }
}

run();
