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
    "is_day"
  ].join(",");
  async function fetchForecast(latitude, longitude, timezone = "Europe/London") {
    const tz = encodeURIComponent(timezone);
    const url = `${BASE_URL}?latitude=${latitude}&longitude=${longitude}&hourly=${HOURLY_PARAMS}&forecast_days=8&timezone=${tz}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch forecast");
    const data = await res.json();
    return reshapeHourly(data.hourly);
  }
  function reshapeHourly(hourly) {
    const count = hourly.time.length;
    const hours = [];
    for (let i = 0; i < count; i++) {
      hours.push({
        time: hourly.time[i],
        date: hourly.time[i].slice(0, 10),
        hour: new Date(hourly.time[i]).getHours(),
        temperature: hourly.temperature_2m[i],
        feelsLike: hourly.apparent_temperature[i],
        precipProbability: hourly.precipitation_probability[i],
        precipitation: hourly.precipitation[i],
        windSpeed: hourly.wind_speed_10m[i],
        windGusts: hourly.wind_gusts_10m[i],
        weatherCode: hourly.weather_code[i],
        snowDepth: hourly.snow_depth[i],
        isDay: hourly.is_day[i] === 1
      });
    }
    return hours;
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
    let badFactors = 0;
    if (precipProb > 0.5) badFactors++;
    if (hour.windSpeed > 15) badFactors++;
    if (feelsLike < prefs.tempMin || feelsLike > prefs.tempMax) badFactors++;
    if (weatherInfo.penalty >= 25) badFactors++;
    if (hour.snowDepth >= 0.03) badFactors++;
    if (badFactors >= 2) {
      score *= 1 - (badFactors - 1) * 0.08;
    }
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // src/lib/scoring/windows.ts
  function findRunWindows(dayHours, scores, durationHours) {
    const stepsNeeded = Math.ceil(durationHours);
    if (dayHours.length < stepsNeeded) return [];
    const now = /* @__PURE__ */ new Date();
    const windows = [];
    for (let i = 0; i <= dayHours.length - stepsNeeded; i++) {
      const windowHours = dayHours.slice(i, i + stepsNeeded);
      const windowScores = scores.slice(i, i + stepsNeeded);
      if (new Date(windowHours[0].time) < now) continue;
      if (windowScores.some((s) => s < 20)) continue;
      const avgScore = Math.round(windowScores.reduce((sum, s) => sum + s, 0) / windowScores.length);
      windows.push({
        startHour: windowHours[0].hour,
        endHour: (windowHours[windowHours.length - 1].hour + 1) % 24,
        startTime: windowHours[0].time,
        endTime: windowHours[windowHours.length - 1].time,
        score: avgScore,
        hours: windowHours,
        scores: windowScores
      });
    }
    windows.sort((a, b) => b.score - a.score);
    return windows.slice(0, 3);
  }

  // src/lib/utils/format.ts
  function formatHour(hour) {
    return `${hour.toString().padStart(2, "0")}:00`;
  }
  var COLOR_STOPS = [
    [215, 48, 39],
    // 0   — red
    [244, 109, 67],
    // 25  — orange
    [253, 204, 92],
    // 50  — yellow
    [166, 217, 106],
    // 75  — lime
    [39, 166, 75]
    // 100 — green
  ];
  function lerp(a, b, t) {
    return Math.round(a + (b - a) * t);
  }
  function scoreColorHex(score) {
    const t = Math.max(0, Math.min(1, score / 100));
    const scaled = t * (COLOR_STOPS.length - 1);
    const i = Math.min(Math.floor(scaled), COLOR_STOPS.length - 2);
    const frac = scaled - i;
    const r = lerp(COLOR_STOPS[i][0], COLOR_STOPS[i + 1][0], frac);
    const g = lerp(COLOR_STOPS[i][1], COLOR_STOPS[i + 1][1], frac);
    const b = lerp(COLOR_STOPS[i][2], COLOR_STOPS[i + 1][2], frac);
    return `rgb(${r}, ${g}, ${b})`;
  }

  // src/scriptable/widget.ts
  var DEFAULT_PREFS = {
    rainTolerance: 0.3,
    tempMin: -2,
    tempMax: 25,
    durationHours: 1
  };
  function toColor(rgb) {
    const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!m) return new Color("#888888");
    const h = (n) => parseInt(n).toString(16).padStart(2, "0");
    return new Color(`#${h(m[1])}${h(m[2])}${h(m[3])}`);
  }
  function dayLabel(dateStr) {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
    if (dateStr === today) return "Today";
    if (dateStr === tomorrow) return "Tomorrow";
    return dateStr;
  }
  function renderDay(widget, date, dayHours) {
    const scored = dayHours.map((h) => ({
      ...h,
      score: scoreHour(h, DEFAULT_PREFS)
    }));
    const scores = scored.map((h) => h.score);
    const windows = findRunWindows(scored, scores, DEFAULT_PREFS.durationHours);
    const best = windows[0];
    const header = widget.addStack();
    header.layoutHorizontally();
    const label = header.addText(dayLabel(date));
    label.font = Font.boldSystemFont(13);
    label.textColor = new Color("#ffffff");
    header.addSpacer();
    const bestLabel = best ? `${formatHour(best.startHour)}\u2013${formatHour(best.endHour)}` : "\u2013";
    const bestText = header.addText(bestLabel);
    bestText.font = Font.systemFont(12);
    bestText.textColor = new Color("#8e8e93");
    widget.addSpacer(4);
    const bar = widget.addStack();
    bar.layoutHorizontally();
    bar.cornerRadius = 3;
    for (const hour of scored) {
      const cell = bar.addStack();
      cell.backgroundColor = toColor(scoreColorHex(hour.score));
      cell.cornerRadius = 2;
      cell.addSpacer();
    }
  }
  async function run() {
    const widget = new ListWidget();
    widget.backgroundColor = new Color("#1c1c1e");
    widget.setPadding(12, 14, 12, 14);
    try {
      const loc = await Location.current();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const hours = await fetchForecast(loc.latitude, loc.longitude, timezone);
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
      for (const [i, date] of [today, tomorrow].entries()) {
        if (i > 0) widget.addSpacer(8);
        const dayHours = hours.filter((h) => h.date === date);
        renderDay(widget, date, dayHours);
      }
    } catch {
      const errStack = widget.addStack();
      const errText = errStack.addText("Failed to load weather");
      errText.textColor = new Color("#8e8e93");
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
