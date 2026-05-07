# stax

**Server-side isometric 3D bar chart generation for Node.js.** No browser. No external service. Pure PNG output.

An [Artists & Robots](https://artistsandrobots.com) project by [Jason Alan Snyder](https://evilrobot.com).

---

![Leukemia patient behavior chart](docs/example-leukemia-1.png)

*Generated server-side, embedded directly in a blog post. No browser, no client-side rendering.*

---

## Why this exists

I'm the co-founder of [Artists & Robots](https://artistsandrobots.com) and [SuperTruth](https://supertruth.ai). For the SuperTruth blog, I wanted isometric stacked-cube charts — the kind that make data feel dimensional and alive — generated server-side so they could be embedded directly in blog posts, emails, and dynamically generated content.

There was no library that did this. Everything I found was browser-only, a Chrome extension, or a React component. Getting [obelisk.js](https://github.com/nosir/obelisk.js) (the only serious isometric canvas library) running inside Node.js with [node-canvas](https://github.com/Automattic/node-canvas) and JSDOM took a few days of digging. The result powers every chart on [supertruth.ai/blog](https://supertruth.ai/blog). I figured others would benefit from having this solved.

---

## Install

```bash
npm install @artistsandrobots/stax
```

> **Note:** `canvas` requires native dependencies. On Linux: `apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`. On Mac: `brew install pkg-config cairo pango libpng jpeg giflib librsvg`.

---

## Usage

```ts
import { renderChart } from '@artistsandrobots/stax';
import { writeFileSync } from 'fs';

const png = renderChart({
  title: 'Analysis Time: Before vs After AI',
  labels: ['Ingestion', 'Scoring', 'QA Review', 'Reporting', 'Delivery'],
  values: [42, 18, 31, 25, 9],
  unit: ' hrs',
});

// png is a Buffer — write to disk, upload to S3, embed in markdown, whatever.
writeFileSync('chart.png', png);
```

---

## Output

960×540 PNG (default, configurable). Two-column layout: isometric chart left, legend card right.

![Ovarian cancer awareness chart](docs/example-ovarian-1.png)

![Leukemia treatment decision signals](docs/example-leukemia-2.png)

![Key statistics chart](docs/example-ovarian-2.png)

---

## API

```ts
renderChart(spec: ChartSpec): Buffer
```

### ChartSpec

| Field | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | required | Chart title (wraps at 60 chars) |
| `labels` | `string[]` | required | Bar labels. Max 12 bars (A–L). |
| `values` | `number[]` | required | Numeric values for each bar |
| `unit` | `string` | `""` | Appended to each value in the legend (e.g. `"%"`, `" hrs"`) |
| `descriptions` | `string[]` | — | Optional subtext per bar in the legend card |
| `width` | `number` | `960` | Canvas width in px |
| `height` | `number` | `540` | Canvas height in px |
| `brandText` | `string` | stax credit | Brand strip text. Pass `""` to hide. |
| `brandLogo` | `string` | — | Absolute path to a logo image file |
| `palette` | `number[]` | teal gradient | Cube colors as hex integers (light → dark, per stack level) |

---

## Design tokens

Every dimension, color, and typographic value is defined in `src/tokens.ts`. Fork it to change the palette, layout proportions, or brand strip.

```ts
// Default cube palette — light at base, dark at top
export const PALETTE = {
  cubes: [
    0x14B8A6, // teal-500
    0x0D9488, // teal-600
    0x0F766E, // teal-700
    0x115E59, // teal-800
  ],
};
```

Pass a custom palette per render:

```ts
renderChart({
  // ...
  palette: [0x6366F1, 0x4F46E5, 0x4338CA, 0x3730A3], // indigo
});
```

---

## How it works

Stax bundles [obelisk.js](https://github.com/nosir/obelisk.js) and runs it inside a JSDOM environment so it has access to a DOM, then hands it a [node-canvas](https://github.com/Automattic/node-canvas) surface for actual rendering. The result is a native PNG buffer via Cairo — no browser, no Puppeteer, no headless Chrome.

```
ChartSpec → JSDOM shim → obelisk.js → node-canvas → Buffer (PNG)
```

Font rendering uses Inter via `@fontsource/inter` when available, with system sans-serif as fallback.

---

## Used by

**[SuperTruth](https://supertruth.ai)** — every chart on [supertruth.ai/blog](https://supertruth.ai/blog) is generated server-side using stax.

---

## About

Built by [Jason Alan Snyder](https://evilrobot.com), co-founder of [Artists & Robots](https://artistsandrobots.com) and [SuperTruth](https://supertruth.ai).

MIT License. Copyright (c) 2026 Jason Alan Snyder / Artists & Robots.
