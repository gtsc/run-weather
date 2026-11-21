import { fetchForecast } from '../lib/api/forecast';
import { wallClock, addDays } from '../lib/utils/dates';
import { scoreHour } from '../lib/scoring/engine';
import { bestWindow } from '../lib/scoring/days';
import { BAND_HEX, bandOf } from '../lib/utils/chart';
import { getWeatherInfo } from '../lib/scoring/weatherCodes';
import type { HourData, Preferences, ScoredHour } from '../lib/types';

type Theme = { bg: string; label: string; muted: string; accent: string; bands: Record<'great' | 'ok' | 'poor', string> };

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
};

function dayLabel(dateStr: string): string {
  const today = wallClock().slice(0, 10);
  const tomorrow = addDays(today, 1);
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long' });
}

function renderDay(widget: any, date: string, dayHours: HourData[], now: string, theme: Theme): void {
  const scored: ScoredHour[] = dayHours.map((h) => ({ ...h, score: scoreHour(h, DEFAULT_PREFS) }));
  const best = bestWindow(scored, now);

  // Row 1: day label + best window ("11–14, 100"), same wording as the web app
  const header = widget.addStack();
  header.layoutHorizontally();

  const label = header.addText(dayLabel(date));
  label.font = Font.boldSystemFont(13);
  label.textColor = new Color(theme.label);

  header.addSpacer();

  const bestText = header.addText(best ? `best ${best.start}–${best.end}, ${best.score}` : '–');
  bestText.font = Font.systemFont(12);
  bestText.textColor = new Color(theme.muted);

  widget.addSpacer(2);

  // Row 2: 24 hourly bars — height = score, colour = Great / OK / Poor (as in the app)
  const BAR_W = 288;
  const BAR_H = 20;
  const segW = BAR_W / scored.length;
  const dc = new DrawContext();
  dc.size = new Size(BAR_W, BAR_H);
  dc.opaque = false;
  scored.forEach((h, i) => {
    const height = Math.max(2, Math.round((Math.max(h.score, 6) / 100) * BAR_H));
    dc.setFillColor(new Color(theme.bands[bandOf(h.score)]));
    dc.fillRect(new Rect(Math.round(i * segW), BAR_H - height, Math.max(1, Math.ceil(segW) - 1), height));
  });
  const barStack = widget.addStack();
  barStack.layoutHorizontally();
  barStack.addImage(dc.getImage());
}

async function run(): Promise<void> {
  const widget = new ListWidget();
  const isDark = Device.isUsingDarkAppearance();
  // Same palette as the web app (app.css).
  const theme: Theme = {
    bg: isDark ? '#0d1520' : '#eef2f7',
    label: isDark ? '#e8eef6' : '#13202e',
    muted: isDark ? '#9aa9bb' : '#4d5c6d',
    accent: isDark ? '#8fb4ff' : '#2f5fd0',
    bands: BAND_HEX[isDark ? 'dark' : 'light'],
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
  symImg.tintColor = new Color(theme.accent);
  titleRow.addSpacer(5);
  const titleText = titleRow.addText('Run Weather');
  titleText.font = Font.boldSystemFont(11);
  titleText.textColor = new Color(theme.muted);

  try {
    Location.setAccuracyToHundredMeters();
    const loc = await Location.current();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { hours } = await fetchForecast(loc.latitude, loc.longitude, { timezone });

    const today = wallClock(timezone).slice(0, 10);
    const tomorrow = addDays(today, 1);
    const dayAfterTomorrow = addDays(today, 2);

    titleRow.addSpacer();
    const nowHour = hours.find((h: HourData) => h.date === today && h.hour === Number(wallClock(timezone).slice(11, 13)));
    if (nowHour) {
      const condParts = [
        `${getWeatherInfo(nowHour.weatherCode).label}, ${Math.round(nowHour.temperature)}°`,
        `feels ${Math.round(nowHour.feelsLike)}°`,
        `${Math.round(nowHour.windSpeed)} km/h`,
      ];
      if (nowHour.precipProbability > 0) condParts.push(`${nowHour.precipProbability}% rain`);
      const condEl = titleRow.addText(condParts.join(', '));
      condEl.font = Font.systemFont(10);
      condEl.textColor = new Color(theme.muted);
    }
    widget.addSpacer(2);

    for (const [i, date] of [today, tomorrow, dayAfterTomorrow].entries()) {
      if (i > 0) widget.addSpacer(4);
      const dayHours = hours.filter((h: HourData) => h.date === date);
      renderDay(widget, date, dayHours, wallClock(timezone), theme);
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
    errText.textColor = new Color(theme.muted);
    errText.font = Font.systemFont(12);
  }

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    await widget.presentMedium();
  }
}

run();
