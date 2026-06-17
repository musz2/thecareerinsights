/**
 * Premium custom cursor — desktop fine-pointer only, reduced-motion aware.
 * Keeps the native cursor visible (accessibility) and adds a trailing ring +
 * core with magnetic attraction on interactive elements.
 */
export function initPremiumCursor(): (() => void) | undefined {
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const root = document.querySelector<HTMLElement>("[data-premium-cursor]");
  if (!root) return;
  if (!fine.matches || reduced.matches) {
    root.remove();
    return;
  }

  const core = root.querySelector<HTMLElement>(".pcursor-core");
  const ring = root.querySelector<HTMLElement>(".pcursor-ring");
  if (!core || !ring) return;

  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { x: pos.x, y: pos.y };
  let visible = false;
  let raf = 0;
  let hovering = false;

  const INTERACTIVE = "a, button, input, textarea, select, summary, [role='button'], [data-magnetic]";

  const onMove = (e: PointerEvent) => {
    pos.x = e.clientX;
    pos.y = e.clientY;
    if (!visible) {
      visible = true;
      root.classList.add("is-visible");
    }
    const target = (e.target as Element | null)?.closest?.(INTERACTIVE) ?? null;
    hovering = Boolean(target);
    root.classList.toggle("is-hover", hovering);
  };
  const onLeave = () => {
    visible = false;
    root.classList.remove("is-visible");
  };
  const onDown = () => root.classList.add("is-down");
  const onUp = () => root.classList.remove("is-down");

  const loop = () => {
    raf = requestAnimationFrame(loop);
    ringPos.x += (pos.x - ringPos.x) * 0.24;
    ringPos.y += (pos.y - ringPos.y) * 0.24;
    core.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
    ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%) scale(${hovering ? 1.55 : 1})`;
  };

  /* Magnetic pull for tagged elements */
  const magnets = Array.from(document.querySelectorAll<HTMLElement>("[data-magnetic]"));
  const magnetHandlers: Array<[HTMLElement, (e: PointerEvent) => void, () => void]> = [];
  magnets.forEach((el) => {
    const strength = 14;
    const move = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = (e.clientX - rect.left) / rect.width - 0.5;
      const dy = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `translate(${dx * strength}px, ${dy * strength * 0.8}px)`;
    };
    const leave = () => { el.style.transform = ""; };
    el.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerleave", leave, { passive: true });
    magnetHandlers.push([el, move, leave]);
  });

  window.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("pointerup", onUp, { passive: true });
  loop();

  const cleanup = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    magnetHandlers.forEach(([el, move, leave]) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    });
    root.remove();
  };
  window.addEventListener("pagehide", cleanup, { once: true });
  return cleanup;
}
