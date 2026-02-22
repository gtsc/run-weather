# Widget Polish Design

**Date:** 2026-02-22
**Status:** Approved

## Summary

Three visual improvements to the Scriptable iOS widget:

1. **Segment gaps** — 1px gap between each of the 24 hour segments, matching the frontend's `gap-px`
2. **Past hour greying** — hours that have already passed are rendered in a flat grey instead of their score colour
3. **Dark/light mode** — widget background and text colours adapt to the phone's current appearance

## Colour Scheme

| | Dark | Light |
|---|---|---|
| Background | `#1c1c1e` | `#f2f2f7` |
| Day label | `#ffffff` | `#000000` |
| Best window time | `#8e8e93` | `#6c6c70` |
| Past segment | `#48484a` | `#c7c7cc` |

## Changes to `src/scriptable/widget.ts`

**Add `Device` global declaration:**
```ts
declare const Device: { isUsingDarkAppearance(): boolean };
```

**Resolve colour scheme once at startup** (in `run()`, before rendering):
```ts
const isDark = Device.isUsingDarkAppearance();
const theme = {
  bg:       isDark ? '#1c1c1e' : '#f2f2f7',
  label:    isDark ? '#ffffff' : '#000000',
  muted:    isDark ? '#8e8e93' : '#6c6c70',
  pastSeg:  isDark ? '#48484a' : '#c7c7cc',
};
```

**Pass theme into `renderDay`** — update signature to accept theme and use its colours for labels and past segments.

**Segment gaps** — in the DrawContext loop, draw each segment as `segW - 1` pt wide:
```ts
dc.fillRect(new Rect(Math.round(i * segW), 0, Math.max(1, Math.ceil(segW) - 1), BAR_H));
```

**Past hour detection** — per segment, check if the hour has passed:
```ts
const isPast = new Date(scored[i].time) < now;
dc.setFillColor(isPast ? new Color(theme.pastSeg) : toColor(scoreColorHex(scored[i].score)));
```

## No changes to shared lib

All changes are confined to `src/scriptable/widget.ts`. The scoring, forecasting, and formatting logic is unchanged.
