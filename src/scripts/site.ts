import { gsap, ScrollTrigger } from "./gsap-setup";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

const cleanupTasks: Array<() => void> = [];
const on = <K extends keyof WindowEventMap>(target: Window, type: K, listener: (event: WindowEventMap[K]) => void, options?: AddEventListenerOptions) => {
  target.addEventListener(type, listener, options);
  cleanupTasks.push(() => target.removeEventListener(type, listener, options));
};

const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
const drawer = document.querySelector<HTMLElement>("[data-mobile-menu]");
const mobileLinks = drawer ? Array.from(drawer.querySelectorAll<HTMLAnchorElement>("a")) : [];
let menuTimeline: gsap.core.Timeline | null = null;

function setMenu(open: boolean) {
  if (!toggle || !drawer) return;
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  drawer.setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("menu-open", open);

  if (!reducedMotion) {
    menuTimeline?.kill();
    menuTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    if (open) {
      menuTimeline
        .set(drawer, { pointerEvents: "auto" })
        .to(drawer, { autoAlpha: 1, y: 0, duration: 0.24 })
        .fromTo(mobileLinks, { y: 28, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.025, duration: 0.30 }, "-=0.18");
    } else {
      menuTimeline.to(drawer, { autoAlpha: 0, y: -12, duration: 0.16 }).set(drawer, { pointerEvents: "none" });
    }
  }
}

toggle?.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
mobileLinks.forEach((link) => link.addEventListener("click", () => setMenu(false)));
on(window, "keydown", (event) => { if (event.key === "Escape") { setMenu(false); setMegaMenu(false); } });

const megaTrigger = document.querySelector<HTMLElement>("[data-mega-trigger]");
const megaMenu = document.querySelector<HTMLElement>("[data-mega-menu]");
let megaCloseTimer: number | undefined;
let megaTimeline: gsap.core.Timeline | null = null;

function setMegaMenu(open: boolean) {
  if (!megaTrigger || !megaMenu) return;
  window.clearTimeout(megaCloseTimer);
  megaTrigger.setAttribute("aria-expanded", String(open));
  megaMenu.setAttribute("aria-hidden", String(!open));
  if (reducedMotion) return;
  megaTimeline?.kill();
  megaTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
  if (open) {
    megaTimeline
      .set(megaMenu, { pointerEvents: "auto", autoAlpha: 1 })
      .fromTo(megaMenu, { y: -12, scale: 0.985, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.22 })
      .fromTo(megaMenu.querySelectorAll(".mega-column li"), { y: 8, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.012, duration: 0.18 }, "-=0.10");
  } else {
    megaTimeline.to(megaMenu, { y: -10, scale: 0.985, autoAlpha: 0, duration: 0.15 }).set(megaMenu, { pointerEvents: "none" });
  }
}

function scheduleMegaClose() {
  megaCloseTimer = window.setTimeout(() => setMegaMenu(false), 120);
}

if (megaTrigger && megaMenu) {
  /* The mega dropdown is desktop-only (hidden under 860px). On mobile the
     nav links are shown inline, so let "Solutions" navigate to /solutions
     instead of intercepting the tap to open a hidden dropdown. */
  const megaEnabled = () => window.matchMedia("(min-width: 861px)").matches;
  megaTrigger.addEventListener("pointerenter", () => { if (megaEnabled()) setMegaMenu(true); });
  megaTrigger.addEventListener("focus", () => { if (megaEnabled()) setMegaMenu(true); });
  megaTrigger.addEventListener("click", (event) => {
    if (!megaEnabled()) return;
    event.preventDefault();
    setMegaMenu(megaMenu.getAttribute("aria-hidden") === "true");
  });
  megaTrigger.addEventListener("pointerleave", scheduleMegaClose);
  megaMenu.addEventListener("pointerenter", () => window.clearTimeout(megaCloseTimer));
  megaMenu.addEventListener("pointerleave", scheduleMegaClose);
  megaMenu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMegaMenu(false)));
  on(window, "click", (event) => {
    const target = event.target as Node;
    if (!megaMenu.contains(target) && !megaTrigger.contains(target)) setMegaMenu(false);
  });
}


function initTciAnimatedLogos() {
  const stages = Array.from(document.querySelectorAll<HTMLElement>("[data-tci-logo-stage]"));
  if (!stages.length) return;

  stages.forEach((stage) => {
    if (stage.dataset.tciLogoReady === "true") return;
    stage.dataset.tciLogoReady = "true";

    const tilt = stage.querySelector<HTMLElement>("[data-tci-logo-tilt]");
    const spec = stage.querySelector<SVGCircleElement>("[data-tci-logo-spec]");
    const canvas = stage.querySelector<HTMLCanvasElement>("[data-tci-logo-dust]");

    if (!reducedMotion && finePointer && tilt) {
      stage.addEventListener("pointermove", (event) => {
        const rect = stage.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = (event.clientY - rect.top) / rect.height;
        const maxTilt = parseFloat(getComputedStyle(stage).getPropertyValue("--tilt")) || 8;
        tilt.style.setProperty("--ry", `${((nx - 0.5) * maxTilt).toFixed(2)}deg`);
        tilt.style.setProperty("--rx", `${((0.5 - ny) * maxTilt).toFixed(2)}deg`);
        if (spec) {
          spec.setAttribute("cx", (nx * 440).toFixed(1));
          spec.setAttribute("cy", (ny * 300).toFixed(1));
        }
      }, { passive: true });
      stage.addEventListener("pointerleave", () => {
        tilt.style.setProperty("--rx", "0deg");
        tilt.style.setProperty("--ry", "0deg");
      }, { passive: true });
    }

    if (!canvas || reducedMotion) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const particles: Array<{ x: number; y: number; vx: number; vy: number; r: number; a: number; red: boolean; tw: number; ph: number; }> = [];

    const sizeCanvas = () => {
      const rect = stage.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seedParticles = () => {
      particles.length = 0;
      for (let i = 0; i < 14; i += 1) {
        particles.push({
          x: 0.10 + Math.random() * 0.80,
          y: 0.10 + Math.random() * 0.62,
          vx: (Math.random() - 0.5) * 0.012,
          vy: (Math.random() - 0.5) * 0.012,
          r: 0.8 + Math.random() * 1.8,
          a: 0.04 + Math.random() * 0.09,
          red: Math.random() < 0.25,
          tw: 0.6 + Math.random() * 1.2,
          ph: Math.random() * 6.2832
        });
      }
    };

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(sizeCanvas);
      observer.observe(stage);
    }
    sizeCanvas();
    seedParticles();

    const start = performance.now();
    const draw = (now: number) => {
      if (!stage.isConnected) return;
      const t = (now - start) / 1000;
      context.clearRect(0, 0, width, height);
      particles.forEach((particle) => {
        particle.x += particle.vx * 0.016;
        particle.y += particle.vy * 0.016;
        if (particle.x < 0.08 || particle.x > 0.92) particle.vx *= -1;
        if (particle.y < 0.07 || particle.y > 0.74) particle.vy *= -1;
        const twinkle = 0.5 + 0.5 * Math.sin(t * particle.tw + particle.ph);
        const x = particle.x * width;
        const y = particle.y * height;
        const gradient = context.createRadialGradient(x, y, 0, x, y, particle.r * 4);
        const color = particle.red ? "209,33,46" : "120,128,140";
        gradient.addColorStop(0, `rgba(${color},${(particle.a * twinkle).toFixed(3)})`);
        gradient.addColorStop(1, `rgba(${color},0)`);
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, particle.r * 4, 0, Math.PI * 2);
        context.fill();
      });
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  });
}
initTciAnimatedLogos();

const loader = document.querySelector<HTMLElement>("[data-site-loader]");
if (loader) {
  if (reducedMotion) loader.remove();
  else {
    const loaderLogo = loader.querySelector(".tci-logo-stage, .tci-logo-next, .tci-logo-new__svg, .tci-logo-mark");
    const timeline = gsap.timeline({ onComplete: () => loader.remove() });
    if (loaderLogo) {
      timeline.fromTo(loaderLogo, { scale: 0.97, opacity: 0.82 }, { scale: 1, opacity: 1, duration: 0.32, ease: "power3.out" });
    }
    timeline.to(loader, { yPercent: -100, duration: 0.34, ease: "power3.inOut" }, "+=0.4");
  }
}

const header = document.querySelector<HTMLElement>("[data-header]");
const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 20);
on(window, "scroll", updateHeader, { passive: true });
updateHeader();

if (!reducedMotion) {
  gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
    gsap.from(element, { y: 40, opacity: 0, duration: 0.68, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 84%", once: true } });
  });

  gsap.utils.toArray<HTMLElement>("[data-cinematic-scene]").forEach((scene) => {
    gsap.fromTo(scene, { filter: "saturate(0.92)", transformPerspective: 1200 }, { filter: "saturate(1.05)", ease: "none", scrollTrigger: { trigger: scene, start: "top bottom", end: "bottom top", scrub: 0.25 } });
  });

  gsap.utils.toArray<HTMLElement>("[data-parallax-image]").forEach((container) => {
    const image = container.querySelector("img");
    if (!image) return;
    gsap.fromTo(image, { yPercent: -5, scale: 1.04 }, { yPercent: 5, scale: 1.08, ease: "none", scrollTrigger: { trigger: container, start: "top bottom", end: "bottom top", scrub: 0.35 } });
  });

  gsap.utils.toArray<HTMLElement>(".service-columns, .expertise-grid, .industries-grid, .mosaic-grid").forEach((grid) => {
    gsap.from(grid.children, { y: 20, opacity: 0, duration: 0.42, stagger: 0.03, ease: "power3.out", scrollTrigger: { trigger: grid, start: "top 90%", once: true } });
  });
}

if (!reducedMotion && finePointer) {
  const pointer = { x: 0, y: 0 };
  on(window, "pointermove", (event) => {
    pointer.x = event.clientX / window.innerWidth - 0.5;
    pointer.y = event.clientY / window.innerHeight - 0.5;
    document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
    document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
  }, { passive: true });

  document.querySelectorAll<HTMLElement>(".mosaic-card, .expertise-grid a, .feature-grid article, .core-grid article, .industry-strip a").forEach((el) => {
    const moveX = gsap.quickTo(el, "x", { duration: 0.22, ease: "power3.out" });
    const moveY = gsap.quickTo(el, "y", { duration: 0.22, ease: "power3.out" });
    const rotateX = gsap.quickTo(el, "rotateX", { duration: 0.26, ease: "power3.out" });
    const rotateY = gsap.quickTo(el, "rotateY", { duration: 0.26, ease: "power3.out" });
    el.addEventListener("pointermove", (event) => {
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      moveX(x * 10); moveY(y * 8); rotateX(y * -5); rotateY(x * 5);
      el.style.setProperty("--card-x", `${(x + 0.5) * 100}%`);
      el.style.setProperty("--card-y", `${(y + 0.5) * 100}%`);
    }, { passive: true });
    el.addEventListener("pointerleave", () => { moveX(0); moveY(0); rotateX(0); rotateY(0); }, { passive: true });
  });
}

const backToTop = document.querySelector<HTMLElement>(".back-to-top");
const updateBackToTop = () => backToTop?.classList.toggle("is-visible", window.scrollY > 650);
on(window, "scroll", updateBackToTop, { passive: true });
updateBackToTop();

document.querySelectorAll<HTMLFormElement>("[data-contact-form]").forEach((form) => {
  const status = form.querySelector<HTMLElement>("[data-form-status]");
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const defaultStatus = status?.textContent ?? "";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* Field-level validation: each required control gets its own inline error
     message, an aria-invalid flag, and an id-linked alert for screen readers. */
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

    const showError = (msg: string) => {
      field.setAttribute("aria-invalid", msg ? "true" : "false");
      error.textContent = msg;
      if (msg) field.setAttribute("aria-describedby", error.id);
      else field.removeAttribute("aria-describedby");
    };
    field.addEventListener("blur", () => showError(validate(field)));
    field.addEventListener("input", () => { if (field.getAttribute("aria-invalid") === "true") showError(validate(field)); });
  });

  const setFieldError = (field: HTMLInputElement | HTMLTextAreaElement, msg: string) => {
    field.setAttribute("aria-invalid", msg ? "true" : "false");
    const error = errorEls.get(field);
    if (error) error.textContent = msg;
  };

  /* WhatsApp business line — digits only for the wa.me deep link. */
  const WHATSAPP_NUMBER = "13024992545";

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!status || !button) return;

    form.classList.remove("is-sent", "is-error");
    let firstInvalid: HTMLElement | null = null;
    fields.forEach((field) => {
      const msg = validate(field);
      setFieldError(field, msg);
      if (msg && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      status.textContent = "Please correct the highlighted fields above.";
      status.dataset.state = "error";
      (firstInvalid as HTMLElement).focus();
      return;
    }

    /* Build a clean, pre-filled WhatsApp message from the form fields. */
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const interest = String(data.get("interest") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    const lines = [
      "New enquiry from The Career Insights website",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Service: ${interest}`,
      "",
      "Requirement:",
      message,
    ];
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;

    status.dataset.state = "pending";
    status.textContent = "Opening WhatsApp to send your request...";

    /* Opened synchronously within the user gesture so mobile/desktop browsers
       (including iOS Safari) don't block it as a popup. */
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      /* Popup blocked — fall back to navigating the current tab. */
      window.location.href = url;
    }

    form.classList.add("is-sent");
    status.dataset.state = "success";
    status.textContent = "Opening WhatsApp to send your request...";
  });

  form.addEventListener("reset", () => {
    fields.forEach((field) => setFieldError(field, ""));
    if (status) { status.textContent = defaultStatus; delete status.dataset.state; }
    form.classList.remove("is-sent", "is-error");
  });
});

/* ------------------------------------------------------------------ */
/* Cinematic systems bootstrap                                          */
/* WebGL was retired in favor of a lightweight brand "talent network"   */
/* canvas (ambient-background.ts). Heavy features are lazy-loaded and   */
/* individually guarded for reduced motion / coarse pointers.           */
/* ------------------------------------------------------------------ */
async function bootCinematicSystems() {
  /* Scroll system loads everywhere: it self-gates motion and still
     powers the accordion, dashboard values, and chapter indicator. */
  import("./cinematic-scroll");

  if (!reducedMotion && !coarsePointer) {
    const { initAmbientBackground } = await import("./ambient-background");
    initAmbientBackground();
  } else {
    document.querySelector("[data-ambient-stage]")?.remove();
  }

  if (!reducedMotion && finePointer) {
    const { initPremiumCursor } = await import("./premium-cursor");
    initPremiumCursor();
  } else {
    document.querySelector("[data-premium-cursor]")?.remove();
  }
}
bootCinematicSystems();
window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });

/* Assistant: lazy-load on first orb interaction, or shortly after idle */
const assistantRoot = document.querySelector<HTMLElement>("[data-assistant]");
if (assistantRoot) {
  let assistantLoaded = false;
  const loadAssistant = async (openAfter = false) => {
    if (assistantLoaded) return;
    assistantLoaded = true;
    const { initAssistant } = await import("./ai-assistant");
    initAssistant();
    if (openAfter) assistantRoot.querySelector<HTMLButtonElement>("[data-assistant-orb]")?.click();
  };
  const orb = assistantRoot.querySelector<HTMLButtonElement>("[data-assistant-orb]");
  orb?.addEventListener("click", () => loadAssistant(true), { once: true });
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
  if (idle) idle(() => loadAssistant(), { timeout: 900 });
  else window.setTimeout(() => loadAssistant(), 900);
}


/* Final smooth scroll-transform layer: guarded, lightweight, no pinning on mobile. */
/* NOTE: Hero parallax (image + copy) lives exclusively in cinematic-scroll.ts,
   where Lenis and ScrollTrigger are managed together. Registering it here too
   put two competing ScrollTriggers on the same elements — removed to fix jank. */
if (!reducedMotion) {
  gsap.utils.toArray<HTMLElement>(".industry-visual-card").forEach((card, index) => {
    gsap.fromTo(card,
      { y: 36, opacity: 0, scale: 0.985 },
      { y: 0, opacity: 1, scale: 1, duration: 0.62, delay: index * 0.025, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 92%", once: true } }
    );
    if (finePointer) {
      gsap.to(card, {
        yPercent: index % 2 ? -5 : 5,
        ease: "none",
        scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: 0.7 }
      });
    }
  });

  const whoMotion = document.querySelector<HTMLElement>("[data-who-motion]");
  if (whoMotion) {
    gsap.fromTo(whoMotion,
      { y: 28, opacity: 0, rotateX: 4 },
      { y: 0, opacity: 1, rotateX: 0, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: whoMotion, start: "top 88%", once: true } }
    );
    gsap.to(whoMotion.querySelectorAll(".who-node"), {
      y: (i) => i % 2 ? -10 : 10,
      ease: "none",
      scrollTrigger: { trigger: whoMotion, start: "top bottom", end: "bottom top", scrub: 0.7 }
    });
  }

  gsap.utils.toArray<HTMLElement>(".data-card").forEach((card) => {
    card.addEventListener("focus", () => card.closest<HTMLElement>(".data-intelligence-showcase")?.classList.add("is-paused"));
    card.addEventListener("blur", () => card.closest<HTMLElement>(".data-intelligence-showcase")?.classList.remove("is-paused"));
  });
}


on(window, "pagehide", () => { cleanupTasks.splice(0).forEach((task) => task()); ScrollTrigger.killAll(); }, { once: true });
