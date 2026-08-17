'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const EASE = 'power3.easeOut';

// Reproduces PillNav's per-pill hover mechanic (circle reveal + the resting
// label sliding out while a differently-colored hover label slides in) for
// standalone dropdown triggers (LanguageSwitcher, NotificationsPanel) that
// can't live inside PillNav's plain button/link items because they need a
// panel of their own.
export function usePillHoverAnimation() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const circleRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const labelHoverRef = useRef<HTMLSpanElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const layout = () => {
      const btn = btnRef.current;
      const circle = circleRef.current;
      if (!btn || !circle) return;

      const { width: w, height: h } = btn.getBoundingClientRect();
      if (w === 0 || h === 0) return;

      const R = ((w * w) / 4 + h * h) / (2 * h);
      const D = Math.ceil(2 * R) + 2;
      const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
      const originY = D - delta;

      circle.style.width = `${D}px`;
      circle.style.height = `${D}px`;
      circle.style.bottom = `-${delta}px`;
      gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: `50% ${originY}px` });

      const label = labelRef.current;
      const hoverLabel = labelHoverRef.current;
      if (label) gsap.set(label, { y: 0 });
      if (hoverLabel) gsap.set(hoverLabel, { y: h + 12, opacity: 0 });

      tlRef.current?.kill();
      const tl = gsap.timeline({ paused: true });
      tl.to(circle, { scale: 1.2, xPercent: -50, duration: 1.5, ease: EASE, overwrite: 'auto' }, 0);
      if (label) tl.to(label, { y: -(h + 8), duration: 1.5, ease: EASE, overwrite: 'auto' }, 0);
      if (hoverLabel) {
        gsap.set(hoverLabel, { y: Math.ceil(h + 8), opacity: 0 });
        tl.to(hoverLabel, { y: 0, opacity: 1, duration: 1.5, ease: EASE, overwrite: 'auto' }, 0);
      }
      tlRef.current = tl;
    };

    layout();
    window.addEventListener('resize', layout);
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(layout).catch(() => {});
    }
    return () => window.removeEventListener('resize', layout);
  }, []);

  const onMouseEnter = () => {
    const tl = tlRef.current;
    if (!tl) return;
    tweenRef.current?.kill();
    tweenRef.current = tl.tweenTo(tl.duration(), { duration: 0.25, ease: EASE, overwrite: 'auto' });
  };

  const onMouseLeave = () => {
    const tl = tlRef.current;
    if (!tl) return;
    tweenRef.current?.kill();
    tweenRef.current = tl.tweenTo(0, { duration: 0.18, ease: EASE, overwrite: 'auto' });
  };

  return { btnRef, circleRef, labelRef, labelHoverRef, onMouseEnter, onMouseLeave };
}
