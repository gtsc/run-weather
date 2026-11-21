export function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
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
