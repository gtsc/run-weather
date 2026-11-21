import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

mount(App, { target: document.getElementById('app')! });

// Offline support (production only: the dev server doesn't serve hashed assets).
// The CSP enforces Trusted Types, so the worker URL goes through a policy that allows
// exactly this one script, nothing else.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const SW_URL = '/sw.js';
  const policy = (
    window as Window & {
      trustedTypes?: {
        createPolicy(_name: string, _rules: object): { createScriptURL(_url: string): unknown };
      };
    }
  ).trustedTypes?.createPolicy('service-worker', {
    createScriptURL: (url: string) => {
      if (url !== SW_URL) throw new TypeError(`Unexpected service worker URL: ${url}`);
      return url;
    },
  });
  const scriptURL = (policy ? policy.createScriptURL(SW_URL) : SW_URL) as string;
  navigator.serviceWorker.register(scriptURL).catch(() => {});
}
