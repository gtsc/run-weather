import type { Location } from '../types';

const BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export async function geocodeLocation(query: string): Promise<Location> {
  const cleaned = query.trim();
  if (!cleaned) throw new Error('Please enter a location');

  const url = `${BASE_URL}?name=${encodeURIComponent(cleaned)}&count=5&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding request failed');
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
      { enableHighAccuracy: false, timeout: 10000 }
    );
  });
}
