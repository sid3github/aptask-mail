"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Global route-change progress bar (the thin accent line at the very top, like
// GitHub / YouTube). App Router has no router events, so we detect the *start*
// of a navigation two ways — intercepting same-origin link clicks and patching
// history.pushState (covers programmatic router.push, e.g. search) — and detect
// *completion* when the resolved pathname / search params change.
export function TopProgressBar() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [progress, setProgress] = useState(0); // 0 = idle/hidden
  const visible = useRef(false);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Holds the latest `done` so the route-change effect can finish the bar
  // without re-running the (mount-only) listener-setup effect.
  const finish = useRef<() => void>(() => {});

  useEffect(() => {
    function clearTimers() {
      for (const r of [trickle, hide, safety]) {
        if (r.current) {
          clearInterval(r.current as ReturnType<typeof setInterval>);
          clearTimeout(r.current as ReturnType<typeof setTimeout>);
          r.current = null;
        }
      }
    }

    function start() {
      if (visible.current) return;
      visible.current = true;
      clearTimers();
      setProgress(8);
      // Ease toward 90% and wait there until the route actually commits.
      trickle.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) return p;
          const step = p < 40 ? 9 : p < 70 ? 4 : 1.5;
          return Math.min(90, p + step);
        });
      }, 280);
      // Never get stuck if a navigation is cancelled or no-ops.
      safety.current = setTimeout(done, 12000);
    }

    function done() {
      if (!visible.current) return;
      visible.current = false;
      clearTimers();
      setProgress(100);
      hide.current = setTimeout(() => setProgress(0), 260);
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const a = (e.target as HTMLElement | null)?.closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href) return;
      try {
        const url = new URL(href, location.href);
        if (url.origin !== location.origin) return;
        if (url.protocol !== "http:" && url.protocol !== "https:") return;
        if (url.pathname + url.search === location.pathname + location.search) return;
        start();
      } catch {
        /* ignore malformed hrefs */
      }
    }

    document.addEventListener("click", onClick, true);
    const origPush = history.pushState;
    history.pushState = function (this: History, ...args: Parameters<History["pushState"]>) {
      start();
      return origPush.apply(this, args);
    };
    window.addEventListener("popstate", start);

    // Expose start/done to the completion effect via the ref bag.
    finish.current = done;

    return () => {
      document.removeEventListener("click", onClick, true);
      history.pushState = origPush;
      window.removeEventListener("popstate", start);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    finish.current();
  }, [pathname, search]);

  if (progress === 0) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5">
      <div
        className="h-full rounded-r-full bg-accent shadow-[0_0_10px_0] shadow-accent/70 transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
      />
    </div>
  );
}
