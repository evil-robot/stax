export interface ChartSpec {
  title: string;
  labels: string[];
  values: number[];
  unit?: string;
  descriptions?: string[];
  width?: number;
  height?: number;
  brandText?: string;
  brandLogo?: string;
  /** Cube colors per stack level, light → dark. Accepts hex strings ("#14B8A6") or integers (0x14B8A6). */
  palette?: (string | number)[];
  /** Single hex color. Auto-generates a 4-shade gradient and tints the markers. Overrides palette. */
  accentColor?: string;
  /** "dark" flips to a dark background with adjusted card and text colors. Default: "light". */
  theme?: "light" | "dark";
}
