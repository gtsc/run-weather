# Widget Polish v2 + PWA Icon — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix bar/header alignment, show current conditions in title row, add best-slot score, and replace the placeholder PWA icon with a runner silhouette + "RW" monogram.

**Architecture:** All widget changes are confined to `src/scriptable/widget.ts`. The bar wraps in a stack to fill available width. Current conditions are appended to `titleRow` (in scope) inside the try block after the forecast fetch. The icon script is edited in-place and re-run.

**Tech Stack:** TypeScript, esbuild, Scriptable iOS runtime, Node + sharp (icon generation).

---

### Task 1: Fix bar alignment and add score to best-time label

**Files:**
- Modify: `src/scriptable/widget.ts`

**Step 1: Wrap the bar image in a horizontal stack**

In `renderDay`, find:
```ts
  const barImg = widget.addImage(dc.getImage());
  barImg.cornerRadius = 3;
```
Replace with:
```ts
  const barStack = widget.addStack();
  barStack.layoutHorizontally();
  const barImg = barStack.addImage(dc.getImage());
  barImg.cornerRadius = 3;
```

**Step 2: Append score to the best-time label**

In `renderDay`, find:
```ts
  const bestLabel = best ? `${formatHour(best.startHour)}–${formatHour(best.endHour)}` : '–';
```
Replace with:
```ts
  const bestLabel = best ? `${formatHour(best.startHour)}–${formatHour(best.endHour)} · ${best.score}` : '–';
```

**Step 3: Run type check**

```bash
npm run check
```

Expected: 0 errors, 0 warnings.

**Step 4: Commit**

```bash
git add src/scriptable/widget.ts
git commit -m "fix: align bar to header width and show score next to best-time"
```

---

### Task 2: Add current conditions to the title row

**Files:**
- Modify: `src/scriptable/widget.ts`

**Step 1: Add getWeatherInfo import**

At the top of the file, find:
```ts
import { scoreColorHex, formatHour } from '../lib/utils/format';
```
Replace with:
```ts
import { scoreColorHex, formatHour } from '../lib/utils/format';
import { getWeatherInfo } from '../lib/scoring/weatherCodes';
```

**Step 2: Remove the unconditional spacer after the title row**

Find:
```ts
  titleText.textColor = new Color(theme.muted);
  widget.addSpacer(6);
```
Replace with:
```ts
  titleText.textColor = new Color(theme.muted);
```

**Step 3: Add conditions to titleRow inside the try block and restore the spacer**

Find:
```ts
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

    for (const [i, date] of [today, tomorrow].entries()) {
```
Replace with:
```ts
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

    titleRow.addSpacer();
    const nowHour = hours.find((h: HourData) => h.date === today && h.hour === new Date().getHours());
    if (nowHour) {
      const condText = `${getWeatherInfo(nowHour.weatherCode).label} · ${Math.round(nowHour.temperature)}°`;
      const condEl = titleRow.addText(condText);
      condEl.font = Font.systemFont(10);
      condEl.textColor = new Color(theme.muted);
    }
    widget.addSpacer(6);

    for (const [i, date] of [today, tomorrow].entries()) {
```

**Step 4: Restore the spacer in the catch block**

Find:
```ts
  } catch (e) {
    const errStack = widget.addStack();
```
Replace with:
```ts
  } catch (e) {
    widget.addSpacer(6);
    const errStack = widget.addStack();
```

**Step 5: Run type check**

```bash
npm run check
```

Expected: 0 errors, 0 warnings.

**Step 6: Build widget and verify bundle**

```bash
npm run build:widget
```

Expected: `scriptable/widget.js` rebuilt, ~10–11 KB, no errors.

```bash
node -e "
const code = require('fs').readFileSync('scriptable/widget.js', 'utf8');
console.log('has getWeatherInfo:', code.includes('getWeatherInfo') || code.includes('WEATHER_CODES'));
console.log('has nowHour:', code.includes('nowHour'));
"
```

Expected: both `true`.

**Step 7: Run lint**

```bash
npm run lint
```

Expected: clean. If formatting issues only, run `npm run format` first.

**Step 8: Commit**

```bash
git add src/scriptable/widget.ts scriptable/widget.js
git commit -m "feat: show current conditions in widget title row"
```

---

### Task 3: Improve PWA icon

**Files:**
- Modify: `scripts/generate-icons.mjs`
- Regenerate: `public/icons/icon-192.png`, `public/icons/icon-512.png`

**Step 1: Update the SVG in generate-icons.mjs**

Replace the entire `svg` buffer definition (the `Buffer.from(...)` call) with:

```js
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#22c55e"/>
  <circle cx="64" cy="17" r="7.5" fill="white"/>
  <g stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="5.5" fill="none">
    <line x1="62" y1="25" x2="48" y2="50"/>
    <line x1="57" y1="36" x2="73" y2="26"/>
    <line x1="57" y1="36" x2="42" y2="46"/>
    <line x1="48" y1="50" x2="62" y2="68"/>
    <line x1="62" y1="68" x2="72" y2="64"/>
    <line x1="48" y1="50" x2="37" y2="62"/>
    <line x1="37" y1="62" x2="30" y2="53"/>
  </g>
  <text x="50" y="92" font-family="system-ui,Arial,sans-serif" font-size="21" font-weight="800" text-anchor="middle" fill="white">RW</text>
</svg>`);
```

**Step 2: Regenerate icon files**

```bash
node scripts/generate-icons.mjs
```

Expected output:
```
✓ icon-192.png
✓ icon-512.png
```

**Step 3: Run lint**

```bash
npm run lint
```

Expected: clean.

**Step 4: Commit**

```bash
git add scripts/generate-icons.mjs public/icons/icon-192.png public/icons/icon-512.png
git commit -m "feat: replace placeholder PWA icon with runner silhouette and RW monogram"
```

---

### Task 4: Final verification and push

**Step 1: Run all tests**

```bash
npm test
```

Expected: 8 tests pass.

**Step 2: Run production build**

```bash
npm run build
```

Expected: success, no errors.

**Step 3: Push**

```bash
git push
```
