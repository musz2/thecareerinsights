/**
 * Ambient "talent network" background — Canvas 2D, zero heavy dependencies.
 * A quiet constellation of nodes that drift and link up (the company's work:
 * connecting people, skills, and organizations). Screen-blended via CSS so
 * it reads as light on dark chapters and vanishes on white sections.
 *
 * Safeguards: DPR capped, paused when the tab is hidden, removed for
 * reduced-motion / coarse-pointer / small screens, all listeners and the
 * RAF loop cleaned up on pagehide.
 */

interface NodePoint {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  c: string;
  tw: number; /* twinkle phase */
}

const PALETTE = [
  "201,35,45",    /* brand red */
  "212,163,69",   /* gold */
  "127,210,238",  /* cool cyan */
  "255,255,255"   /* white */
];

export function initAmbientBackground(): (() => void) | undefined {
  const stage = document.querySelector<HTMLElement>("[data-ambient-stage]");
  const canvas = stage?.querySelector<HTMLCanvasElement>("[data-ambient-canvas]");
  if (!stage || !canvas) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = window.matchMedia("(pointer: coarse)");
  const small = window.matchMedia("(max-width: 820px)");
  if (reduced.matches || coarse.matches || small.matches) {
    stage.remove();
    return;
  }

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    stage.remove();
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let width = 0;
  let height = 0;
  let nodes: NodePoint[] = [];
  const pointer = { x: 0.5, y: 0.5 };
  const drift = { x: 0, y: 0 };

  const build = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const target = Math.min(46, Math.round((width * height) / 42000));
    nodes = Array.from({ length: target }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.16,
      r: 0.8 + Math.random() * 1.6,
      c: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      tw: Math.random() * Math.PI * 2
    }));
  };

  const LINK = 128;
  let raf = 0;
  let running = true;

  const frame = () => {
    raf = window.requestAnimationFrame(frame);
    const t = performance.now() * 0.001;

    /* gentle parallax toward pointer + scroll */
    drift.x += ((pointer.x - 0.5) * 26 - drift.x) * 0.035;
    drift.y += ((pointer.y - 0.5) * 18 - (window.scrollY * 0.02) % 40 - drift.y) * 0.035;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(drift.x, drift.y);

    /* links */
    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > LINK * LINK) continue;
        const alpha = (1 - Math.sqrt(d2) / LINK) * 0.16;
        ctx.strokeStyle = `rgba(${a.c},${alpha.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    /* nodes */
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < -20) n.x = width + 20; else if (n.x > width + 20) n.x = -20;
      if (n.y < -20) n.y = height + 20; else if (n.y > height + 20) n.y = -20;
      const twinkle = 0.45 + Math.sin(t * 0.9 + n.tw) * 0.25;
      ctx.fillStyle = `rgba(${n.c},${twinkle.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
      /* soft halo on the larger nodes */
      if (n.r > 1.8) {
        ctx.fillStyle = `rgba(${n.c},0.05)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  };

  const onPointer = (e: PointerEvent) => {
    pointer.x = e.clientX / Math.max(window.innerWidth, 1);
    pointer.y = e.clientY / Math.max(window.innerHeight, 1);
  };
  const onResize = () => build();
  const onVisibility = () => {
    if (document.hidden && running) {
      cancelAnimationFrame(raf);
      running = false;
    } else if (!document.hidden && !running) {
      running = true;
      frame();
    }
  };
  const onMotionChange = () => {
    if (reduced.matches) cleanup();
  };

  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  reduced.addEventListener?.("change", onMotionChange);

  build();
  frame();

  const cleanup = () => {
    cancelAnimationFrame(raf);
    running = false;
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibility);
    reduced.removeEventListener?.("change", onMotionChange);
    stage.remove();
  };
  window.addEventListener("pagehide", cleanup, { once: true });
  return cleanup;
}
