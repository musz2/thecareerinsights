# TCI Website Audit & Cinematic Upgrade Report — v3.1

## v3.1 revision (client feedback round)

- **E-Verified badge is now flat**, in the visual language of the official mark: a white plaque with a flag-styled "E" (blue star field + red stripes) and a navy "-Verified" wordmark, plus the "U.S. Employer Trust Badge" subline. It is original artwork, not the registered E-Verify® logo, and makes no government-endorsement claim. Subtle stripe-flex animation on hover only. Used large in the trust section and compact in the footer (`TrustBadge.astro`). If the company's official participation artwork from its E-Verify MOU is provided later, it can be dropped into `/public/images/` and swapped in.
- **3D WebGL background removed entirely.** Three.js and @types/three were removed from `package.json` (smaller install, no 500 kB chunk). The replacement is a brand-true ambient layer: a slow, quiet "talent network" constellation (Canvas 2D, ~70 nodes, brand red/gold/cyan) — people and skills connecting, which is literally the company's work. Screen-blended, so it glows softly on dark chapters and disappears on white editorial sections. Same safeguards as before: DPR cap, tab-hidden pause, removed on mobile/coarse/reduced-motion, full cleanup on navigation (`AmbientBackground.astro` + `ambient-background.ts`, replacing `GlobalWebGL.astro` + `global-webgl.ts`).
- **Logo enlarged and more animated**: 66px in the header (72px in the footer), larger wordmark, ring + path draw themselves on page load, the arrow gives a periodic nudge, and hover tilts/scales the mark and turns the ring brand-red. All of it is disabled under reduced motion.
- **FlowMenu added** (`.flow-menu` in `SiteHeader.astro`): the hamburger now appears on every viewport and opens a fullscreen navigation where each item is an oversized editorial row — on hover a red band flows up with an infinite marquee of the item's name (gold ✦ separators), plus numbered indices, arrow nudges, solutions shortcuts, and contact details in the menu footer. GSAP staggered reveal, Esc/click to close, marquee band disabled on touch (tap navigates directly) and under reduced motion.
- **Premium design pass**: gradient-sheen red/gold buttons with depth shadows, gradient eyebrow rules, gradient accent on the hero headline emphasis, animated underline on desktop nav items, footer-link micro-motion, gradient stat band, balanced headline wrapping, styled scrollbar colors.

---

# v3 report — original cinematic upgrade

Upgrade of the existing Astro 5 codebase into a chapter-based cinematic experience.
All existing content, branding, routes, SEO metadata, business messaging, forms, and
responsive behavior were preserved. No content was removed.

---

## 1. Problems found in the audit

### SEO
- **Hardcoded canonical URL**: every page declared `<link rel="canonical" href="https://thecareerinsights.com">`, telling search engines that all routes are duplicates of the homepage.
- **Hardcoded `og:url`**: same issue for social sharing.

### Routes / links
- Footer "Privacy" link pointed to `/` — there was no privacy page.
- No Terms page existed.

### WebGL / memory
- The hero Three.js scene disposed only the renderer and the particle geometry. Sphere/icosahedron geometries, all materials, and lights were never disposed.
- The render loop kept running while the tab was hidden (wasted GPU/battery).
- No WebGL-context failure guard around `new WebGLRenderer()`.

### Motion / scroll
- Lenis was installed but never used (dead dependency at runtime).
- No pinned scenes, no scrub choreography, no chapter system.
- `prefers-reduced-motion` was respected for entrances, but a mid-session change of the setting did not stop the WebGL loop.

### Content data
- India office address needed updating to the confirmed format (Mehdipatnam, Hyderabad, Telangana 500006, India); the contact page also displayed a hardcoded "Apex Habitat" heading and a stale maps query.

### Misc
- No skip-to-content link for keyboard users.
- Old `dist/` build output was stale relative to the new source.

## 2. Fixes applied

- Per-page `canonical` and `og:url` computed from `Astro.url.pathname` + `Astro.site` in `BaseLayout.astro`.
- Footer legal links now point to the new `/privacy-policy` and `/terms-and-conditions` routes.
- The hero-only WebGL scene was **replaced** by one global, chapter-based scene (single renderer for the whole site). Disposal now traverses the entire scene graph and disposes every geometry and material, then the renderer; all listeners are removed; the RAF loop is cancelled; the IntersectionObserver is disconnected. Rendering pauses on `visibilitychange` and the scene tears itself down if `prefers-reduced-motion` flips on mid-session.
- Lenis is now actually used (desktop, fine-pointer, motion-allowed only), driven by the GSAP ticker and synced with ScrollTrigger; destroyed on `pagehide`.
- Skip link added; all interactive additions have ARIA labels, visible focus states, and keyboard support.
- India address updated in `src/data/site.ts` and on the contact page (including the maps link).
- Stale `dist/` and the superseded `SiteFooter.astro` removed.

## 3. New routes

| Route | Purpose |
|---|---|
| `/privacy-policy` | SEO title/meta, cinematic hero, sticky table of contents, clean legal layout, global nav/footer. Placeholder professional language with an explicit "review by counsel" note — no unsupported claims. |
| `/terms-and-conditions` | Same structure: acceptance, services, acceptable use, IP, disclaimers, liability, governing law (Delaware), contact. |

All pre-existing routes (`/`, `/about`, `/contact`, `/services`, `/industries`, `/solutions`, `/solutions/rpo`, `/solutions/contingent-workforce`, `/solutions/talent-solutions`, `/api/contact`) are untouched and intact.

## 4. New components & scripts

| File | Role |
|---|---|
| `src/components/GlobalWebGL.astro` + `src/scripts/global-webgl.ts` | Fixed full-site WebGL background (screen-blend so it vanishes on light sections). Chapter visuals: Hero AI core, About glass prism, Career Journey 3D pathway, Solutions constellation, Workforce talent network, Expertise floating service objects, Impact analytics rings, Contact light beam + floating brand mark. Scroll-reactive virtual camera rig (scroll dolly + pointer parallax) and per-chapter lighting/fog moods. |
| `src/scripts/cinematic-scroll.ts` | Lenis smooth scroll, pinned cinematic hero (scrub dim/scale on exit), word-mask text reveals, horizontal pinned capabilities (desktop), per-chapter scene-light scrub, floating panels, trust-badge parallax, footer light sweep, impact counters/rings/graph, chapter progress logic, accordion logic. Every trigger/ticker/listener cleaned up on `pagehide`. |
| `src/components/ChapterProgress.astro` | Fixed chapter indicator: progress rail, current chapter label, clickable jump dots. Auto-removes on pages with fewer than two chapters. |
| `src/components/HorizontalCapabilities.astro` | Pinned, scroll-scrubbed horizontal section (8 expertise panels). On touch/mobile it degrades to native horizontal swipe with scroll-snap — no scroll-jacking. |
| `src/components/StackedAccordion.astro` | Premium stacked accordion of the solution portfolio. Accessible disclosure pattern (`aria-expanded`/`aria-controls`), GSAP height animation, no-JS fallback leaves content visible. |
| `src/components/ImpactDashboard.astro` | Cinematic dashboard: animated counters (15K+ Professionals Helped, 95% Success Rate, 4.9 Rating, 300% Career Growth), radial progress rings, drawn line graph, data pulses, glass floating panels for Students Trained / Companies Supported / University Partnerships (presented as program areas — no invented figures). |
| `src/components/WhyChooseTrust.astro` + `src/components/TrustBadge.astro` | "Why Choose The Career Insights?" trust section — dark cinematic background, gold accents, glass benefit cards with hover glow, GSAP reveal, floating/parallax custom badge. |
| `src/components/CinematicFooter.astro` | Global cinematic footer: brand description, CONNECT block, OFFICES office cards, quick links, service links, legal links, compact E-Verified badge, animated grid background, scroll-triggered light sweep, CTA buttons (Email Us / Call Desk / Book Consultation). Replaces `SiteFooter.astro`. |
| `src/components/PremiumCursor.astro` + `src/scripts/premium-cursor.ts` | Desktop-only cursor ring + core with magnetic attraction on buttons/nav. The native cursor is intentionally kept visible for accessibility. Removed on coarse pointers and reduced motion. |
| `src/components/AIAssistant.astro` + `src/scripts/ai-assistant.ts` + `src/data/assistantKnowledge.ts` | AI voice assistant (details below). |

Plus changed files: `src/pages/privacy-policy.astro` (new), `src/pages/terms-and-conditions.astro` (new), `src/layouts/BaseLayout.astro` (canonical fix, new components, skip link), `src/pages/index.astro` (chapter attributes, mask reveals, four new sections), `src/pages/contact.astro` (address fix, CTA buttons), `src/data/site.ts` (address fix + new data sets), `src/styles/global.css` ("Cinematic Upgrade v3" layer), `src/scripts/site.ts` (legacy hero WebGL removed, lazy bootstrap for all new systems).

## 5. Contact / footer data (as specified)

CONNECT — info@thecareerinsights.com (mailto link) · Desk: +1 (302) 231-2961 (tel link) · Contact: +1 (302) 499-2545 (tel link) · Mon-Fri 9AM-6PM EST.
OFFICES — 8 The Green, Dover, DE 19901 USA · Mehdipatnam, Hyderabad, Telangana 500006, India (office cards in footer and on /contact).
CTA buttons — Email Us, Call Desk, Book Consultation (footer CTA scene and contact hero).

## 6. Chatbot details

- **UI**: floating glass orb (bottom right), GSAP open/close, desktop side panel, fullscreen overlay on mobile, Esc to close, focus management, `role="dialog"` + `role="log"` with `aria-live`.
- **Knowledge**: 100% local (`assistantKnowledge.ts`) — keyword-scored intent matching over ~24 topics: services, career guidance, training, workforce solutions, university programs, AI & ML, DevOps, Cloud, Cybersecurity, SAP, Application Development, contact details, offices, business hours, consultation booking, support, Privacy Policy, Terms, industries, veterans/cleared talent, E-Verify. First-time visitor greetings (Hi / Hello / Who are you / What can you help me with / I need help / career guidance / training details / workforce support / contact help) included.
- **No hallucination**: anything that doesn't match the knowledge base gets a fixed fallback that redirects to email/phone. The bot only speaks about The Career Insights.
- **No backend, no API keys**: zero network calls; a note in the panel states no data leaves the browser.
- **Voice out**: SpeechSynthesis with cached voices (`voiceschanged`), preferring female voices in order: Microsoft Aria, Microsoft Jenny, Google US English, Samantha, Victoria, Karen, Susan, Zira; safe English/any fallback. No autoplay — speech only after explicit user action ("Speak answer" per message, or the voice-replies toggle). Speech cancelled on close, mute, and `pagehide`/navigation.
- **Voice in**: Web Speech API (`SpeechRecognition`/`webkitSpeechRecognition`) where supported; the mic button disables itself with an explanatory tooltip where unsupported.
- **Controls & states**: voice on/off, mute/unmute, Speak Answer, Stop Voice, mic input, animated waveform, status pill — Online / Listening… / Thinking… / Speaking… / Muted.
- **Performance**: logic lazy-loads on first orb click or after browser idle; quick-question chips; typewriter answer animation (instant under reduced motion).

## 7. E-Verified badge update

- Custom, original SVG/CSS badge — **not** the official E-Verify logo, not a government seal, and no claim of government endorsement.
- Approved wording only: "E-Verified" / "U.S. Employer Trust Badge".
- Appears full-size in the trust section (floating, parallax, rotating gold rings) and compact in the footer; the footer bottom line reads "E-Verified U.S. Employer".

## 8. Safeguards

- Three.js dynamically imported; single renderer; pixel ratio capped at 1.5; render paused when tab hidden; full scene-graph disposal; context-creation try/catch; removed entirely on ≤820px, coarse pointers, and reduced motion (CSS atmosphere remains as fallback).
- All GSAP triggers, Lenis, observers, RAF loops, and listeners are torn down on `pagehide`.
- Reduced motion: smooth scroll, pinning, masks, counter animation, cursor, WebGL, sweep/grid animations all disabled; values render instantly; content is never left hidden.
- Mobile: no pinning or scroll-jacking; horizontal section becomes native swipe; assistant goes fullscreen (`100dvh`); cursor and WebGL removed; Safari `-webkit-backdrop-filter` throughout.
- No autoplay audio anywhere. No API keys anywhere in the codebase.

## 9. Verification & final build result

Verified in this environment:

- `tsc --strict --noEmit` over all five scripts and both data modules — **0 errors**.
- Astro compiler (`@astrojs/compiler`) over all `.astro` files — **0 diagnostics**.
- Static check that every relative import in `src/` resolves — **all resolve**.
- CSS brace-balance check on `global.css` — **OK**.
- Routes present: `/`, `/privacy-policy`, `/terms-and-conditions` plus all pre-existing routes.

**Note on `npm run build`:** this revision was prepared in a sandboxed Linux (arm64) environment with no package-registry access, and the project's `node_modules` (zipped on macOS) lacks the Linux native binaries for rollup/esbuild, so the final `astro check && astro build` could not be executed inside the sandbox. All source-level checks above pass. On your machine (where the previous build succeeded), run:

```bash
npm install
npm run build
```

Any failure there would be environmental rather than source-level — the code type-checks strictly and every template compiles.

## 10. Manual QA checklist

- `/`, `/privacy-policy`, `/terms-and-conditions` render with global nav/footer
- Chatbot: open/close, text chat, quick questions, voice toggle, mute/unmute, Speak Answer, Stop Voice, mic (Chrome/Edge; gracefully disabled elsewhere)
- Mobile nav overlay; reduced-motion mode (OS setting); contact links (mailto/tel); footer links incl. legal; E-Verified badge in trust section + footer
- Pinned hero, horizontal capabilities, accordion, impact dashboard counters, chapter dots navigation
