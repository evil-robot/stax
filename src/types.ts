export interface ChartSpec {
  /** Chart title. Wraps to two lines at 60 characters. */
  title: string;
  /** Label for each bar. Maximum 12 bars (A–L). */
  labels: string[];
  /** Numeric value for each bar. Values ≤ 0 render as a single-cube minimum bar. */
  values: number[];
  /** Appended to each value in the legend, verbatim — include a leading space if you want one (" hrs"). */
  unit?: string;
  /** Optional subtext shown under each label in the legend card. */
  descriptions?: string[];
  /** Canvas width in px. Default: 960. */
  width?: number;
  /** Canvas height in px. Default: 540. */
  height?: number;
  /** Text in the bottom brand strip. Pass "" to hide the strip entirely. */
  brandText?: string;
  /** Absolute path to a logo image file. Drawn left of brandText. */
  brandLogo?: string;
  /** Cube colors per stack level, light → dark. Accepts hex strings ("#14B8A6") or integers (0x14B8A6). */
  palette?: (string | number)[];
  /** Single hex color. Auto-generates a 4-shade gradient and tints the markers. Overrides palette. */
  accentColor?: string;
  /** "dark" flips to a dark background with adjusted card and text colors. Default: "light". */
  theme?: "light" | "dark";
}
