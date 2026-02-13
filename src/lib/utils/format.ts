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

export function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function scoreColorHex(score: number): string {
  // Smooth gradient: 0 = red (0°), 50 = amber (35°), 100 = green (142°)
  // Using HSL with fixed saturation and lightness
  const clamped = Math.max(0, Math.min(100, score));

  // Piecewise linear hue: 0-50 maps to 0°-35°, 50-100 maps to 35°-142°
  let hue: number;
  if (clamped <= 50) {
    hue = (clamped / 50) * 35;
  } else {
    hue = 35 + ((clamped - 50) / 50) * (142 - 35);
  }

  const saturation = 70 + (clamped / 100) * 15; // 70-85%
  const lightness = 42 + (clamped / 100) * 6; // 42-48%

  return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}
