/* Animated TCI logo: pointer tilt + specular highlight, and a faint drifting
   "dust" canvas. The canvas loop only runs while the logo is on screen and
   the tab is visible; everything is skipped for reduced motion. */
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

interface Particle { x: number; y: number; vx: number; vy: number; r: number; a: number; red: boolean; tw: number; ph: number }

function initLogo(stage: HTMLElement) {
  const tilt = stage.querySelector<HTMLElement>("[data-tci-logo-tilt]");
  const spec = stage.querySelector<SVGCircleElement>("[data-tci-logo-spec]");
  const canvas = stage.querySelector<HTMLCanvasElement>("[data-tci-logo-dust]");

  if (finePointer && tilt) {
    let rect: DOMRect | null = null;
    stage.addEventListener("pointerenter", () => { rect = stage.getBoundingClientRect(); }, { passive: true });
    stage.addEventListener("pointermove", (event) => {
      rect ??= stage.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width;
      const ny = (event.clientY - rect.top) / rect.height;
      tilt.style.setProperty("--ry", `${((nx - 0.5) * 8).toFixed(2)}deg`);
      tilt.style.setProperty("--rx", `${((0.5 - ny) * 8).toFixed(2)}deg`);
      spec?.setAttribute("cx", (nx * 440).toFixed(1));
      spec?.setAttribute("cy", (ny * 300).toFixed(1));
    }, { passive: true });
    stage.addEventListener("pointerleave", () => {
      rect = null;
      tilt.style.setProperty("--rx", "0deg");
      tilt.style.setProperty("--ry", "0deg");
    }, { passive: true });
  }

  const context = canvas?.getContext("2d");
  if (!canvas || !context) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;
  const size = () => {
    width = stage.clientWidth;
    height = stage.clientHeight;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  new ResizeObserver(size).observe(stage);
  size();

  const particles: Particle[] = Array.from({ length: 14 }, () => ({
    x: 0.1 + Math.random() * 0.8,
    y: 0.1 + Math.random() * 0.62,
    vx: (Math.random() - 0.5) * 0.012,
    vy: (Math.random() - 0.5) * 0.012,
    r: 0.8 + Math.random() * 1.8,
    a: 0.04 + Math.random() * 0.09,
    red: Math.random() < 0.25,
    tw: 0.6 + Math.random() * 1.2,
    ph: Math.random() * Math.PI * 2
  }));

  let frame = 0;
  let visible = false;
  const start = performance.now();
  const draw = (now: number) => {
    const t = (now - start) / 1000;
    context.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.x += p.vx * 0.016;
      p.y += p.vy * 0.016;
      if (p.x < 0.08 || p.x > 0.92) p.vx *= -1;
      if (p.y < 0.07 || p.y > 0.74) p.vy *= -1;
      const twinkle = 0.5 + 0.5 * Math.sin(t * p.tw + p.ph);
      const x = p.x * width;
      const y = p.y * height;
      const color = p.red ? "209,33,46" : "150,156,166";
      const gradient = context.createRadialGradient(x, y, 0, x, y, p.r * 4);
      gradient.addColorStop(0, `rgba(${color},${(p.a * twinkle).toFixed(3)})`);
      gradient.addColorStop(1, `rgba(${color},0)`);
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, p.r * 4, 0, Math.PI * 2);
      context.fill();
    }
    frame = requestAnimationFrame(draw);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    if (visible && document.visibilityState === "visible") frame = requestAnimationFrame(draw);
  };
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(stage);
  document.addEventListener("visibilitychange", sync);
}

if (!reducedMotion) document.querySelectorAll<HTMLElement>("[data-tci-logo-stage]").forEach(initLogo);
