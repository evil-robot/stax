import { renderChart } from "../src";
import { writeFileSync } from "fs";

const spec = {
  title: "DTI Scoring Weights by Dimension",
  labels: ["Provenance", "Consent", "Recency", "Quality", "Concordance", "Validation", "Breadth", "Stability"],
  values: [25, 20, 15, 10, 10, 10, 5, 5],
  unit: "%",
};

// accentColor with hex string palette
writeFileSync("example-indigo.png", renderChart({ ...spec, accentColor: "#6366F1" }));
writeFileSync("example-rose.png",   renderChart({ ...spec, accentColor: "#F43F5E" }));

// hex string palette (old-style but with strings now)
writeFileSync("example-amber.png",  renderChart({ ...spec, palette: ["#FCD34D", "#FBBF24", "#F59E0B", "#D97706"] }));

// dark theme
writeFileSync("example-dark.png",   renderChart({ ...spec, theme: "dark" }));

// dark + accent
writeFileSync("example-dark-violet.png", renderChart({ ...spec, theme: "dark", accentColor: "#8B5CF6" }));

console.log("All 5 examples written.");
