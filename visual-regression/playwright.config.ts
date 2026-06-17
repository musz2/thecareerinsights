import { defineConfig } from "@playwright/test";

/**
 * Visual-regression harness for the TCI site.
 *
 * Purpose: safely refactor CSS (e.g. flattening the version-layer
 * redeclarations in global.css) by catching any pixel change across every
 * page and breakpoint.
 *
 * Workflow:
 *   1. Build the CURRENT (known-good) site:      npm run build
 *   2. Capture reference baselines:              npm run vr:approve
 *   3. Make the CSS change, then:                npm run build
 *   4. Diff against the baselines:               npm run vr
 *   5. Inspect failures (side-by-side + diff):   npm run vr:report
 *
 * Baselines live in visual-regression/__screenshots__/ and are the reference;
 * .report/ and .results/ are transient.
 */
export default defineConfig({
  testDir: ".",
  outputDir: ".results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  /* Full-page shots can flake ~1-2% on tall, content-heavy pages; let
     transient diffs self-heal on retry (a real regression fails every run). */
  retries: 2,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["html", { outputFolder: ".report", open: "never" }], ["list"]],

  /* Start the built site automatically and reuse a running instance locally. */
  webServer: {
    command: "npm run preview",
    url: "http://localhost:4321",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },

  use: {
    baseURL: "http://localhost:4321",
    /* The site self-gates motion on this; also stabilises canvas/cursor. */
    reducedMotion: "reduce",
  },

  /* Tolerate sub-pixel font-rendering noise; flag real layout/colour shifts. */
  expect: {
    /* Large full-page shots need headroom for the stability loop to settle. */
    timeout: 20_000,
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
    },
  },

  /* Keep baselines OS-scoped so they stay valid if ever run on CI/Linux too. */
  snapshotPathTemplate: "__screenshots__/{platform}/{arg}{ext}",
});
