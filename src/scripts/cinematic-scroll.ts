/**
 * Cinematic scroll system: Lenis smooth scroll, pinned hero, text mask
 * reveals, horizontal pinned capabilities, stacked accordion, impact
 * dashboard counters/rings/graph, and the chapter progress indicator.
 * Everything is gated on prefers-reduced-motion and degrades to static
 * content. All triggers, tickers, and listeners are cleaned up on pagehide.
 */
import { gsap, ScrollTrigger } from "./gsap-setup";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const cleanups: Array<() => void> = [];

/* ---------- Chapter progress indicator (works for all motion modes) ---------- */
function initChapterProgress() {
  const root = document.querySelector<HTMLElement>("[data-chapter-progress]");
  if (!root) return;
  const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
  if (sections.length < 2) {
    root.remove();
    return;
  }

  const label = root.querySelector<HTMLElement>("[data-chapter-label]");
  const bar = root.querySelector<HTMLElement>("[data-chapter-bar]");
  const dotsWrap = root.querySelector<HTMLElement>("[data-chapter-dots]");
  const dots: HTMLButtonElement[] = [];

  sections.forEach((section) => {
    const name = section.getAttribute("data-chapter") ?? "Chapter";
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "chapter-dot";
    dot.setAttribute("aria-label", `Go to ${name}`);
    dot.addEventListener("click", () => section.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" }));
    dotsWrap?.appendChild(dot);
    dots.push(dot);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const index = sections.indexOf(entry.target as HTMLElement);
        if (index === -1) continue;
        if (label) label.textContent = `• ${sections[index].getAttribute("data-chapter")}`;
        dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
      }
    },
    { rootMargin: "-45% 0px -45% 0px" }
  );
  sections.forEach((s) => observer.observe(s));

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      if (bar) bar.style.transform = `scaleY(${Math.min(window.scrollY / max, 1)})`;
      root.classList.toggle("is-visible", window.scrollY > 140);
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  cleanups.push(() => {
    observer.disconnect();
    window.removeEventListener("scroll", onScroll);
  });
}

/* ---------- Stacked accordion (interaction works without motion too) ---------- */
function initAccordion() {
  document.querySelectorAll<HTMLElement>("[data-accordion]").forEach((accordion) => {
    const items = Array.from(accordion.querySelectorAll<HTMLElement>("[data-accordion-item]"));
    const set = (item: HTMLElement, open: boolean, instant = false) => {
      const button = item.querySelector<HTMLButtonElement>("[data-accordion-toggle]");
      const panel = item.querySelector<HTMLElement>("[data-accordion-panel]");
      if (!button || !panel) return;
      button.setAttribute("aria-expanded", String(open));
      item.classList.toggle("is-open", open);
      if (reducedMotion || instant) {
        gsap.set(panel, { height: open ? "auto" : 0 });
        return;
      }
      gsap.to(panel, { height: open ? "auto" : 0, duration: 0.28, ease: "power3.inOut" });
    };
    items.forEach((item, index) => {
      const button = item.querySelector<HTMLButtonElement>("[data-accordion-toggle]");
      button?.addEventListener("click", () => {
        const isOpen = item.classList.contains("is-open");
        items.forEach((other) => set(other, false));
        if (!isOpen) set(item, true);
      });
      set(item, index === 0, true);
    });
  });
}

/* ---------- Impact dashboard: counters, rings, graph ---------- */
function initImpactDashboard() {
  const dash = document.querySelector<HTMLElement>("[data-impact-dashboard]");
  if (!dash) return;

  const run = () => {
    dash.classList.add("is-live");
    dash.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
      const target = Number(el.dataset.count ?? "0");
      const decimals = Number(el.dataset.decimals ?? "0");
      const suffix = el.dataset.suffix ?? "";
      if (reducedMotion) {
        el.textContent = `${target.toFixed(decimals)}${suffix}`;
        return;
      }
      const state = { v: 0 };
      gsap.to(state, {
        v: target,
        duration: 1.05,
        ease: "power2.out",
        onUpdate: () => { el.textContent = `${state.v.toFixed(decimals)}${suffix}`; }
      });
    });
    dash.querySelectorAll<SVGCircleElement>("[data-ring]").forEach((ring) => {
      const pct = Number(ring.dataset.ring ?? "0");
      const c = 2 * Math.PI * Number(ring.getAttribute("r") ?? 42);
      ring.style.strokeDasharray = `${c}`;
      if (reducedMotion) {
        ring.style.strokeDashoffset = `${c * (1 - pct / 100)}`;
        return;
      }
      gsap.fromTo(ring, { strokeDashoffset: c }, { strokeDashoffset: c * (1 - pct / 100), duration: 1.05, ease: "power2.out" });
    });
    const path = dash.querySelector<SVGPathElement>("[data-graph-line]");
    if (path) {
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      if (reducedMotion) path.style.strokeDashoffset = "0";
      else gsap.fromTo(path, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.15, ease: "power2.inOut" });
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        run();
        observer.disconnect();
      }
    },
    { threshold: 0.3 }
  );
  observer.observe(dash);
  cleanups.push(() => observer.disconnect());
}

/* ---------- Motion-only systems ---------- */
async function initMotion() {
  if (reducedMotion) return;

  /* Lenis smooth scroll, driven by the GSAP ticker */
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine) {
    try {
      const { default: Lenis } = await import("lenis");
      const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1.0, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      cleanups.push(() => {
        gsap.ticker.remove(tick);
        lenis.destroy();
      });
    } catch { /* Lenis is an enhancement only */ }
  }

  const mm = gsap.matchMedia();
  cleanups.push(() => mm.revert());

  /* Text mask reveals: split into word masks */
  document.querySelectorAll<HTMLElement>("[data-mask-reveal]").forEach((el) => {
    if (el.dataset.maskDone) return;
    el.dataset.maskDone = "1";
    const split = (node: ChildNode): Node[] => {
      if (node.nodeType === Node.TEXT_NODE) {
        return (node.textContent ?? "").split(/(\s+)/).map((part) => {
          if (!part.trim()) return document.createTextNode(part);
          const mask = document.createElement("span");
          mask.className = "mask-word";
          const inner = document.createElement("span");
          inner.className = "mask-word-inner";
          inner.textContent = part;
          mask.appendChild(inner);
          return mask;
        });
      }
      return [node.cloneNode(true)];
    };
    const out: Node[] = [];
    el.childNodes.forEach((n) => out.push(...split(n)));
    el.replaceChildren(...out);
    const words = el.querySelectorAll(".mask-word-inner");
    gsap.fromTo(words, { yPercent: 112 }, {
      yPercent: 0,
      duration: 0.52,
      stagger: 0.018,
      ease: "power4.out",
      scrollTrigger: { trigger: el, start: "top 92%", once: true }
    });
  });

  mm.add("(min-width: 821px)", () => {
    /* Pinned cinematic hero: copy drifts and dims as the next chapter arrives */
    const hero = document.querySelector<HTMLElement>("[data-hero-pin]");
    if (hero) {
      const copy = hero.querySelector(".home-hero-copy");
      const metrics = hero.querySelector(".hero-metrics");
      gsap.timeline({
        scrollTrigger: { trigger: hero, start: "top top", end: "+=58%", scrub: 0.25, pin: true, pinSpacing: true, anticipatePin: 1 }
      })
        .to(copy, { yPercent: -14, opacity: 0.18, scale: 0.965, ease: "none" }, 0)
        .to(metrics, { opacity: 0, y: 30, ease: "none" }, 0)
        .to(hero, { "--hero-dim": 0.55, ease: "none" } as gsap.TweenVars, 0);
    }

    /* Horizontal pinned capabilities */
    document.querySelectorAll<HTMLElement>("[data-horizontal]").forEach((section) => {
      const track = section.querySelector<HTMLElement>("[data-horizontal-track]");
      if (!track) return;
      const distance = () => track.scrollWidth - section.clientWidth;
      if (distance() < 60) return;
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          scrub: 0.25,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
      track.querySelectorAll<HTMLElement>(".capability-panel").forEach((panel) => {
        gsap.fromTo(panel.querySelector(".capability-panel-inner"), { y: 36, opacity: 0.4 }, {
          y: 0, opacity: 1, ease: "none",
          scrollTrigger: { trigger: panel, containerAnimation: undefined, start: "top 80%" }
        });
      });
    });

    /* Camera-like drift per chapter */
    document.querySelectorAll<HTMLElement>("[data-chapter]:not([data-hero-pin])").forEach((scene) => {
      gsap.fromTo(scene, { "--scene-light": 0 } as gsap.TweenVars, {
        "--scene-light": 1,
        ease: "none",
        scrollTrigger: { trigger: scene, start: "top 80%", end: "center center", scrub: 0.25 }
      } as gsap.TweenVars);
    });
  });

  /* Floating analytics panels */
  document.querySelectorAll<HTMLElement>("[data-float]").forEach((el, i) => {
    gsap.to(el, { y: -12 - (i % 3) * 4, duration: 2.6 + (i % 3) * 0.7, yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * 0.3 });
  });

  /* Natural growth capability section: scroll-built cards and moving signal layer */
  document.querySelectorAll<HTMLElement>("[data-tci-growth]").forEach((section) => {
    const cards = Array.from(section.querySelectorAll<HTMLElement>("[data-growth-card]"));
    const orbit = section.querySelector<HTMLElement>(".tci-growth-motion");
    const accent = section.querySelector<HTMLElement>(".tci-growth-accent");

    if (cards.length) {
      gsap.fromTo(cards,
        { y: 44, opacity: 0, rotateX: 3 },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.68,
          stagger: 0.075,
          ease: "power3.out",
          scrollTrigger: { trigger: section, start: "top 78%", once: true }
        }
      );

      cards.forEach((card, index) => {
        const body = card.querySelector<HTMLElement>(".tci-growth-card-body");
        if (!body) return;
        gsap.to(body, {
          y: index % 2 === 0 ? -16 : 16,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.35 }
        });
      });
    }

    if (orbit) {
      gsap.fromTo(orbit,
        { y: 28, rotate: -3, opacity: 0.45 },
        { y: -42, rotate: 5, opacity: 0.9, ease: "none", scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.35 } }
      );
    }

    if (accent) {
      gsap.fromTo(accent,
        { scaleX: 0.18 },
        { scaleX: 1, transformOrigin: "left center", ease: "none", scrollTrigger: { trigger: section, start: "top 86%", end: "center center", scrub: 0.25 } }
      );
    }
  });

  /* Premium home hero motion: clear image, subtle camera drift, no dimming. */
  const premiumHero = document.querySelector<HTMLElement>("[data-premium-home-hero]");
  if (premiumHero) {
    const heroImage = premiumHero.querySelector<HTMLElement>(".hero-photo img");
    const heroCopy = premiumHero.querySelector<HTMLElement>(".home-hero-copy");
    const heroMetrics = premiumHero.querySelector<HTMLElement>(".hero-metrics");

    if (heroImage) {
      gsap.fromTo(heroImage,
        { scale: 1.04, yPercent: -1.6 },
        { scale: 1.13, yPercent: 5.5, ease: "none", scrollTrigger: { trigger: premiumHero, start: "top top", end: "bottom top", scrub: 0.45 } }
      );
    }

    if (heroCopy) {
      gsap.fromTo(heroCopy,
        { y: 0, opacity: 1 },
        { y: -46, opacity: 0.94, ease: "none", scrollTrigger: { trigger: premiumHero, start: "top top", end: "bottom top", scrub: 0.35 } }
      );
    }

    if (heroMetrics) {
      gsap.fromTo(heroMetrics,
        { y: 0 },
        { y: 18, ease: "none", scrollTrigger: { trigger: premiumHero, start: "top top", end: "bottom top", scrub: 0.35 } }
      );
    }
  }

  /* Floating trust badge parallax — regular trust section only, never the footer logo. */
  const badge = document.querySelector<HTMLElement>(".trust-section [data-trust-badge]");
  if (badge) {
    gsap.fromTo(badge, { y: 38, rotate: -1.2 }, {
      y: -38, rotate: 1.2, ease: "none",
      scrollTrigger: { trigger: badge.closest("section"), start: "top bottom", end: "bottom top", scrub: 0.35 }
    });
  }

  /* Footer light sweep */
  const footer = document.querySelector<HTMLElement>("[data-cinematic-footer]");
  if (footer) {
    ScrollTrigger.create({
      trigger: footer,
      start: "top 88%",
      once: true,
      onEnter: () => footer.classList.add("is-lit")
    });
  }
}

initChapterProgress();
initAccordion();
initImpactDashboard();
initMotion();

window.addEventListener("pagehide", () => {
  cleanups.splice(0).forEach((fn) => fn());
}, { once: true });
