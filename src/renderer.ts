import { createCanvas, Image, registerFont, type CanvasRenderingContext2D as NodeCtx } from "canvas";
import { JSDOM } from "jsdom";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

import { CUBE, CHART, PALETTE, COLOR, TYPE, FONT_FAMILY, BRAND, LEGEND } from "./tokens";
import type { ChartSpec } from "./types";

// ─── Font registration ────────────────────────────────────────────────────────
let fontsRegistered = false;
function ensureFontsRegistered() {
  if (fontsRegistered) return;
  fontsRegistered = true;
  const weights: Array<{ file: string; weight: "400" | "500" | "600" | "700" }> = [
    { file: "inter-latin-400-normal.woff", weight: "400" },
    { file: "inter-latin-500-normal.woff", weight: "500" },
    { file: "inter-latin-600-normal.woff", weight: "600" },
    { file: "inter-latin-700-normal.woff", weight: "700" },
  ];
  for (const { file, weight } of weights) {
    try {
      const p = require.resolve(`@fontsource/inter/files/${file}`);
      if (existsSync(p)) registerFont(p, { family: "IsoChart Sans", weight });
    } catch { /* fall back to system sans-serif */ }
  }
}
ensureFontsRegistered();

// ─── obelisk.js (lazy init) ───────────────────────────────────────────────────
interface ObeliskAPI {
  Point: new (x: number, y: number) => unknown;
  Point3D: new (x: number, y: number, z: number) => unknown;
  PixelView: new (canvas: unknown, point: unknown) => {
    renderObject: (primitive: unknown, p3d: unknown) => void;
  };
  CubeDimension: new (x: number, y: number, z: number) => unknown;
  CubeColor: new () => { getByHorizontalColor: (n: number) => unknown };
  Cube: new (dim: unknown, color: unknown, border?: boolean) => unknown;
}

let _obelisk: ObeliskAPI | null = null;

function ensureObelisk(): ObeliskAPI {
  if (_obelisk) return _obelisk;
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
  const g = globalThis as unknown as Record<string, unknown>;
  g.window = dom.window;
  g.document = dom.window.document;
  g.Image = dom.window.Image;
  g.HTMLCanvasElement = dom.window.HTMLCanvasElement;
  const origCreate = dom.window.document.createElement.bind(dom.window.document);
  (dom.window.document as unknown as { createElement: (t: string) => unknown }).createElement = function (tag: string) {
    if (typeof tag === "string" && tag.toLowerCase() === "canvas") {
      const c = createCanvas(1, 1) as unknown as {
        width: number; height: number;
        setAttribute: (a: string, v: string | number) => void;
        getAttribute: (a: string) => number | null;
      };
      c.setAttribute = function (attr: string, value: string | number) {
        if (attr === "width") this.width = parseInt(String(value), 10);
        else if (attr === "height") this.height = parseInt(String(value), 10);
      };
      c.getAttribute = function (attr: string) {
        if (attr === "width") return this.width;
        if (attr === "height") return this.height;
        return null;
      };
      return c;
    }
    return origCreate(tag);
  };
  const obeliskCode = readFileSync(join(__dirname, "vendor/obelisk.min.js"), "utf8");
  // eslint-disable-next-line no-eval
  (0, eval)(obeliskCode);
  _obelisk = (dom.window as unknown as { obelisk: ObeliskAPI }).obelisk;
  if (!_obelisk) throw new Error("obelisk.js failed to load");
  return _obelisk;
}

// ─── Logo cache ───────────────────────────────────────────────────────────────
const _logoCache = new Map<string, Image | null>();
function getLogo(logoPath?: string): Image | null {
  if (!logoPath) return null;
  if (_logoCache.has(logoPath)) return _logoCache.get(logoPath)!;
  try {
    const buf = readFileSync(logoPath);
    const img = new Image();
    img.src = buf;
    _logoCache.set(logoPath, img);
    return img;
  } catch {
    _logoCache.set(logoPath, null);
    return null;
  }
}

// ─── Color helpers ────────────────────────────────────────────────────────────

/** Accept "#14B8A6" or 0x14B8A6 — always return an integer. */
function parseHexColor(val: string | number): number {
  if (typeof val === "number") return val;
  return parseInt(val.replace("#", ""), 16);
}

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToInt(h: number, s: number, l: number): number {
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const r = Math.round(hue(h + 1 / 3) * 255);
  const g = Math.round(hue(h) * 255);
  const b = Math.round(hue(h - 1 / 3) * 255);
  return (r << 16) | (g << 8) | b;
}

function intToHex(n: number): string {
  return "#" + n.toString(16).padStart(6, "0");
}

/** Given a single accent hex string, produce a 4-shade gradient (light → dark). */
function accentToGradient(hex: string): number[] {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  return [
    hslToInt(h, s, Math.min(0.82, l + 0.18)),
    hslToInt(h, s, Math.min(0.72, l + 0.08)),
    hslToInt(h, s, l),
    hslToInt(h, s, Math.max(0.08, l - 0.14)),
  ];
}

// ─── Runtime color resolution ─────────────────────────────────────────────────

interface RuntimeColors {
  bg: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  rowDivider: string;
  markerFill: string;
  markerText: string;
  titleColor: string;
  legendHeaderColor: string;
  legendLabelColor: string;
  legendValueColor: string;
  legendDescColor: string;
  brandColor: string;
}

function resolveColors(spec: ChartSpec): RuntimeColors {
  const dark = spec.theme === "dark";
  const base: RuntimeColors = dark ? {
    bg:                "#0F172A",
    cardBg:            "#1E293B",
    cardBorder:        "#334155",
    cardShadow:        "rgba(0,0,0,0.4)",
    rowDivider:        "#334155",
    markerFill:        COLOR.markerFill,
    markerText:        "#FFFFFF",
    titleColor:        "#F8FAFC",
    legendHeaderColor: "#94A3B8",
    legendLabelColor:  "#CBD5E1",
    legendValueColor:  "#F8FAFC",
    legendDescColor:   "#64748B",
    brandColor:        "#475569",
  } : {
    bg:                COLOR.bg,
    cardBg:            COLOR.cardBg,
    cardBorder:        COLOR.cardBorder,
    cardShadow:        COLOR.cardShadow,
    rowDivider:        COLOR.rowDivider,
    markerFill:        COLOR.markerFill,
    markerText:        COLOR.markerText,
    titleColor:        TYPE.title.color,
    legendHeaderColor: TYPE.legendHeader.color,
    legendLabelColor:  TYPE.legendLabel.color,
    legendValueColor:  TYPE.legendValue.color,
    legendDescColor:   TYPE.legendDescription.color,
    brandColor:        TYPE.brand.color,
  };

  if (spec.accentColor) {
    const [, , midDark] = accentToGradient(spec.accentColor);
    base.markerFill = intToHex(midDark);
  }

  return base;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function markerFor(i: number): string {
  return String.fromCharCode(65 + (i % 26));
}

function wrapTitle(title: string, maxChars: number): string[] {
  if (title.length <= maxChars) return [title];
  const cut = title.lastIndexOf(" ", maxChars);
  if (cut <= 0) return [title.slice(0, maxChars), title.slice(maxChars)];
  return [title.slice(0, cut), title.slice(cut + 1)];
}

function setFont(ctx: NodeCtx, weight: string, size: number) {
  ctx.font = `${weight} ${size}px ${FONT_FAMILY}`;
}

function formatValue(v: number, unit: string): string {
  if (!Number.isFinite(v)) return "—";
  return (Number.isInteger(v) ? String(v) : v.toFixed(1)) + unit;
}

function roundedRect(ctx: NodeCtx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawTrackedText(ctx: NodeCtx, text: string, x: number, y: number, tracking: number) {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + tracking;
  }
}

function fitText(ctx: NodeCtx, s: string, maxWidth: number, hardCap: number): string {
  const cleaned = String(s ?? "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  const capped = cleaned.length > hardCap ? cleaned.slice(0, hardCap - 1) + "…" : cleaned;
  if (ctx.measureText(capped).width <= maxWidth) return capped;
  let lo = 1, hi = capped.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ctx.measureText(capped.slice(0, mid) + "…").width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return capped.slice(0, lo) + "…";
}

// ─── Marker ───────────────────────────────────────────────────────────────────
function drawMarker(ctx: NodeCtx, cx: number, cy: number, r: number, text: string, rc: RuntimeColors) {
  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.18)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = rc.markerFill;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = rc.markerText;
  setFont(ctx, TYPE.marker.weight, TYPE.marker.size);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 0.5);
}

// ─── Badge (legend) ───────────────────────────────────────────────────────────
function drawBadge(ctx: NodeCtx, cx: number, cy: number, r: number, text: string, rc: RuntimeColors) {
  ctx.fillStyle = rc.markerFill;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rc.markerText;
  setFont(ctx, "700", Math.max(10, r));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 0.5);
}

// ─── Legend card ──────────────────────────────────────────────────────────────
interface LegendRow { letter: string; label: string; description: string; value: string; }

function drawLegendCard(
  ctx: NodeCtx,
  opts: { x: number; y: number; width: number; height: number; rows: LegendRow[] },
  rc: RuntimeColors,
) {
  const { x, y, width, height, rows } = opts;

  ctx.save();
  ctx.shadowColor = rc.cardShadow;
  ctx.shadowBlur = LEGEND.shadowBlur;
  ctx.shadowOffsetY = LEGEND.shadowOffY;
  ctx.fillStyle = rc.cardBg;
  roundedRect(ctx, x, y, width, height, LEGEND.cornerR);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = rc.cardBorder;
  ctx.lineWidth = LEGEND.borderW;
  roundedRect(ctx, x + 0.5, y + 0.5, width - 1, height - 1, LEGEND.cornerR);
  ctx.stroke();

  const innerTop = y + LEGEND.paddingY;
  ctx.fillStyle = rc.legendHeaderColor;
  setFont(ctx, TYPE.legendHeader.weight, TYPE.legendHeader.size);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  drawTrackedText(ctx, "CATEGORIES", x + LEGEND.paddingX, innerTop, TYPE.legendHeader.letter);

  ctx.strokeStyle = rc.rowDivider;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + LEGEND.paddingX, innerTop + LEGEND.headerH);
  ctx.lineTo(x + width - LEGEND.paddingX, innerTop + LEGEND.headerH);
  ctx.stroke();

  const rowsTop = innerTop + LEGEND.headerH + LEGEND.headerGap;
  const rowsAvail = y + height - LEGEND.paddingY - rowsTop;
  const badgeR = LEGEND.badgeR;
  const labelLeft = x + LEGEND.paddingX + badgeR * 2 + LEGEND.badgeGap;
  const valueRight = x + width - LEGEND.paddingX;

  setFont(ctx, TYPE.legendValue.weight, TYPE.legendValue.size);
  const maxValueW = Math.max(0, ...rows.map(r => ctx.measureText(r.value).width));
  const labelColW = Math.max(40, valueRight - maxValueW - LEGEND.valueGutter - labelLeft);

  const hasAnyDescription = rows.some(r => r.description && r.description.trim().length > 0);
  const labelLineH = TYPE.legendLabel.size + 4;
  const descLineH = TYPE.legendDescription.size + 3;
  const descGap = hasAnyDescription ? 2 : 0;
  const baseRowH = labelLineH + (hasAnyDescription ? descGap + descLineH : 0) + LEGEND.rowGap;
  const targetRowH = rows.length > 0 ? Math.min(baseRowH, rowsAvail / rows.length) : baseRowH;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowTop = rowsTop + i * targetRowH;
    const labelY = rowTop + labelLineH / 2 + 2;

    drawBadge(ctx, x + LEGEND.paddingX + badgeR, labelY, badgeR, row.letter, rc);

    ctx.fillStyle = rc.legendLabelColor;
    setFont(ctx, TYPE.legendLabel.weight, TYPE.legendLabel.size);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(fitText(ctx, row.label, labelColW, LEGEND.maxLabelChars), labelLeft, labelY);

    ctx.fillStyle = rc.legendValueColor;
    setFont(ctx, TYPE.legendValue.weight, TYPE.legendValue.size);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(row.value, valueRight, labelY);

    if (row.description && row.description.trim().length > 0) {
      ctx.fillStyle = rc.legendDescColor;
      setFont(ctx, TYPE.legendDescription.weight, TYPE.legendDescription.size);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const descY = labelY + labelLineH / 2 + descGap + descLineH / 2;
      ctx.fillText(fitText(ctx, row.description, valueRight - labelLeft, LEGEND.maxDescriptionChars), labelLeft, descY);
    }
  }
}

// ─── Brand strip ──────────────────────────────────────────────────────────────
function drawBrandStrip(
  ctx: NodeCtx,
  canvasW: number,
  canvasH: number,
  logo: Image | null,
  brandText: string,
  rc: RuntimeColors,
) {
  setFont(ctx, TYPE.brand.weight, TYPE.brand.size);
  const textW = ctx.measureText(brandText).width;
  const totalW = (logo ? BRAND.logoSize + BRAND.logoGap : 0) + textW;
  const baseY = canvasH - CHART.BRAND_BAND / 2;
  const startX = (canvasW - totalW) / 2;
  if (logo) {
    try { ctx.drawImage(logo, startX, baseY - BRAND.logoSize / 2, BRAND.logoSize, BRAND.logoSize); }
    catch { /* skip */ }
  }
  ctx.fillStyle = rc.brandColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(brandText, startX + (logo ? BRAND.logoSize + BRAND.logoGap : 0), baseY);
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function renderChart(spec: ChartSpec): Buffer {
  const ob = ensureObelisk();
  ensureFontsRegistered();

  const rc = resolveColors(spec);
  const labels = Array.isArray(spec.labels) ? spec.labels : [];
  const values = Array.isArray(spec.values) ? spec.values.map(Number) : [];
  const n = Math.min(labels.length, values.length, 12);
  const unit = spec.unit ?? "";

  if (n === 0) return createCanvas(1, 1).toBuffer("image/png");

  // Resolve cube colors — accentColor wins over palette, both accept strings or integers
  const rawPalette = spec.accentColor
    ? accentToGradient(spec.accentColor)
    : (spec.palette ?? PALETTE.cubes).map(parseHexColor);

  const vals = values.slice(0, n);
  const maxVal = Math.max(...vals.map(v => (Number.isFinite(v) ? Math.abs(v) : 0)), 1);
  const stacks = vals.map(v => {
    if (!Number.isFinite(v) || v <= 0) return 1;
    return Math.max(1, Math.min(CHART.MAX_STACKS, Math.round((v / maxVal) * CHART.MAX_STACKS)));
  });

  const W = CUBE.W, H = CUBE.H, PITCH = CUBE.PITCH;
  const isoLeft = -W;
  const isoRight = (n - 1) * PITCH + W;
  const isoBottom = ((n - 1) * PITCH) / 2 + W;
  let isoTop = 0;
  for (let i = 0; i < n; i++) isoTop = Math.min(isoTop, (i * PITCH) / 2 - stacks[i] * H);

  const isoW = isoRight - isoLeft;
  const isoH = isoBottom - isoTop;
  const canvasW = spec.width ?? CHART.WIDTH;
  const canvasH = spec.height ?? CHART.HEIGHT;

  const titleLines = wrapTitle(spec.title, TYPE.title.maxChars);
  const titleH = titleLines.length * TYPE.title.lineH;
  const bodyTop = CHART.PAD_TOP + titleH + 12;
  const bodyH = canvasH - CHART.BRAND_BAND - bodyTop;
  const bodyW = canvasW - CHART.PAD_SIDES * 2;
  const chartW = (bodyW - CHART.CHART_GAP) * CHART.CHART_FRAC;
  const legendW = bodyW - CHART.CHART_GAP - chartW;
  const chartLeft = CHART.PAD_SIDES;
  const legendLeft = chartLeft + chartW + CHART.CHART_GAP;

  const MARKER_R = TYPE.marker.radius;
  const availChartH = bodyH - MARKER_R * 2 - 10;
  const scale = Math.max(0.4, Math.min(CHART.MAX_SCALE, Math.min((chartW - 8) / isoW, availChartH / isoH)));
  const offsetX = chartLeft + (chartW - isoW * scale) / 2 - isoLeft * scale;
  const offsetY = bodyTop + (availChartH - isoH * scale) / 2 - isoTop * scale;

  const canvas = createCanvas(canvasW, canvasH);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = rc.bg;
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.fillStyle = rc.titleColor;
  setFont(ctx, TYPE.title.weight, TYPE.title.size);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  titleLines.forEach((line, i) => ctx.fillText(line, canvasW / 2, CHART.PAD_TOP + i * TYPE.title.lineH));

  // Render cubes onto an intermediate canvas, then scale onto the main canvas
  const isoCanvas = createCanvas(Math.max(2, Math.ceil(isoW + 2)), Math.max(2, Math.ceil(isoH + 2)));
  const pixelView = new ob.PixelView(isoCanvas, new ob.Point(-isoLeft, -isoTop));

  for (let i = 0; i < n; i++) {
    const stackCount = stacks[i];
    for (let k = 0; k < stackCount; k++) {
      const colorIdx = stackCount === 1
        ? 0
        : Math.floor((k / (stackCount - 1)) * (rawPalette.length - 1));
      const dim = new ob.CubeDimension(W, W, H);
      const color = new ob.CubeColor().getByHorizontalColor(rawPalette[Math.min(colorIdx, rawPalette.length - 1)]);
      pixelView.renderObject(new ob.Cube(dim, color, false), new ob.Point3D(i * PITCH, 0, k * H));
    }
  }

  const smoothCtx = ctx as unknown as { imageSmoothingEnabled: boolean; imageSmoothingQuality?: "low" | "medium" | "high" };
  smoothCtx.imageSmoothingEnabled = true;
  smoothCtx.imageSmoothingQuality = "high";
  ctx.drawImage(isoCanvas, offsetX + isoLeft * scale, offsetY + isoTop * scale, isoCanvas.width * scale, isoCanvas.height * scale);

  for (let i = 0; i < n; i++) {
    drawMarker(ctx, offsetX + i * PITCH * scale, offsetY + (i * PITCH / 2 + W) * scale + MARKER_R + 4, MARKER_R, markerFor(i), rc);
  }

  const descriptions = Array.isArray(spec.descriptions) ? spec.descriptions : [];
  drawLegendCard(ctx, {
    x: legendLeft, y: bodyTop, width: legendW, height: bodyH,
    rows: vals.map((v, i) => ({
      letter: markerFor(i),
      label: String(labels[i] ?? ""),
      description: String(descriptions[i] ?? ""),
      value: formatValue(v, unit),
    })),
  }, rc);

  const brandText = spec.brandText !== undefined ? spec.brandText : `${BRAND.strip} ${new Date().getFullYear()}`;
  if (brandText) drawBrandStrip(ctx, canvasW, canvasH, getLogo(spec.brandLogo), brandText, rc);

  return canvas.toBuffer("image/png");
}
