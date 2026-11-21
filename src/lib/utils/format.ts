export function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

export function formatHourRange(startHour: number, endHour: number): string {
  return `${formatHour(startHour)} – ${formatHour(endHour)}`;
}

export function formatTemp(temp: number): string {
  return `${Math.round(temp)}°C`;
}

export function formatWind(speed: number): string {
  return `${Math.round(speed)} km/h`;
}

/** "Today", "Tomorrow", or e.g. "Mon 23 Nov". `dayIndex` is days from today at the location. */
export function formatDayLabel(dateStr: string, dayIndex: number): string {
  if (dayIndex === 0) return 'Today';
  if (dayIndex === 1) return 'Tomorrow';
  // Parse and format in UTC so the calendar date can't shift with the browser's zone.
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/** Compact label for narrow rows: "Today", "Sun 22". */
export function formatShortDayLabel(dateStr: string, dayIndex: number): string {
  if (dayIndex === 0) return 'Today';
  const d = new Date(`${dateStr}T00:00:00Z`);
  return `${d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })} ${d.getUTCDate()}`;
}

// RdYlGn-inspired colourmap: red → orange → yellow → lime → green
// 5 stops at 0%, 25%, 50%, 75%, 100% with RGB interpolation between them
const COLOR_STOPS: [number, number, number][] = [
  [215, 48, 39], // 0   — red
  [244, 109, 67], // 25  — orange
  [253, 204, 92], // 50  — yellow
  [166, 217, 106], // 75  — lime
  [39, 166, 75], // 100 — green
];

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

export function scoreColorHex(score: number): string {
  const t = Math.max(0, Math.min(1, score / 100));
  const scaled = t * (COLOR_STOPS.length - 1);
  const i = Math.min(Math.floor(scaled), COLOR_STOPS.length - 2);
  const frac = scaled - i;

  const r = lerp(COLOR_STOPS[i][0], COLOR_STOPS[i + 1][0], frac);
  const g = lerp(COLOR_STOPS[i][1], COLOR_STOPS[i + 1][1], frac);
  const b = lerp(COLOR_STOPS[i][2], COLOR_STOPS[i + 1][2], frac);

  return `rgb(${r}, ${g}, ${b})`;
}
