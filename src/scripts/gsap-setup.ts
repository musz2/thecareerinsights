/**
 * Single GSAP + ScrollTrigger entry point.
 *
 * Both site.ts and cinematic-scroll.ts previously imported gsap and
 * ScrollTrigger and each called registerPlugin separately. Routing both
 * through this module guarantees one shared GSAP instance and one plugin
 * registration, so triggers can't fire twice from competing registrations.
 */
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
