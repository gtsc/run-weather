const STORAGE_KEY = 'run-weather-dark';

function loadDarkMode(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'true';
  } catch {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

let dark = $state(loadDarkMode());

function applyToDocument(): void {
  document.documentElement.classList.toggle('dark', dark);
}

// Apply on load
applyToDocument();

export function isDark(): boolean {
  return dark;
}

export function toggleDarkMode(): void {
  dark = !dark;
  applyToDocument();
  try {
    localStorage.setItem(STORAGE_KEY, String(dark));
  } catch {}
}
