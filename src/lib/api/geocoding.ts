import type { Location } from '../types';

const OPEN_METEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

async function geocodeOpenMeteo(query: string): Promise<Location | null> {
  const url = `${OPEN_METEO_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();

  if (data.results?.length) {
    const result = data.results[0];
    const parts = [result.name];
    if (result.admin1 && result.admin1 !== result.name) parts.push(result.admin1);
    if (result.country) parts.push(result.country);
    return {
      latitude: result.latitude,
      longitude: result.longitude,
      name: parts.join(', '),
    };
  }
  return null;
}

async function geocodeNominatim(query: string): Promise<Location | null> {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'RunWeatherApp/1.0' },
  });
  if (!res.ok) return null;
  const data = await res.json();

  if (data.length) {
    const result = data[0];
    const addr = result.address ?? {};
    const parts = [
      addr.city || addr.town || addr.village || addr.hamlet || result.name,
      addr.state || addr.county,
      addr.country,
    ].filter(Boolean);
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      name: parts.join(', '),
    };
  }
  return null;
}

export async function geocodeLocation(query: string): Promise<Location> {
  const cleaned = query.trim();
  if (!cleaned) throw new Error('Please enter a location');

  // Try Open-Meteo first, fall back to Nominatim for postal codes etc.
  const result = (await geocodeOpenMeteo(cleaned)) ?? (await geocodeNominatim(cleaned));
  if (result) return result;

  throw new Error(`Could not find location for "${cleaned}"`);
}

export async function geocodeGPS(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          name: 'Current location',
        });
      },
      (err) => {
        reject(new Error(`Could not get your location: ${err.message}`));
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  });
}
