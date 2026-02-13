export function formatHour(hour) {
  return `${hour.toString().padStart(2, '0')}:00`;
}

export function formatHourRange(startHour, endHour) {
  return `${formatHour(startHour)} – ${formatHour(endHour)}`;
}

export function formatTemp(temp) {
  return `${Math.round(temp)}°C`;
}

export function formatWind(speed) {
  return `${Math.round(speed)} km/h`;
}

export function formatDayLabel(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function scoreColor(score) {
  if (score >= 70) return 'bg-run-green';
  if (score >= 40) return 'bg-run-amber';
  return 'bg-run-red';
}

export function scoreColorHex(score) {
  if (score >= 70) return '#22c55e';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}
