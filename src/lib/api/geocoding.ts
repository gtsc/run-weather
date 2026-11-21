import type { Location } from '../types';

const OPEN_METEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const TIMEOUT_MS = 10_000;

interface OpenMeteoResult {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
}

type NominatimAddress = Partial<
  Record<'city' | 'town' | 'village' | 'hamlet' | 'state' | 'county' | 'country', string>
>;

interface NominatimResult {
  lat: string;
  lon: string;
  name?: string;
  address?: NominatimAddress;
}

async function getJson<T>(url: string, params: Record<string, string>): Promise<T | null> {
  const res = await fetch(`${url}?${new URLSearchParams(params)}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return res.ok ? ((await res.json()) as T) : null;
}

const settlement = (a: NominatimAddress) => a.city || a.town || a.village || a.hamlet;
const joinParts = (parts: (string | undefined)[]) => parts.filter(Boolean).join(', ');

async function geocodeOpenMeteo(query: string): Promise<Location | null> {
  const data = await getJson<{ results?: OpenMeteoResult[] }>(OPEN_METEO_URL, {
    name: query,
    count: '1',
    language: 'en',
    format: 'json',
  });
  const result = data?.results?.[0];
  if (!result) return null;
  return {
    latitude: result.latitude,
    longitude: result.longitude,
    name: joinParts([
      result.name,
      result.admin1 !== result.name ? result.admin1 : undefined,
      result.country,
    ]),
  };
}

async function geocodeNominatim(query: string): Promise<Location | null> {
  const data = await getJson<NominatimResult[]>(NOMINATIM_SEARCH_URL, {
    q: query,
    format: 'json',
    limit: '1',
    addressdetails: '1',
  });
  const result = data?.[0];
  if (!result) return null;
  const addr = result.address ?? {};
  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    name: joinParts([settlement(addr) ?? result.name, addr.state || addr.county, addr.country]),
  };
}

export async function geocodeLocation(query: string): Promise<Location> {
  const cleaned = query.trim();
  if (!cleaned) throw new Error('Please enter a location');

  // Try Open-Meteo first, fall back to Nominatim for postal codes etc.
  const result = (await geocodeOpenMeteo(cleaned)) ?? (await geocodeNominatim(cleaned));
  if (result) return result;

  throw new Error(`Could not find location for "${cleaned}"`);
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const data = await getJson<{ address?: NominatimAddress }>(NOMINATIM_REVERSE_URL, {
      lat: String(lat),
      lon: String(lon),
      format: 'json',
    });
    const addr = data?.address ?? {};
    return joinParts([settlement(addr), addr.country]) || null;
  } catch {
    return null;
  }
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) => reject(new Error(`Could not get your location: ${err.message}`, { cause: err })),
      { enableHighAccuracy: false, timeout: TIMEOUT_MS },
    );
  });
}

/** ~1 km precision: plenty for a weather forecast, and avoids sharing an exact position. */
const coarsen = (deg: number) => Math.round(deg * 100) / 100;

export async function geocodeGPS(): Promise<Location> {
  const { coords } = await getCurrentPosition();
  const latitude = coarsen(coords.latitude);
  const longitude = coarsen(coords.longitude);
  const name = await reverseGeocode(latitude, longitude);
  return { latitude, longitude, name: name ?? 'Current location' };
}
