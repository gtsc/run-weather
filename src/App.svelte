<script>
  import LocationInput from './components/LocationInput.svelte';
  import WeekView from './components/WeekView.svelte';
</script>

<div class="min-h-screen bg-run-bg text-run-text">
  <header class="px-4 py-4 border-b border-gray-200">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold">Run Weather</h1>
      <p class="text-run-muted text-sm">Find the best time to run</p>
    </div>
  </header>

  <main class="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
    <LocationInput />
    <WeekView />
  </main>

  <footer class="text-center text-xs text-run-muted py-4">
    Weather data by <a href="https://open-meteo.com/" class="underline" target="_blank" rel="noreferrer">Open-Meteo.com</a>
  </footer>
</div>
