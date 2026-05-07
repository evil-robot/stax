// Isometric chart design system.
// Every dimension and color is a named token — edit here to change all charts.

// ─── Cube geometry (in obelisk iso units, integers) ──────────────────────────
// obelisk constraints: W must be even and > 4; H must be > 2.
export const CUBE = {
  W:   40,
  H:   18,
  GAP: 22,
  get PITCH() { return this.W + this.GAP; },
};

// ─── Canvas layout ───────────────────────────────────────────────────────────
export const CHART = {
  WIDTH:       960,
  HEIGHT:      540,
  MAX_STACKS:  10,
  MAX_SCALE:   1.6,
  PAD_TOP:     26,
  PAD_SIDES:   32,
  CHART_GAP:   24,
  CHART_FRAC:  0.55,
  BRAND_BAND:  46,
};

// ─── Palette ─────────────────────────────────────────────────────────────────
// Top-face hex integers per stack level. obelisk derives left/right face colors
// via getByHorizontalColor(). Light at base, darker toward top.
export const PALETTE = {
  cubes: [
    0x14B8A6, // teal-500
    0x0D9488, // teal-600
    0x0F766E, // teal-700
    0x115E59, // teal-800
  ],
};

export const COLOR = {
  bg:          "#FFFFFF",
  cardBg:      "#FFFFFF",
  cardBorder:  "#E2E8F0",
  cardShadow:  "rgba(15, 23, 42, 0.04)",
  rowDivider:  "#F1F5F9",
  markerFill:  "#0F766E",
  markerText:  "#FFFFFF",
};

// ─── Typography ──────────────────────────────────────────────────────────────
export const FONT_FAMILY = "'IsoChart Sans', 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export const TYPE = {
  family: FONT_FAMILY,

  title: {
    size:     17,
    weight:   "700",
    color:    "#0F172A",
    lineH:    24,
    maxChars: 60,
  },

  legendHeader: {
    size:   11,
    weight: "600",
    color:  "#64748B",
    letter: 1.2,
  },
  legendLabel: {
    size:   12,
    weight: "500",
    color:  "#334155",
  },
  legendValue: {
    size:   12,
    weight: "700",
    color:  "#0F172A",
  },
  legendDescription: {
    size:   10,
    weight: "400",
    color:  "#94A3B8",
  },

  marker: {
    size:   11,
    weight: "700",
    radius: 12,
  },

  brand: {
    size:   11,
    weight: "500",
    color:  "#94A3B8",
  },
};

// ─── Brand strip ─────────────────────────────────────────────────────────────
export const BRAND = {
  logoSize: 24,
  logoGap:  10,
  strip:    "stax by Artists & Robots · artistsandrobots.com",
};

// ─── Legend card layout (px) ─────────────────────────────────────────────────
export const LEGEND = {
  paddingX:             20,
  paddingY:             18,
  rowGap:               11,
  badgeR:               11,
  badgeGap:             12,
  valueGutter:          12,
  cornerR:              14,
  borderW:              1,
  shadowBlur:           10,
  shadowOffY:           2,
  headerH:              22,
  headerGap:            12,
  maxLabelChars:        36,
  maxDescriptionChars:  72,
};
