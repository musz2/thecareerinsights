import { test, expect, type Page } from "@playwright/test";

/* Every routable page (team.astro redirects to /leadership, so it's covered). */
const routes = [
  "/",
  "/about",
  "/services",
  "/industries",
  "/leadership",
  "/contact",
  "/solutions",
  "/solutions/rpo",
  "/solutions/contingent-workforce",
  "/solutions/talent-solutions",
  "/privacy-policy",
  "/terms-and-conditions",
];

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 900 },
];

const slug = (route: string) => (route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-"));

/* Settle the page into a deterministic state for pixel comparison. */
async function settle(page: Page) {
  /* Hard-freeze any residual motion and hide blinking carets/scroll jumps. */
  await page.addStyleTag({
    content: `*,*::before,*::after{animation:none!important;transition:none!important;animation-play-state:paused!important;caret-color:transparent!important}
      html{scroll-behavior:auto!important}`,
  });
  /* Full-page screenshots scroll the page, which would lazily load images
     mid-capture and make shots non-deterministic. Force every image eager,
     walk the whole page to trigger loads, then wait for them to decode. */
  await page.evaluate(async () => {
    for (const img of Array.from(document.images)) {
      img.loading = "eager";
      img.removeAttribute("loading");
    }
    await new Promise<void>((resolve) => {
      let y = 0;
      const step = () => {
        window.scrollTo(0, y);
        y += Math.round(window.innerHeight * 0.8);
        if (y < document.documentElement.scrollHeight) requestAnimationFrame(step);
        else {
          window.scrollTo(0, 0);
          resolve();
        }
      };
      step();
    });
  });
  /* The scroll above also kicks off CSS background-image requests
     (e.g. the industry-card SVGs); let the network settle before shooting. */
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() =>
    Promise.all(
      Array.from(document.images)
        .filter((i) => !i.complete)
        .map((i) => i.decode().catch(() => undefined)),
    ),
  );
  await page.waitForTimeout(700);
}

for (const route of routes) {
  for (const vp of viewports) {
    test(`${slug(route)} @ ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(route, { waitUntil: "networkidle" });
      await settle(page);
      await expect(page).toHaveScreenshot(`${slug(route)}-${vp.name}.png`, { fullPage: true });
    });
  }
}
