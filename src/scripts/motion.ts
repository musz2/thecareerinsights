import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { animate, hover, press } from "motion";
import { loaderActive, revealed } from "./loader";

gsap.registerPlugin(ScrollTrigger, SplitText);

export const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* Shared springs — stiff and well damped so nothing wobbles. */
export const spring = { type: "spring", stiffness: 420, damping: 32, mass: 0.9 } as const;
export const springSoft = { type: "spring", stiffness: 280, damping: 28 } as const;
const quickOut = { duration: 0.18, ease: [0.4, 0, 1, 1] } as const;

/* ------------------------------------------------------------ Smooth scroll */
/* Lenis keeps native scrolling (sticky, find-in-page and anchors keep
   working) and drives ScrollTrigger from GSAP's single ticker. Touch devices
   keep their native momentum scrolling. */
export let lenis: Lenis | null = null;

if (!reducedMotion) {
  const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 76;
  lenis = new Lenis({ lerp: 0.1, anchors: { offset: -(headerH + 16) } });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  /* Hold the page still while the logo overlay is up */
  if (loaderActive) {
    lenis.stop();
    revealed.then(() => lenis?.start());
  }
}

/* ------------------------------------------------------------ Scroll scenes */
const mm = gsap.matchMedia();

mm.add("(prefers-reduced-motion: no-preference)", () => {
  /* Hero: copy fades up on load; background drifts slower than the page. */
  const hero = document.querySelector<HTMLElement>(".hero");
  if (hero) {
    /* Starts as the logo overlay lifts (immediately when there is none) */
    revealed.then(() => gsap.from(hero.querySelectorAll(".hero-copy > *"), { y: 28, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, delay: loaderActive ? 0.25 : 0.1 }));
    gsap.to(hero.querySelector(".hero-media"), {
      yPercent: 12,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
    });
  }

  /* Hero copy drifts up and fades as the hero scrolls away */
  if (hero) {
    gsap.to(hero.querySelector(".hero-copy"), {
      yPercent: -14,
      autoAlpha: 0.15,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
    });
  }

  document.querySelectorAll<HTMLElement>(".page-hero").forEach((section) => {
    revealed.then(() => gsap.from(section.querySelectorAll(".shell > *"), { y: 24, autoAlpha: 0, duration: 0.8, ease: "power3.out", stagger: 0.07, delay: loaderActive ? 0.25 : 0.05 }));
    gsap.to(section.querySelector(".page-hero-media"), {
      yPercent: 12,
      ease: "none",
      scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true }
    });
  });

  /* Parallax: photos drift inside their frames while the page scrolls */
  gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((frame) => {
    gsap.fromTo(frame.querySelector("img"), { yPercent: -6 }, {
      yPercent: 6,
      ease: "none",
      scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  /* Industry photos: a custom property feeds the CSS `translate` property, so
     the drift composes with the hover zoom (which uses `transform`). */
  gsap.utils.toArray<HTMLElement>(".industry-media").forEach((media) => {
    gsap.fromTo(media.querySelector("img"), { "--py": "-5%" }, {
      "--py": "5%",
      ease: "none",
      scrollTrigger: { trigger: media, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  revealed.then(() => {
    /* Section headings rise line by line out of a mask */
    gsap.utils.toArray<HTMLElement>(".section-heading h2, .split-copy h2, .service-head h2, .trust-head h2, .partner-head h2").forEach((heading) => {
      SplitText.create(heading, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, {
          yPercent: 105,
          duration: 0.9,
          ease: "power4.out",
          stagger: 0.08,
          scrollTrigger: { trigger: heading, start: "top 90%", once: true }
        })
      });
    });
  });

  /* Footer wordmark rises gently into place as the footer arrives */
  const wordmark = document.querySelector(".footer-wordmark span");
  if (wordmark) {
    gsap.fromTo(wordmark, { yPercent: 18, autoAlpha: 0.3 }, {
      yPercent: 0,
      autoAlpha: 1,
      ease: "none",
      scrollTrigger: { trigger: ".site-footer", start: "top bottom", end: "bottom bottom", scrub: true }
    });
  }

  /* Partner rails: two endless loops — the top runs left → right, the bottom
     right → left. Scroll velocity briefly speeds both up; hovering the rails
     eases them to a stop; off-screen they pause. */
  const rail = document.querySelector<HTMLElement>("[data-partner-rail]");
  if (rail) {
    const loops = gsap.utils.toArray<HTMLElement>("[data-partner-track]", rail).map((track) => {
      const originals = Array.from(track.children).filter((li) => !li.hasAttribute("aria-hidden"));
      const setWidth = track.scrollWidth / 2;
      /* Repeat the set until each half is wider than the viewport */
      const repeats = Math.max(1, Math.ceil((window.innerWidth + 200) / Math.max(setWidth, 1)));
      track.replaceChildren();
      for (let half = 0; half < 2; half++) {
        for (let r = 0; r < repeats; r++) {
          originals.forEach((li) => {
            const clone = li.cloneNode(true) as HTMLElement;
            if (half > 0 || r > 0) {
              clone.setAttribute("aria-hidden", "true");
              clone.querySelector("img")?.setAttribute("alt", "");
            }
            track.append(clone);
          });
        }
      }
      const ltr = track.dataset.direction !== "rtl";
      return gsap.fromTo(track, { xPercent: ltr ? -50 : 0 }, {
        xPercent: ltr ? 0 : -50,
        ease: "none",
        duration: Math.max(24, originals.length * repeats * 3.2),
        repeat: -1
      });
    });

    let hovering = false;
    const settle = () => loops.forEach((loop) => gsap.to(loop, { timeScale: hovering ? 0 : 1, duration: 0.8, ease: "power2.out", overwrite: true }));
    rail.addEventListener("pointerenter", () => { hovering = true; settle(); });
    rail.addEventListener("pointerleave", () => { hovering = false; settle(); });

    ScrollTrigger.create({
      trigger: rail,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => loops.forEach((loop) => (self.isActive ? loop.play() : loop.pause())),
      onUpdate: (self) => {
        if (hovering) return;
        const boost = Math.min(Math.abs(self.getVelocity()) / 350, 4);
        if (boost < 0.2) return;
        loops.forEach((loop) => gsap.to(loop, { timeScale: 1 + boost, duration: 0.2, overwrite: true, onComplete: settle }));
      }
    });
  }

  /* Created once the page is revealed, so above-the-fold content animates
     in view rather than under the logo overlay. */
  revealed.then(() => {
    /* Section reveals, batched so siblings that enter together stagger.
       On completion the inline styles are cleared so hover springs own the
       transform from then on. */
    const settle = (el: Element) => {
      el.classList.add("is-in");
      gsap.set(el, { clearProps: "opacity,visibility,transform" });
    };

    ScrollTrigger.batch('[data-reveal]:not([data-reveal="scale"])', {
      start: "top 90%",
      once: true,
      interval: 0.08,
      batchMax: 6,
      onEnter: (elements) => gsap.fromTo(elements,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.07, overwrite: true, onComplete: () => elements.forEach(settle) })
    });

    /* Industry cards and awards scale up as they enter */
    ScrollTrigger.batch('[data-reveal="scale"]', {
      start: "top 92%",
      once: true,
      interval: 0.1,
      batchMax: 3,
      onEnter: (elements) => gsap.fromTo(elements,
        { autoAlpha: 0, y: 32, scale: 0.94 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: "power3.out", stagger: 0.09, overwrite: true, onComplete: () => elements.forEach(settle) })
    });

    /* Stats count up once, quickly and without overshoot */
    gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
      const target = Number(el.dataset.count || 0);
      const decimals = Number(el.dataset.decimals || 0);
      const state = { value: 0 };
      el.textContent = (0).toFixed(decimals);
      gsap.to(state, {
        value: target,
        duration: 1.2,
        ease: "power2.out",
        onUpdate: () => { el.textContent = state.value.toFixed(decimals); },
        scrollTrigger: { trigger: el, start: "top 92%", once: true }
      });
    });
  });

  return () => document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-in"));
});

document.fonts?.ready.then(() => ScrollTrigger.refresh());
window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });

/* ------------------------------------------------------------ Lazy images */
/* Fade in once decoded; the opacity transition lives in CSS. */
document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((img) => {
  const done = () => img.classList.add("is-loaded");
  if (img.complete && img.naturalWidth) done();
  else {
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
  }
});

document.documentElement.classList.add("motion-ready");

/* ------------------------------------------------------------ Micro-interactions */
/* Spring transforms only; shadows are pre-rendered pseudo-elements whose
   opacity is toggled via `.is-lifted` (composited, no repaint per frame). */
if (finePointer && !reducedMotion) {
  hover(".button", (el) => {
    animate(el, { scale: 1.02 }, spring);
    el.classList.add("is-lifted");
    return () => {
      animate(el, { scale: 1 }, spring);
      el.classList.remove("is-lifted");
    };
  });

  press(".button", (el) => {
    animate(el, { scale: 0.98 }, spring);
    return () => animate(el, { scale: el.matches(":hover") ? 1.02 : 1 }, spring);
  });

  hover(".solution-card, .industry-card, .office-grid article, .expertise-index a, .leader-card", (el) => {
    animate(el, { y: -4 }, springSoft);
    el.classList.add("is-lifted");
    return () => {
      animate(el, { y: 0 }, springSoft);
      el.classList.remove("is-lifted");
    };
  });

  hover(".award", (el) => {
    const img = el.querySelector("img");
    if (!img) return;
    animate(img, { scale: 1.05 }, springSoft);
    return () => animate(img, { scale: 1 }, springSoft);
  });
}

/* ------------------------------------------------------------ Spring panels */
/* Visibility is toggled in CSS (with a delayed hide); opacity/transform are
   animated here: a spring scale + fade in, a quick fade out. */
export function showPanel(el: HTMLElement, from: { y?: number; x?: string; scale?: number } = {}) {
  if (reducedMotion) {
    el.style.opacity = "1";
    el.style.transform = "none";
    return;
  }
  const keyframes: Record<string, unknown> = { opacity: [0, 1] };
  if (from.x !== undefined) keyframes.x = [from.x, "0%"];
  else keyframes.y = [from.y ?? 10, 0];
  if (from.scale !== undefined) keyframes.scale = [from.scale, 1];
  animate(el, keyframes, spring);
}

export function hidePanel(el: HTMLElement, to: { y?: number; x?: string; scale?: number } = {}) {
  if (reducedMotion) {
    el.style.opacity = "0";
    if (to.x !== undefined) el.style.transform = `translate3d(${to.x}, 0, 0)`;
    return Promise.resolve();
  }
  const keyframes: Record<string, unknown> = { opacity: 0 };
  if (to.x !== undefined) keyframes.x = to.x;
  else keyframes.y = to.y ?? 6;
  if (to.scale !== undefined) keyframes.scale = to.scale;
  return animate(el, keyframes, to.x !== undefined ? { duration: 0.28, ease: [0.4, 0, 0.2, 1] } : quickOut).finished;
}

export function staggerIn(elements: Element[] | NodeListOf<Element>) {
  if (reducedMotion) return;
  Array.from(elements).forEach((el, i) => {
    animate(el, { opacity: [0, 1], y: [12, 0] }, { ...springSoft, delay: 0.06 + i * 0.03 });
  });
}

/* Pause smooth scroll while an overlay owns scrolling. */
export function lockScroll(locked: boolean) {
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}
