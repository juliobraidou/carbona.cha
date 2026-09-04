"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Scroll entrance used by every card and section on the site.
 *
 * The hidden state lives in CSS behind a `.js` class that an inline script in
 * <head> adds before first paint. That means:
 *   - no JS (or JS that fails) → content renders fully visible, never blank
 *   - JS → the element starts hidden and fades up when it scrolls into view
 *   - no hydration flash, because the class is set before the first paint
 *
 * Deliberately small: 18px of travel and a 320ms landing. The content is the
 * point, so the motion only signals "this just arrived" — anything larger
 * turns a product grid into a slideshow.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** Stagger in seconds. Keep a whole group under ~0.4s. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Already revealed (fast scroll past, or a re-mount) — nothing to do.
    if (element.dataset.inview === "true") return;

    /* IntersectionObserver callbacks are deferred while the tab is in the
       background, which would leave the whole page at opacity 0 for anyone
       who opens the site in a background tab. There is nobody watching an
       entrance animation they cannot see, so just show the content. */
    if (typeof IntersectionObserver === "undefined" || document.hidden) {
      /* `instant` kills the transition as well as flipping the state: a CSS
         transition does not advance while the tab is hidden, so relying on it
         here would leave the element stuck at opacity 0. */
      element.dataset.instant = "true";
      element.dataset.inview = "true";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          element.dataset.inview = "true";
          observer.disconnect();
        }
      },
      // Fires a little before the element is fully on screen.
      { rootMargin: "0px 0px -80px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className ? `reveal ${className}` : "reveal"}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
