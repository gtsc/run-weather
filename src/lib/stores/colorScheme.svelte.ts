export type Scheme = 'light' | 'dark';

const STORAGE_KEY = 'color-scheme';
const LEGACY_KEY = 'run-weather-dark';
const systemQuery = window.matchMedia('(prefers-color-scheme: dark)');

function readStored(): Scheme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function writeStored(value: Scheme | null): void {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function applyToDocument(value: Scheme | null): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  if (meta) meta.content = value ?? 'light dark';
}

// One-off migration from the old boolean `run-weather-dark` key.
try {
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy !== null) {
    localStorage.removeItem(LEGACY_KEY);
    const scheme: Scheme = legacy === 'true' ? 'dark' : 'light';
    const system: Scheme = systemQuery.matches ? 'dark' : 'light';
    if (readStored() === null && scheme !== system) {
      writeStored(scheme);
      applyToDocument(scheme);
    }
  }
} catch {}

class ColorScheme {
  override = $state<Scheme | null>(readStored());
  system = $state<Scheme>(systemQuery.matches ? 'dark' : 'light');
  rendered = $derived<Scheme>(this.override ?? this.system);

  constructor() {
    systemQuery.addEventListener('change', (e) => {
      this.system = e.matches ? 'dark' : 'light';
    });
    // Stay in sync when the override changes in another tab.
    window.addEventListener('storage', (e) => {
      if (e.key !== STORAGE_KEY) return;
      this.override = readStored();
      applyToDocument(this.override);
    });
  }

  /** Pin light or dark, or pass null to follow the system again. */
  set(value: Scheme | null): void {
    this.override = value;
    writeStored(value);
    applyToDocument(value);
  }
}

export const colorScheme = new ColorScheme();
