const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

const HOURLY_PARAMS = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation_probability',
  'precipitation',
  'wind_speed_10m',
  'wind_gusts_10m',
  'weather_code',
  'is_day',
].join(',');

export async function fetchForecast(latitude, longitude) {
  const url = `${BASE_URL}?latitude=${latitude}&longitude=${longitude}&hourly=${HOURLY_PARAMS}&forecast_days=7&timezone=Europe%2FLondon`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch forecast');
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
      isDay: hourly.is_day[i] === 1,
    });
  }

  return hours;
}
