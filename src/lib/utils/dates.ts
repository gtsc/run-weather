/**
 * Date helpers that work on Open-Meteo's wall-clock strings ("YYYY-MM-DDTHH:MM") in the
 * forecast location's time zone, instead of the browser's. Plain Intl/Date only — this
 * module is also bundled into the Scriptable widget.
 */

const MS_PER_DAY = 86_400_000;

/** Current wall-clock time in `timeZone` (default: the device's) as "YYYY-MM-DDTHH:MM". */
export function wallClock(timeZone?: string, date: Date = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

const toUtcMs = (date: string) => Date.parse(`${date.slice(0, 10)}T00:00:00Z`);

/** Whole calendar days from `from` to `to` (both "YYYY-MM-DD…"). DST-safe. */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

/** "YYYY-MM-DD" `days` after `date`. */
export function addDays(date: string, days: number): string {
  return new Date(toUtcMs(date) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Minutes since midnight of a wall-clock string. */
export function minutesOfDay(wallClockTime: string): number {
  return Number(wallClockTime.slice(11, 13)) * 60 + Number(wallClockTime.slice(14, 16));
}
