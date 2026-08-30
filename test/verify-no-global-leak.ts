// Verifies the scoped-browser-globals behavior:
//  1. renderChart still produces a valid PNG (chart rendering unbroken)
//  2. After rendering, globalThis.window/document/Image/HTMLCanvasElement are NOT leaked
//     (a leaked window object makes SDKs with browser-detection guards refuse to
//      run in the host process — the exact failure this guards against)
import { renderChart } from "../src/index";

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error("FAIL:", msg); process.exit(1); }
  console.log("ok  -", msg);
}

const g = globalThis as unknown as Record<string, unknown>;
const before = {
  window: "window" in g,
  document: "document" in g,
  Image: "Image" in g,
  HTMLCanvasElement: "HTMLCanvasElement" in g,
};

// Render twice to exercise both the first-render (eval) path and a cached render.
const spec = {
  title: "Global leak regression",
  labels: ["Alpha", "Beta", "Gamma", "Delta"],
  values: [92, 78, 64, 41],
  unit: "",
  descriptions: ["first", "second", "third", "fourth"],
};
const png1 = renderChart(spec);
const png2 = renderChart(spec);

assert(Buffer.isBuffer(png1), "render 1 returns a Buffer");
assert(Buffer.isBuffer(png2), "render 2 (cached obelisk) returns a Buffer");
assert(png1.length > 1000, `PNG is a real image (${png1.length} bytes)`);
assert(png1[0] === 0x89 && png1[1] === 0x50 && png1[2] === 0x4e && png1[3] === 0x47, "PNG magic bytes present");

// The crux: globals must be restored to their pre-render state.
for (const key of ["window", "document", "Image", "HTMLCanvasElement"] as const) {
  assert((key in g) === before[key], `globalThis.${key} not leaked (still ${before[key] ? "present" : "absent"})`);
}

// What a browser-detection guard would see after rendering.
assert(typeof window === "undefined" || before.window, "host process does not look like a browser after rendering");

console.log("\nALL CHECKS PASSED");
