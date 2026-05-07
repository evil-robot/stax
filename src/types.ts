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
  palette?: number[];
}
