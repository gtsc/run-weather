# Widget Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a title bar (SF Symbol + app name), 1px segment gaps, grey out past hours, dark/light mode colours, and tap-to-open the web app.

**Architecture:** All changes are confined to `src/scriptable/widget.ts`. A `theme` object is resolved once at startup via `Device.isUsingDarkAppearance()` and passed into `renderDay`. The DrawContext loop gains a `now` timestamp check to grey out past segments and draws each segment 1pt narrower to create gaps. A title bar stack is prepended to the widget. `widget.url` opens the deployed web app on tap.

**Tech Stack:** TypeScript, esbuild, Scriptable iOS runtime.

---

### Task 1: Add Device declaration, theme resolution, title bar, and tap URL

**Files:**

- Modify: `src/scriptable/widget.ts`

**Step 1: Add `Device` and `SFSymbol` to the Scriptable global declarations block**

Find the declarations block (lines 9–23) and add after the `config` declaration:

```ts
declare const Device: { isUsingDarkAppearance(): boolean };
declare const SFSymbol: { named(_name: string): { applyFont(_font: any): void; image: any } };
```

**Step 2: Add constants above `DEFAULT_PREFS`**

```ts
const WEBSITE_URL = 'https://gtsc.github.io/run-weather/';
```

**Step 3: Add theme resolution at the top of `run()`**

In `run()`, immediately after `const widget = new ListWidget();`, add:

```ts
const isDark = Device.isUsingDarkAppearance();
const theme = {
  bg: isDark ? '#1c1c1e' : '#f2f2f7',
  label: isDark ? '#ffffff' : '#000000',
  muted: isDark ? '#8e8e93' : '#6c6c70',
  pastSeg: isDark ? '#48484a' : '#c7c7cc',
};
```

**Step 4: Use theme.bg for widget background and set tap URL**

Replace:

```ts
widget.backgroundColor = new Color('#1c1c1e');
widget.setPadding(12, 14, 12, 14);
```

With:

```ts
widget.backgroundColor = new Color(theme.bg);
widget.setPadding(12, 14, 12, 14);
widget.url = WEBSITE_URL;
```

**Step 5: Add title bar after `widget.setPadding`**

Insert immediately after `widget.url = WEBSITE_URL;`:

```ts
// Title bar: SF Symbol icon + app name
const titleRow = widget.addStack();
titleRow.layoutHorizontally();
titleRow.centerAlignContent();
const sym = SFSymbol.named('figure.run');
sym.applyFont(Font.systemFont(11));
const symImg = titleRow.addImage(sym.image);
symImg.imageSize = new Size(13, 13);
symImg.tintColor = new Color('#26a65b');
titleRow.addSpacer(5);
const titleText = titleRow.addText('Run Weather');
titleText.font = Font.boldSystemFont(11);
titleText.textColor = new Color(theme.muted);
widget.addSpacer(6);
```

**Step 6: Pass theme into renderDay calls**

Change every `renderDay(widget, date, dayHours)` call to:

```ts
renderDay(widget, date, dayHours, theme);
```

**Step 7: Update renderDay signature to accept theme**

Change:

```ts
function renderDay(widget: any, date: string, dayHours: HourData[]): void {
```

To:

```ts
function renderDay(
  widget: any,
  date: string,
  dayHours: HourData[],
  theme: { label: string; muted: string; pastSeg: string }
): void {
```

**Step 8: Use theme colours for text in renderDay**

Replace:

```ts
label.textColor = new Color('#ffffff');
```

With:

```ts
label.textColor = new Color(theme.label);
```

Replace:

```ts
bestText.textColor = new Color('#8e8e93');
```

With:

```ts
bestText.textColor = new Color(theme.muted);
```

**Step 9: Run type check**

```bash
npm run check
```

Expected: 0 errors, 0 warnings.

**Step 10: Commit**

```bash
git add src/scriptable/widget.ts
git commit -m "feat: add title bar, dark/light theme, and tap-to-open in widget"
```

---

### Task 2: Add segment gaps and past hour greying

**Files:**

- Modify: `src/scriptable/widget.ts`

**Step 1: Replace the DrawContext loop in renderDay**

Find the DrawContext block (starting with `const BAR_W = 288;`) and replace it entirely with:

```ts
// Row 2: 24 coloured hour segments drawn as an image
const BAR_W = 288;
const BAR_H = 16;
const segW = BAR_W / scored.length;
const now = new Date();
const dc = new DrawContext();
dc.size = new Size(BAR_W, BAR_H);
dc.opaque = false;
for (let i = 0; i < scored.length; i++) {
  const isPast = new Date(scored[i].time) < now;
  dc.setFillColor(isPast ? new Color(theme.pastSeg) : toColor(scoreColorHex(scored[i].score)));
  dc.fillRect(new Rect(Math.round(i * segW), 0, Math.max(1, Math.ceil(segW) - 1), BAR_H));
}
const barImg = widget.addImage(dc.getImage());
barImg.cornerRadius = 3;
```

**Step 2: Run type check**

```bash
npm run check
```

Expected: 0 errors.

**Step 3: Build widget**

```bash
npm run build:widget
```

Expected: `scriptable/widget.js` rebuilt, ~9–10 KB, no errors.

**Step 4: Verify bundle contains the new logic**

```bash
node -e "
const code = require('fs').readFileSync('scriptable/widget.js', 'utf8');
console.log('has isPast:', code.includes('isPast'));
console.log('has isUsingDarkAppearance:', code.includes('isUsingDarkAppearance'));
console.log('has figure.run:', code.includes('figure.run'));
console.log('has WEBSITE_URL:', code.includes('gtsc.github.io'));
"
```

Expected: all four print `true`.

**Step 5: Run lint**

```bash
npm run lint
```

Expected: clean.

**Step 6: Commit**

```bash
git add src/scriptable/widget.ts scriptable/widget.js
git commit -m "feat: add segment gaps and grey out past hours in widget"
```

---

### Task 3: Final verification and push

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
