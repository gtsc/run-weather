# Unify Frontend + Worker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Merge the separate Cloudflare Worker package (`worker/`) into the root project so frontend and backend deploy as a single unit from one `wrangler deploy`.

**Architecture:** Worker source moves from `worker/src/` → `src/server/`. Root `wrangler.jsonc` gains a `main` entry pointing at `src/server/index.ts` alongside the existing `assets` block. The Svelte app switches from the hardcoded `workers.dev` URL to relative paths (`/recommend`, `/feedback`). Vite proxies those paths to `wrangler dev` on port 8787 during local development. CORS headers are removed from the worker since frontend and API now share the same origin.

**Tech Stack:** Svelte 5, Vite 7, Wrangler 4, TypeScript, Cloudflare Workers with Assets

---

### Task 1: Move worker source into src/server/

**Files:**

- Create: `src/server/` (directory)
- Move: `worker/src/index.ts` → `src/server/index.ts`
- Move: `worker/src/recommend.ts` → `src/server/recommend.ts`
- Move: `worker/src/feedback.ts` → `src/server/feedback.ts`
- Move: `worker/src/supabase.ts` → `src/server/supabase.ts`
- Move: `worker/src/types.ts` → `src/server/types.ts`
- Move: `worker/src/prompts.ts` → `src/server/prompts.ts`
- Move: `worker/src/weather.ts` → `src/server/weather.ts`

**Step 1: Move the files**

```bash
mkdir -p src/server
mv worker/src/index.ts src/server/index.ts
mv worker/src/recommend.ts src/server/recommend.ts
mv worker/src/feedback.ts src/server/feedback.ts
mv worker/src/supabase.ts src/server/supabase.ts
mv worker/src/types.ts src/server/types.ts
mv worker/src/prompts.ts src/server/prompts.ts
mv worker/src/weather.ts src/server/weather.ts
```

**Step 2: Verify**

```bash
ls src/server/
```

Expected: `feedback.ts  index.ts  prompts.ts  recommend.ts  supabase.ts  types.ts  weather.ts`

---

### Task 2: Add a TypeScript config for server files

The root `tsconfig.json` uses `"types": ["vite/client"]` which is for the browser. The server files need `"types": ["@cloudflare/workers-types"]`. They need separate configs.

**Files:**

- Create: `src/server/tsconfig.json`
- Modify: `tsconfig.json`

**Step 1: Create src/server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["./**/*.ts"]
}
```

**Step 2: Exclude src/server from root tsconfig.json**

Add an `exclude` key to `tsconfig.json` so `svelte-check` and the root type checker don't try to type-check server files with browser types:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "target": "ESNext",
    "module": "ESNext",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "strict": true,
    "types": ["vite/client"],
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src/**/*.d.ts", "src/**/*.ts", "src/**/*.svelte"],
  "exclude": ["src/server"]
}
```

---

### Task 3: Merge dependencies into root package.json

`worker/` has its own `package.json`. Fold its deps into the root, then the `worker/` package can be deleted.

**Files:**

- Modify: `package.json`

The worker adds two devDependencies not currently in root:

- `@cloudflare/workers-types` — TypeScript types for the Workers runtime
- `wrangler` — CLI for deploying and running the worker locally

`@anthropic-ai/sdk` and `@supabase/supabase-js` are already in root.

**Step 1: Add to package.json devDependencies**

```json
"@cloudflare/workers-types": "^4.20250525.0",
"wrangler": "^4.0.0"
```

**Step 2: Add scripts to package.json**

```json
"dev:worker": "wrangler dev --port 8787",
"check:server": "tsc --noEmit -p src/server/tsconfig.json",
"deploy": "npm run build && wrangler deploy"
```

**Step 3: Install**

```bash
npm install
```

Expected: `wrangler` and `@cloudflare/workers-types` appear in `node_modules/`.

---

### Task 4: Update root wrangler.jsonc

Add `main`, `compatibility_flags`, and rename to match the unified project. Remove the separate worker name.

**Files:**

- Modify: `wrangler.jsonc`

Replace the entire file with:

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "run-weather",
  "main": "src/server/index.ts",
  "compatibility_date": "2026-06-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./dist",
  },

  // Secrets (set via `wrangler secret put` or Cloudflare dashboard):
  // ANTHROPIC_API_KEY
  // SUPABASE_URL
  // SUPABASE_ANON_KEY
}
```

---

### Task 5: Remove CORS from src/server/index.ts

Frontend and API now share the same origin, so `Access-Control-Allow-*` headers and the OPTIONS preflight handler are no longer needed.

**Files:**

- Modify: `src/server/index.ts`

Remove `CORS_HEADERS`, the `corsResponse` helper (replace with a plain JSON response helper), and the OPTIONS branch. The file should become:

```ts
import { handleRecommend } from './recommend';
import { handleFeedback } from './feedback';
import { supabaseForUser } from './supabase';
import type { Env } from './types';

function jsonResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function authenticate(
  req: Request,
  env: Env,
): Promise<{ token: string; userId: string } | Response> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return jsonResponse(JSON.stringify({ error: 'Missing Authorization header' }), 401);
  }
  const token = auth.slice(7);
  const db = supabaseForUser(env, token);
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) {
    return jsonResponse(JSON.stringify({ error: 'Invalid or expired token' }), 401);
  }
  return { token, userId: data.user.id };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') {
      return jsonResponse(JSON.stringify({ error: 'Method not allowed' }), 405);
    }

    const authResult = await authenticate(req, env);
    if (authResult instanceof Response) return authResult;
    const { token, userId } = authResult;

    const path = new URL(req.url).pathname;

    try {
      if (path === '/recommend') return await handleRecommend(req, env, token);
      if (path === '/feedback') return await handleFeedback(req, env, token, userId);
      return jsonResponse(JSON.stringify({ error: 'Not found' }), 404);
    } catch (err) {
      console.error(err);
      return jsonResponse(JSON.stringify({ error: 'Internal server error' }), 500);
    }
  },
};
```

---

### Task 6: Add Vite dev proxy

During local development, Vite serves the frontend at `:5173`. Requests to `/recommend` and `/feedback` need to be forwarded to `wrangler dev` on `:8787`.

**Files:**

- Modify: `vite.config.js`

```js
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  base: '/',
  plugins: [tailwindcss(), svelte()],
  server: {
    proxy: {
      '/recommend': 'http://localhost:8787',
      '/feedback': 'http://localhost:8787',
    },
  },
});
```

---

### Task 7: Switch HourPanel to relative URLs

Remove the hardcoded `WORKER_URL` constant and use relative paths instead.

**Files:**

- Modify: `src/components/HourPanel.svelte`

**Step 1: Delete the constant**

Remove line 8:

```ts
const WORKER_URL = 'https://run-weather-api.gustavtsc.workers.dev';
```

**Step 2: Update the two fetch calls**

Change:

```ts
const res = await fetch(`${WORKER_URL}/recommend`, {
```

to:

```ts
const res = await fetch('/recommend', {
```

And:

```ts
const res = await fetch(`${WORKER_URL}/feedback`, {
```

to:

```ts
const res = await fetch('/feedback', {
```

---

### Task 8: Move .dev.vars to root

Wrangler looks for `.dev.vars` next to `wrangler.jsonc`, which is now at the root.

**Step 1: Copy**

```bash
cp worker/.dev.vars .dev.vars
```

**Step 2: Verify .gitignore already covers it**

```bash
grep "dev.vars" .gitignore
```

Expected: `.dev.vars` — it's already excluded.

---

### Task 9: Delete the worker/ directory

Everything has been moved. Remove the now-redundant subdirectory.

```bash
rm -rf worker/
```

**Verify:**

```bash
ls | grep worker
```

Expected: no output.

---

### Task 10: Run all checks

**Step 1: Type check frontend**

```bash
npm run check
```

Expected: `0 ERRORS 0 WARNINGS`

**Step 2: Type check server**

```bash
npm run check:server
```

Expected: no errors.

**Step 3: Lint**

```bash
npm run lint
```

Expected: clean. (If prettier flags new files, run `npm run format` first.)

**Step 4: Build**

```bash
npm run build
```

Expected: successful build in `dist/`.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: unify frontend and worker into single Cloudflare Worker with assets"
```

---

### Task 11: Update README.md

The Commands section still describes `cd worker && npm run dev`. Update it to reflect the new unified setup.

**Files:**

- Modify: `README.md`

Replace the Worker (API) commands section with:

````markdown
### Local development

Run both processes in separate terminals:

```bash
npm run dev          # Vite frontend at localhost:5173
npm run dev:worker   # Wrangler worker at localhost:8787
```
````

Vite proxies `/recommend` and `/feedback` to the worker automatically.

### Deploy

```bash
npm run deploy   # builds frontend then deploys everything via wrangler
```

Secrets must be set in the Cloudflare dashboard (or via `wrangler secret put`):

- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

````

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README for unified worker setup"
````

---

### Task 12: Update CLAUDE.md project structure

**Files:**

- Modify: `CLAUDE.md`

Update the Project Structure section to show `src/server/` and the new scripts. Replace the `worker` reference and add the new commands:

In the Commands section, add:

```
- `npm run dev:worker` -- Start worker locally (http://localhost:8787, proxied from Vite)
- `npm run check:server` -- TypeScript type check for src/server/
- `npm run deploy` -- Build frontend + deploy everything via wrangler
```

In the Project Structure section, add under `src/`:

```
    server/
      index.ts                         # Worker entry point + routing
      recommend.ts                     # /recommend handler (Claude API)
      feedback.ts                      # /feedback handler (memory update)
      supabase.ts                      # Supabase client factory
      prompts.ts                       # System prompts
      weather.ts                       # Weather formatting for prompts
      types.ts                         # Env + request/response types
```

**Step 3: Final commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for unified structure"
```

---

### Task 13: Open PR

```bash
git push -u origin feat/unify-worker
gh pr create --title "feat: unify frontend and worker into single Cloudflare Worker" \
  --body "..."
```
