import { fetchForecast } from '../lib/api/forecast';
import { scoreHour } from '../lib/scoring/engine';
import { findRunWindows } from '../lib/scoring/windows';
import { scoreColorHex, formatHour } from '../lib/utils/format';
import { getWeatherInfo } from '../lib/scoring/weatherCodes';
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
declare const Size: { new (_width: number, _height: number): any };
declare const DrawContext: { new (): any };
declare const Rect: { new (_x: number, _y: number, _w: number, _h: number): any };
declare const config: { runsInWidget: boolean };
declare const Device: { isUsingDarkAppearance(): boolean };
declare const SFSymbol: { named(_name: string): { applyFont(_font: any): void; image: any } };
// ────────────────────────────────────────────────────────────────────────────

// ── fetch polyfill ───────────────────────────────────────────────────────────
// Scriptable's JS runtime (JavaScriptCore) has no browser fetch API.
// Shim it using Scriptable's built-in Request class before any network call.
{
  const g = globalThis as any;
  if (!g.fetch) {
    g.fetch = async (url: string) => {
      const req = new g.Request(url) as { loadJSON(): Promise<unknown> };
      const data = await req.loadJSON();
      return { ok: true, json: async () => data };
    };
  }
}
// ────────────────────────────────────────────────────────────────────────────

const WEBSITE_URL = 'https://weather.gustavtsc.eu/';

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
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long' });
}

function renderDay(
  widget: any,
  date: string,
  dayHours: HourData[],
  theme: { label: string; muted: string; pastSeg: string }
): void {
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
  label.textColor = new Color(theme.label);

  header.addSpacer();

  const bestLabel = best ? `${formatHour(best.startHour)}–${formatHour(best.endHour)} · ${best.score}` : '–';
  const bestText = header.addText(bestLabel);
  bestText.font = Font.systemFont(12);
  bestText.textColor = new Color(theme.muted);

  widget.addSpacer(1);

  // Row 2: 24 coloured hour segments drawn as an image
  const BAR_W = 288;
  const BAR_H = 16;
  const segW = BAR_W / scored.length;
  const now = new Date();
  const dc = new DrawContext();
  dc.size = new Size(BAR_W, BAR_H);
  dc.opaque = false;
  for (let i = 0; i < scored.length; i++) {
    const isPast = new Date(scored[i].time) < now;
    dc.setFillColor(isPast ? new Color(theme.pastSeg) : toColor(scoreColorHex(scored[i].score)));
    dc.fillRect(new Rect(Math.round(i * segW), 0, Math.max(1, Math.ceil(segW) - 1), BAR_H));
  }
  const barStack = widget.addStack();
  barStack.layoutHorizontally();
  const barImg = barStack.addImage(dc.getImage());
  barImg.cornerRadius = 3;
}

async function run(): Promise<void> {
  const widget = new ListWidget();
  const isDark = Device.isUsingDarkAppearance();
  const theme = {
    bg:      isDark ? '#1c1c1e' : '#f2f2f7',
    label:   isDark ? '#ffffff' : '#000000',
    muted:   isDark ? '#8e8e93' : '#6c6c70',
    pastSeg: isDark ? '#48484a' : '#c7c7cc',
  };
  widget.backgroundColor = new Color(theme.bg);
  widget.setPadding(0, 14, 0, 14);
  widget.url = WEBSITE_URL;
  // Title bar: SF Symbol icon + app name
  const titleRow = widget.addStack();
  titleRow.layoutHorizontally();
  titleRow.centerAlignContent();
  const sym = SFSymbol.named('figure.run');
  sym.applyFont(Font.systemFont(11));
  const symImg = titleRow.addImage(sym.image);
  symImg.imageSize = new Size(13, 13);
  symImg.tintColor = new Color('#26a65b');
  titleRow.addSpacer(5);
  const titleText = titleRow.addText('Run Weather');
  titleText.font = Font.boldSystemFont(11);
  titleText.textColor = new Color(theme.muted);

  try {
    Location.setAccuracyToHundredMeters();
    const loc = await Location.current();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const hours = await fetchForecast(loc.latitude, loc.longitude, timezone);

    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const dayAfterTomorrow = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);

    titleRow.addSpacer();
    const nowHour = hours.find((h: HourData) => h.date === today && h.hour === new Date().getHours());
    if (nowHour) {
      const condParts = [
        `${getWeatherInfo(nowHour.weatherCode).label} · ${Math.round(nowHour.temperature)}°`,
        `feels ${Math.round(nowHour.feelsLike)}°`,
        `${Math.round(nowHour.windSpeed)} km/h`,
      ];
      if (nowHour.precipProbability > 0) condParts.push(`${nowHour.precipProbability}% rain`);
      const condEl = titleRow.addText(condParts.join(' · '));
      condEl.font = Font.systemFont(10);
      condEl.textColor = new Color(theme.muted);
    }
    widget.addSpacer(2);

    for (const [i, date] of [today, tomorrow, dayAfterTomorrow].entries()) {
      if (i > 0) widget.addSpacer(4);
      const dayHours = hours.filter((h: HourData) => h.date === date);
      renderDay(widget, date, dayHours, theme);
    }
  } catch (e) {
    widget.addSpacer(4);
    const errStack = widget.addStack();
    const msg = e instanceof Error ? e.message : String(e);
    const isLocationDenied = msg.includes('kCLErrorDomain error 1');
    const displayMsg = isLocationDenied
      ? 'Location access denied. Go to Settings → Privacy → Location Services → Scriptable → Always or While Using.'
      : `Error: ${msg}`;
    const errText = errStack.addText(displayMsg);
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
