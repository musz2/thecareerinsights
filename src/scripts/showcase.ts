/* Homepage showcase motion: blur-to-sharp statement, success-rate badge
   ring, and the scroll-drawn process diagram.
   Everything waits for the logo overlay to lift; reduced motion gets the
   final states. */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { revealed } from "./loader";

gsap.registerPlugin(ScrollTrigger, SplitText);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------ Statement */
function initStatement(el: HTMLElement) {
  if (reducedMotion) return;
  const split = SplitText.create(el, { type: "words" });
  gsap.fromTo(split.words, { opacity: 0.12, filter: "blur(8px)" }, {
    opacity: 1,
    filter: "blur(0px)",
    ease: "none",
    stagger: 0.12,
    scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 42%", scrub: 0.6 }
  });
}

/* ------------------------------------------------------------ Badge ring */
function initBadge(badge: HTMLElement) {
  const ring = badge.querySelector<SVGCircleElement>(".media-badge-progress");
  if (!ring || reducedMotion) return;
  const target = Number(getComputedStyle(ring).getPropertyValue("--value")) || 95;
  gsap.set(ring, { "--value": 0 });
  gsap.to(ring, {
    "--value": target,
    duration: 1.6,
    ease: "power2.out",
    scrollTrigger: { trigger: badge, start: "top 88%", once: true }
  });
}

/* ------------------------------------------------------------ Process */
function initProcess(section: HTMLElement) {
  const links = Array.from(section.querySelectorAll<SVGPathElement>("[data-process-link]"));
  const steps = Array.from(section.querySelectorAll<HTMLElement>("[data-process-step]"));
  const light = (progress: number) => {
    const thresholds = [0.02, 0.48, 0.94];
    steps.forEach((step, i) => step.classList.toggle("is-lit", progress >= thresholds[i]));
  };
  if (reducedMotion) { light(1); return; }

  /* Connectors are dashed, so they're revealed with a clip that opens left
     to right rather than a stroke-dashoffset draw. */
  gsap.set(links, { clipPath: "inset(0 100% 0 0)" });
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: section.querySelector(".process-stage"),
      start: "top 75%",
      end: "bottom 60%",
      scrub: 0.6,
      onUpdate: (self) => light(self.progress)
    }
  });
  tl.to(links[0], { clipPath: "inset(0 0% 0 0)", duration: 0.42 }, 0.04);
  if (links[1]) tl.to(links[1], { clipPath: "inset(0 0% 0 0)", duration: 0.42 }, 0.52);
}

revealed.then(() => {
  document.querySelectorAll<HTMLElement>("[data-word-reveal]").forEach(initStatement);
  document.querySelectorAll<HTMLElement>("[data-media-badge]").forEach(initBadge);
  document.querySelectorAll<HTMLElement>("[data-process]").forEach(initProcess);
  ScrollTrigger.refresh();
});
