"use client";

import { useEffect, useRef } from "react";

// Two soft red blobs that trail the pointer inside the parent section.
// The near one follows quickly, the far one lags, which gives the glow depth.
export function CursorGlow() {
  const rootRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLDivElement>(null);
  const farRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const near = nearRef.current;
    const far = farRef.current;
    if (!root || !near || !far) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = { x: root.clientWidth * 0.72, y: root.clientHeight * 0.32 };
    const a = { ...target };
    const b = { ...target };
    let raf = 0;

    const tick = () => {
      a.x += (target.x - a.x) * 0.07;
      a.y += (target.y - a.y) * 0.07;
      b.x += (target.x - b.x) * 0.025;
      b.y += (target.y - b.y) * 0.025;
      near.style.setProperty("--x", `${a.x}px`);
      near.style.setProperty("--y", `${a.y}px`);
      far.style.setProperty("--x", `${b.x}px`);
      far.style.setProperty("--y", `${b.y}px`);

      const settled = Math.abs(target.x - b.x) < 0.5 && Math.abs(target.y - b.y) < 0.5;
      raf = settled ? 0 : requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      target.x = e.clientX - rect.left;
      target.y = e.clientY - rect.top;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div ref={farRef} className="lp-glow lp-glow-far" />
      <div ref={nearRef} className="lp-glow lp-glow-near" />
    </div>
  );
}
