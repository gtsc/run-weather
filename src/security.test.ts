/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

describe('Content-Security-Policy', () => {
  const html = read('index.html');
  const headers = read('public/_headers');
  const csp = headers.match(/Content-Security-Policy: (.+)/)?.[1] ?? '';

  it('allows every inline <script> in index.html by hash (edit one → update public/_headers)', () => {
    const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    expect(inline.length).toBeGreaterThan(0);
    for (const body of inline) {
      const hash = createHash('sha256').update(body).digest('base64');
      expect(csp).toContain(`'sha256-${hash}'`);
    }
  });

  it('does not allow arbitrary inline or eval-ed script', () => {
    const scriptSrc = csp.match(/script-src ([^;]+)/)?.[1] ?? '';
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it('lets the app reach every API origin it calls', () => {
    const sources = ['src/lib/api/forecast.ts', 'src/lib/api/geocoding.ts'].map(read).join('\n');
    const origins = new Set([...sources.matchAll(/'(https:\/\/[^/']+)/g)].map((m) => m[1]));
    expect(origins.size).toBeGreaterThan(0);
    for (const origin of origins) expect(csp).toMatch(new RegExp(`connect-src[^;]*${origin}`));
  });
});
