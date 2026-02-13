const BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export async function geocodePostcode(postcode) {
  const cleaned = postcode.trim().toUpperCase();
  if (!cleaned) throw new Error('Please enter a postcode');

  // Try full postcode, then outward code, then area letters
  const attempts = [
    cleaned,
    cleaned.split(' ')[0],
    cleaned.replace(/[0-9]/g, ''),
  ];

  for (const query of attempts) {
    if (!query) continue;
    const url = `${BASE_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json&country_code=GB`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding request failed');
    const data = await res.json();

    if (data.results?.length) {
      const result = data.results[0];
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        name: result.name,
      };
    }
  }

  throw new Error(`Could not find location for "${cleaned}"`);
}

export async function geocodeGPS() {
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
