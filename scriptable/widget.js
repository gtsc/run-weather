"use strict";
(() => {
  // src/lib/api/forecast.ts
  var BASE_URL = "https://api.open-meteo.com/v1/forecast";
  var HOURLY_PARAMS = [
    "temperature_2m",
    "apparent_temperature",
    "precipitation_probability",
    "precipitation",
    "wind_speed_10m",
    "wind_gusts_10m",
    "weather_code",
    "snow_depth",
    "is_day",
    "dew_point_2m"
  ];
  async function fetchForecast(latitude, longitude, { timezone = "auto", signal } = {}) {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      hourly: HOURLY_PARAMS.join(","),
      forecast_days: "8",
      timezone
    });
    const res = await fetch(`${BASE_URL}?${params}`, signal ? { signal } : void 0);
    if (!res.ok) throw new Error(`Failed to fetch forecast (HTTP ${res.status})`);
    const data = await res.json();
    const cachedAt = Number(res.headers?.get("x-sw-cached-at")) || void 0;
    return { timezone: data.timezone, hours: reshapeHourly(data.hourly), cachedAt };
  }
  function reshapeHourly(hourly) {
    return hourly.time.map((time, i) => ({
      time,
      date: time.slice(0, 10),
      hour: Number(time.slice(11, 13)),
      temperature: hourly.temperature_2m[i],
      feelsLike: hourly.apparent_temperature[i],
      precipProbability: hourly.precipitation_probability[i],
      precipitation: hourly.precipitation[i],
      windSpeed: hourly.wind_speed_10m[i],
      windGusts: hourly.wind_gusts_10m[i],
      weatherCode: hourly.weather_code[i],
      snowDepth: hourly.snow_depth[i],
      isDay: hourly.is_day[i] === 1,
      dewPoint: hourly.dew_point_2m[i]
    }));
  }

  // src/lib/utils/dates.ts
  var MS_PER_DAY = 864e5;
  function wallClock(timeZone, date = /* @__PURE__ */ new Date()) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }).formatToParts(date).map((p) => [p.type, p.value])
    );
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  }
  var toUtcMs = (date) => Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
  function addDays(date, days) {
    return new Date(toUtcMs(date) + days * MS_PER_DAY).toISOString().slice(0, 10);
  }

  // src/lib/scoring/weatherCodes.ts
  var WEATHER_CODES = {
    0: { label: "Clear sky", penalty: 0 },
    1: { label: "Mainly clear", penalty: 0 },
    2: { label: "Partly cloudy", penalty: 0 },
    3: { label: "Overcast", penalty: 2 },
    45: { label: "Fog", penalty: 15 },
    48: { label: "Depositing rime fog", penalty: 20 },
    51: { label: "Light drizzle", penalty: 15 },
    53: { label: "Moderate drizzle", penalty: 25 },
    55: { label: "Dense drizzle", penalty: 35 },
    56: { label: "Light freezing drizzle", penalty: 40 },
    57: { label: "Dense freezing drizzle", penalty: 55 },
    61: { label: "Slight rain", penalty: 25 },
    63: { label: "Moderate rain", penalty: 45 },
    65: { label: "Heavy rain", penalty: 70 },
    66: { label: "Light freezing rain", penalty: 55 },
    67: { label: "Heavy freezing rain", penalty: 80 },
    71: { label: "Slight snow fall", penalty: 40 },
    73: { label: "Moderate snow fall", penalty: 60 },
    75: { label: "Heavy snow fall", penalty: 80 },
    77: { label: "Snow grains", penalty: 35 },
    80: { label: "Slight rain showers", penalty: 20 },
    81: { label: "Moderate rain showers", penalty: 40 },
    82: { label: "Violent rain showers", penalty: 75 },
    85: { label: "Slight snow showers", penalty: 45 },
    86: { label: "Heavy snow showers", penalty: 75 },
    95: { label: "Thunderstorm", penalty: 85 },
    96: { label: "Thunderstorm with slight hail", penalty: 90 },
    99: { label: "Thunderstorm with heavy hail", penalty: 95 }
  };
  function getWeatherInfo(code) {
    return WEATHER_CODES[code] || { label: "Unknown", penalty: 10 };
  }

  // src/lib/scoring/engine.ts
  function scoreHour(hour, prefs) {
    let score = 100;
    const precipProb = hour.precipProbability / 100;
    const precipIntensity = Math.min(hour.precipitation / 2, 1);
    score -= Math.sqrt(precipProb * precipIntensity) * 65 * (1 - prefs.rainTolerance * 0.5);
    const feelsLike = hour.feelsLike;
    if (feelsLike < prefs.tempMin) {
      score -= Math.min((prefs.tempMin - feelsLike) * 4, 30);
    } else if (feelsLike > prefs.tempMax) {
      score -= Math.min((feelsLike - prefs.tempMax) * 4, 30);
    }
    const excessWind = Math.max(0, hour.windSpeed - 8);
    score -= Math.min(excessWind / 17 * 30, 30);
    const weatherInfo = getWeatherInfo(hour.weatherCode);
    score -= weatherInfo.penalty / 95 * 25;
    if (hour.snowDepth >= 0.01) {
      let snowPenalty = hour.snowDepth > 0.05 ? 30 : hour.snowDepth > 0.03 ? 20 : 10;
      if (hour.temperature > 2) {
        snowPenalty *= 0.6;
      }
      score -= snowPenalty;
    }
    if (!hour.isDay) {
      score -= 10;
    }
    const dew = hour.dewPoint;
    if (dew >= 10 && dew < 15) {
      score -= (dew - 10) / 5 * 10;
    } else if (dew >= 15 && dew < 20) {
      score -= 10 + (dew - 15) / 5 * 15;
    } else if (dew >= 20) {
      score -= 25;
    }
    let badFactors = 0;
    if (precipProb > 0.5) badFactors++;
    if (hour.windSpeed > 15) badFactors++;
    if (feelsLike < prefs.tempMin || feelsLike > prefs.tempMax) badFactors++;
    if (weatherInfo.penalty >= 25) badFactors++;
    if (hour.snowDepth >= 0.03) badFactors++;
    if (dew >= 15) badFactors++;
    if (badFactors >= 2) {
      score *= 1 - (badFactors - 1) * 0.08;
    }
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // src/lib/scoring/days.ts
  var WINDOW_TOLERANCE = 3;
  var MAX_WINDOW_HOURS = 3;
  function bestWindow(hours, now) {
    const upcoming = (i) => i >= 0 && i < hours.length && hours[i].time >= now;
    let peak = -1;
    hours.forEach((h, i) => {
      if (upcoming(i) && (peak === -1 || h.score > hours[peak].score)) peak = i;
    });
    if (peak === -1) return null;
    const score = hours[peak].score;
    const fits = (i) => upcoming(i) && hours[i].score >= score - WINDOW_TOLERANCE;
    let start = peak;
    let end = peak + 1;
    while (end - start < MAX_WINDOW_HOURS && (fits(end) || fits(start - 1))) {
      if (fits(end)) end++;
      else start--;
    }
    return { start, end, score };
  }

  // src/lib/utils/chart.ts
  var GREAT_SCORE = 85;
  var POOR_BELOW = 65;
  function bandOf(score) {
    return score >= GREAT_SCORE ? "great" : score < POOR_BELOW ? "poor" : "ok";
  }
  var BAND_HEX = {
    light: { great: "#2f5fd0", ok: "#8593a8", poor: "#cc5f1f" },
    dark: { great: "#6690e6", ok: "#5a6a80", poor: "#d4783a" }
  };

  // src/scriptable/widget.ts
  {
    const g = globalThis;
    if (!g.fetch) {
      g.fetch = async (url) => {
        const req = new g.Request(url);
        const data = await req.loadJSON();
        return { ok: true, json: async () => data };
      };
    }
  }
  var WEBSITE_URL = "https://weather.gustavtsc.eu/";
  var DEFAULT_PREFS = {
    rainTolerance: 0.3,
    tempMin: -2,
    tempMax: 25
  };
  function dayLabel(dateStr) {
    const today = wallClock().slice(0, 10);
    const tomorrow = addDays(today, 1);
    if (dateStr === today) return "Today";
    if (dateStr === tomorrow) return "Tomorrow";
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(void 0, { weekday: "long" });
  }
  function renderDay(widget, date, dayHours, now, theme) {
    const scored = dayHours.map((h) => ({ ...h, score: scoreHour(h, DEFAULT_PREFS) }));
    const best = bestWindow(scored, now);
    const header = widget.addStack();
    header.layoutHorizontally();
    const label = header.addText(dayLabel(date));
    label.font = Font.boldSystemFont(13);
    label.textColor = new Color(theme.label);
    header.addSpacer();
    const bestText = header.addText(best ? `best ${best.start}\u2013${best.end}, ${best.score}` : "\u2013");
    bestText.font = Font.systemFont(12);
    bestText.textColor = new Color(theme.muted);
    widget.addSpacer(2);
    const BAR_W = 288;
    const BAR_H = 20;
    const segW = BAR_W / scored.length;
    const dc = new DrawContext();
    dc.size = new Size(BAR_W, BAR_H);
    dc.opaque = false;
    scored.forEach((h, i) => {
      const height = Math.max(2, Math.round(Math.max(h.score, 6) / 100 * BAR_H));
      dc.setFillColor(new Color(theme.bands[bandOf(h.score)]));
      dc.fillRect(new Rect(Math.round(i * segW), BAR_H - height, Math.max(1, Math.ceil(segW) - 1), height));
    });
    const barStack = widget.addStack();
    barStack.layoutHorizontally();
    barStack.addImage(dc.getImage());
  }
  async function run() {
    const widget = new ListWidget();
    const isDark = Device.isUsingDarkAppearance();
    const theme = {
      bg: isDark ? "#0d1520" : "#eef2f7",
      label: isDark ? "#e8eef6" : "#13202e",
      muted: isDark ? "#9aa9bb" : "#4d5c6d",
      accent: isDark ? "#8fb4ff" : "#2f5fd0",
      bands: BAND_HEX[isDark ? "dark" : "light"]
    };
    widget.backgroundColor = new Color(theme.bg);
    widget.setPadding(0, 14, 0, 14);
    widget.url = WEBSITE_URL;
    const titleRow = widget.addStack();
    titleRow.layoutHorizontally();
    titleRow.centerAlignContent();
    const sym = SFSymbol.named("figure.run");
    sym.applyFont(Font.systemFont(11));
    const symImg = titleRow.addImage(sym.image);
    symImg.imageSize = new Size(13, 13);
    symImg.tintColor = new Color(theme.accent);
    titleRow.addSpacer(5);
    const titleText = titleRow.addText("Run Weather");
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
      const nowHour = hours.find((h) => h.date === today && h.hour === Number(wallClock(timezone).slice(11, 13)));
      if (nowHour) {
        const condParts = [
          `${getWeatherInfo(nowHour.weatherCode).label}, ${Math.round(nowHour.temperature)}\xB0`,
          `feels ${Math.round(nowHour.feelsLike)}\xB0`,
          `${Math.round(nowHour.windSpeed)} km/h`
        ];
        if (nowHour.precipProbability > 0) condParts.push(`${nowHour.precipProbability}% rain`);
        const condEl = titleRow.addText(condParts.join(", "));
        condEl.font = Font.systemFont(10);
        condEl.textColor = new Color(theme.muted);
      }
      widget.addSpacer(2);
      for (const [i, date] of [today, tomorrow, dayAfterTomorrow].entries()) {
        if (i > 0) widget.addSpacer(4);
        const dayHours = hours.filter((h) => h.date === date);
        renderDay(widget, date, dayHours, wallClock(timezone), theme);
      }
    } catch (e) {
      widget.addSpacer(4);
      const errStack = widget.addStack();
      const msg = e instanceof Error ? e.message : String(e);
      const isLocationDenied = msg.includes("kCLErrorDomain error 1");
      const displayMsg = isLocationDenied ? "Location access denied. Go to Settings \u2192 Privacy \u2192 Location Services \u2192 Scriptable \u2192 Always or While Using." : `Error: ${msg}`;
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
})();
