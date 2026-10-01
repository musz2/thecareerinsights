/* Logo intro + page transitions.

   - Homepage entry: the full logo animation plays, then the page is revealed.
   - Internal link click: the overlay fades in over the current page, the
     browser navigates, and the next page opens with the overlay already up
     (flagged via sessionStorage by the head script); a quicker run of the
     same logo animation plays, then that page is revealed.

   `revealed` resolves the moment the reveal starts, so entrance animations
   and scroll reveals play as the page appears rather than under the overlay.
   Reduced motion: no overlay at all. */
const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const loader = document.querySelector<HTMLElement>("[data-page-loader]");

export const loaderActive = root.classList.contains("loader-on") && Boolean(loader);

let resolveReveal: () => void = () => {};
export const revealed = new Promise<void>((resolve) => { resolveReveal = resolve; });

const clearLoader = () => root.classList.remove("loader-on", "loader-out", "loader-full", "loader-quick", "loader-in");

if (!loaderActive || !loader) {
  resolveReveal();
} else {
  const quick = root.classList.contains("loader-quick");
  let done = false;
  const reveal = () => {
    if (done) return;
    done = true;
    root.classList.add("loader-out");
    resolveReveal();
    /* Matches the longest exit transition in CSS (blur layer: .35s + 1s) */
    window.setTimeout(clearLoader, 1450);
  };
  /* The wordmark is the last part of the logo to finish — wait for it, then
     hold the completed logo for a beat before revealing. */
  const lastPart = loader.querySelector(".tci-word");
  lastPart?.addEventListener("animationend", () => window.setTimeout(reveal, quick ? 120 : 320), { once: true });
  /* Safety net in case animationend never fires */
  window.setTimeout(reveal, quick ? 2400 : 3800);
}

/* Internal navigation: cover the page, then go. */
if (!reducedMotion && loader) {
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
    if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download") || "noTransition" in link.dataset) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol)) return;
    /* Same page (incl. hash links) scrolls instead of transitioning */
    if (url.pathname === window.location.pathname && url.search === window.location.search) return;

    event.preventDefault();
    try { sessionStorage.setItem("tci-nav", "1"); } catch { /* storage blocked: next page simply skips the intro */ }
    root.classList.remove("loader-out");
    root.classList.add("loader-in");
    window.setTimeout(() => window.location.assign(url.href), 440);
  });

  /* Back/forward cache restores the page as it was left — with the overlay up */
  window.addEventListener("pageshow", (event) => { if (event.persisted) clearLoader(); });
}
