"use client";

import { useEffect, useRef, useState } from "react";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Returns `target`, but when it changes the returned value counts smoothly from
 * the old number to the new one (chips sliding into the pot, a stack paying off).
 * Falls back to jumping straight there when animation frames or motion are off.
 */
export function useTween(target: number, duration = 480): number {
  const [value, setValue] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const start = from.current;
    const reduce =
      typeof window === "undefined" ||
      typeof window.requestAnimationFrame !== "function" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || start === target) {
      from.current = target;
      setValue(target);
      return;
    }

    let frame = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const v = Math.round(start + (target - start) * easeOut(t));
      from.current = v;
      setValue(v);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
