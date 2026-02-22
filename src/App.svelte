<script>
  import LocationInput from './components/LocationInput.svelte';
  import WeekView from './components/WeekView.svelte';
  import Settings from './components/Settings.svelte';
  import DarkModeToggle from './components/DarkModeToggle.svelte';
</script>

<div class="min-h-screen bg-run-bg text-run-text">
  <header class="bg-run-card border-b border-run-border" style="padding-top: env(safe-area-inset-top)">
    <div class="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-run-green rounded-xl flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 class="text-lg font-semibold tracking-tight">Run Weather</h1>
          <p class="text-run-muted text-xs">Find the best time to run</p>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <DarkModeToggle />
        <Settings />
      </div>
    </div>
  </header>

  <main class="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">
    <LocationInput />
    <WeekView />
  </main>

  <footer class="text-center text-[11px] text-run-muted py-6 border-t border-run-border">
    Weather data by <a href="https://open-meteo.com/" class="underline hover:text-run-text transition-colors" target="_blank" rel="noreferrer">Open-Meteo.com</a>
  </footer>
</div>
