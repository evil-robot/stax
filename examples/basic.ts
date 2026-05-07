import { renderChart } from "../src";
import { writeFileSync } from "fs";

const png = renderChart({
  title: "DTI Scoring Weights by Dimension",
  labels: ["Provenance", "Consent", "Recency", "Quality", "Concordance", "Validation", "Breadth", "Stability"],
  values: [25, 20, 15, 10, 10, 10, 5, 5],
  unit: "%",
  descriptions: [
    "Origin and chain of custody of the data",
    "Verified patient consent status",
    "How recently the data was collected",
    "Completeness and accuracy of records",
    "Agreement across independent data sources",
    "Third-party verification of key fields",
    "Coverage across relevant data categories",
    "Consistency of the data over time",
  ],
  brandText: "supertruth.ai · © SuperTruth 2026",
});

writeFileSync("example-output.png", png);
console.log("Wrote example-output.png (" + png.length + " bytes)");
