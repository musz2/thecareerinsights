import { hidePanel, lockScroll, reducedMotion, showPanel, staggerIn } from "./motion";
import "./logo";
import "./showcase";

/* ------------------------------------------------------------ Header */
/* Transparent over the hero; frosted, slimmer bar once the page scrolls.
   The class only flips at the threshold, so the scroll handler does no
   layout reads beyond scrollY. */
const header = document.querySelector<HTMLElement>(".site-header");
const backToTop = document.querySelector<HTMLElement>(".back-to-top");
let solid = false;
let topVisible = false;
let scrolled = false;
const onScroll = () => {
  const y = window.scrollY;
  if ((y > 24) !== solid) { solid = !solid; header?.classList.toggle("is-solid", solid); }
  if ((y > 640) !== topVisible) { topVisible = !topVisible; backToTop?.classList.toggle("is-visible", topVisible); }
  if ((y > 420) !== scrolled) { scrolled = !scrolled; document.body.classList.toggle("is-scrolled", scrolled); }
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ------------------------------------------------------------ Mobile menu */
/* Fullscreen overlay that springs in from the right. */
const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
const menu = document.querySelector<HTMLElement>("[data-mobile-menu]");

function setMenu(open: boolean) {
  if (!toggle || !menu) return;
  if ((toggle.getAttribute("aria-expanded") === "true") === open) return;
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  menu.setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("menu-open", open);
  lockScroll(open);
  if (open) {
    showPanel(menu, { x: "100%" });
    staggerIn(menu.querySelectorAll(".m-link, .m-sub a, .mobile-menu .button, .m-foot > *"));
  } else {
    hidePanel(menu, { x: "100%" });
  }
}

toggle?.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
window.matchMedia("(min-width: 768px)").addEventListener("change", (event) => { if (event.matches) setMenu(false); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") setMenu(false); });

/* ------------------------------------------------------------ Dropdown */
/* Opens on hover/focus with a spring scale + fade; on touch, the first tap
   opens and the second navigates. */
document.querySelectorAll<HTMLElement>("[data-dropdown]").forEach((item) => {
  const trigger = item.querySelector<HTMLAnchorElement>("[data-dropdown-trigger]");
  const panel = item.querySelector<HTMLElement>("[data-dropdown-panel]");
  let closeTimer: number | undefined;
  let open = false;
  const set = (next: boolean) => {
    window.clearTimeout(closeTimer);
    if (!panel || next === open) return;
    open = next;
    item.classList.toggle("is-open", open);
    trigger?.setAttribute("aria-expanded", String(open));
    if (open) showPanel(panel, { y: 8, scale: 0.97 });
    else hidePanel(panel, { y: 6, scale: 0.98 });
  };
  item.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") set(true); });
  item.addEventListener("pointerleave", (event) => { if (event.pointerType === "mouse") closeTimer = window.setTimeout(() => set(false), 140); });
  item.addEventListener("focusin", () => set(true));
  item.addEventListener("focusout", (event) => { if (!item.contains(event.relatedTarget as Node)) set(false); });
  trigger?.addEventListener("click", (event) => { if (!open) { event.preventDefault(); set(true); } });
  item.addEventListener("keydown", (event) => { if (event.key === "Escape" && open) { set(false); trigger?.focus(); } });
  document.addEventListener("pointerdown", (event) => { if (open && !item.contains(event.target as Node)) set(false); });
});

/* ------------------------------------------------------------ Hero video */
/* The poster image is the default. The video only loads and plays when the
   visitor hasn't asked for reduced motion or data saving; it plays once and
   stops on its last frame, pauses while off-screen, and can be paused by the
   visitor at any time. */
const heroVideo = document.querySelector<HTMLVideoElement>("[data-hero-video]");
const heroToggle = document.querySelector<HTMLButtonElement>("[data-hero-video-toggle]");
const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
if (heroVideo && !reducedMotion && !saveData) {
  let userPaused = false;
  let inView = true;
  /* Plays once, then holds on its final frame (the closing portrait) */
  let finished = false;
  const sync = () => {
    if (finished) return;
    if (!userPaused && inView && document.visibilityState === "visible") heroVideo.play().catch(() => {});
    else heroVideo.pause();
  };
  heroVideo.addEventListener("ended", () => {
    finished = true;
    heroVideo.pause();
    if (heroToggle) heroToggle.hidden = true;
  }, { once: true });
  heroVideo.addEventListener("playing", () => heroVideo.classList.add("is-playing"), { once: true });
  heroVideo.preload = "auto";
  sync();
  if (heroToggle) {
    heroToggle.hidden = false;
    heroToggle.addEventListener("click", () => {
      userPaused = !userPaused;
      heroToggle.setAttribute("aria-pressed", String(userPaused));
      heroToggle.setAttribute("aria-label", userPaused ? "Play background video" : "Pause background video");
      sync();
    });
  }
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }).observe(heroVideo);
  document.addEventListener("visibilitychange", sync);
}

/* ------------------------------------------------------------ Tabs */
document.querySelectorAll<HTMLElement>("[data-tabs]").forEach((root) => {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>("[role=tab]"));
  const select = (tab: HTMLButtonElement, focus = false) => {
    tabs.forEach((t) => {
      const active = t === tab;
      t.setAttribute("aria-selected", String(active));
      t.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls") || "");
      if (panel) panel.hidden = !active;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (event) => {
      const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      select(tabs[(index + step + tabs.length) % tabs.length], true);
    });
  });
});

/* ------------------------------------------------------------ Contact form */
document.querySelectorAll<HTMLFormElement>("[data-contact-form]").forEach((form) => {
  const status = form.querySelector<HTMLElement>("[data-form-status]");
  const defaultStatus = status?.textContent ?? "";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[required], textarea[required]"));

  const validate = (field: HTMLInputElement | HTMLTextAreaElement): string => {
    const value = field.value.trim();
    const label = field.closest("label")?.querySelector("span")?.textContent?.toLowerCase() ?? "this field";
    if (!value) return `Please enter your ${label}.`;
    if (field.type === "email" && !emailPattern.test(value)) return "Please enter a valid email address.";
    return "";
  };

  const errorEls = new Map<HTMLElement, HTMLElement>();
  fields.forEach((field, i) => {
    const label = field.closest("label");
    if (!label) return;
    const error = document.createElement("span");
    error.className = "field-error";
    error.id = `field-error-${i}`;
    error.setAttribute("aria-live", "polite");
    label.appendChild(error);
    errorEls.set(field, error);
    field.addEventListener("blur", () => setFieldError(field, validate(field)));
    field.addEventListener("input", () => { if (field.getAttribute("aria-invalid") === "true") setFieldError(field, validate(field)); });
  });

  function setFieldError(field: HTMLInputElement | HTMLTextAreaElement, msg: string) {
    field.setAttribute("aria-invalid", msg ? "true" : "false");
    const error = errorEls.get(field);
    if (!error) return;
    error.textContent = msg;
    if (msg) field.setAttribute("aria-describedby", error.id);
    else field.removeAttribute("aria-describedby");
  }

  /* Native POST to FormSubmit; only block it when validation fails. */
  form.addEventListener("submit", (event) => {
    let firstInvalid: HTMLElement | null = null;
    fields.forEach((field) => {
      const msg = validate(field);
      setFieldError(field, msg);
      if (msg && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      event.preventDefault();
      if (status) {
        status.textContent = "Please correct the highlighted fields.";
        status.dataset.state = "error";
      }
      (firstInvalid as HTMLElement).focus();
      return;
    }
    if (status) {
      status.dataset.state = "pending";
      status.textContent = "Sending your request…";
    }
  });

  /* FormSubmit redirects back with ?sent=true */
  if (status && new URLSearchParams(window.location.search).get("sent") === "true") {
    status.dataset.state = "success";
    status.textContent = "Request received — the TCI team will follow up within two business days.";
  }

  form.addEventListener("reset", () => {
    fields.forEach((field) => setFieldError(field, ""));
    if (status) { status.textContent = defaultStatus; delete status.dataset.state; }
  });
});

/* ------------------------------------------------------------ Assistant */
/* Lazy-load on first orb click, or shortly after the page is idle. */
const assistantRoot = document.querySelector<HTMLElement>("[data-assistant]");
if (assistantRoot) {
  const orb = assistantRoot.querySelector<HTMLButtonElement>("[data-assistant-orb]");
  let ready: Promise<void> | null = null;
  const loadAssistant = () => (ready ??= import("./ai-assistant").then(({ initAssistant }) => initAssistant()));
  /* A click that lands before (or while) the module loads would otherwise be
     lost; replay it once the assistant has bound its own handler. */
  const onEarlyClick = (event: Event) => {
    event.stopImmediatePropagation();
    orb?.removeEventListener("click", onEarlyClick);
    loadAssistant().then(() => orb?.click());
  };
  orb?.addEventListener("click", onEarlyClick);
  const preload = () => loadAssistant().then(() => orb?.removeEventListener("click", onEarlyClick));
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
  if (idle) idle(preload, { timeout: 1500 });
  else window.setTimeout(preload, 1500);
}
