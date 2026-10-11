import { useEffect } from "react";

/**
 * Universal Kinetic Drag-to-Scroll Hook
 * Enables touch-like swipe/drag scrolling anywhere on the screen
 * Works seamlessly with touchscreens, mice, and stylus pointers without showing any scrollbars.
 */
export function useDragScroll() {
  useEffect(() => {
    let isDown = false;
    let isDragging = false;
    let startY = 0;
    let startScrollY = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocityY = 0;
    let animationFrameId = null;

    const onPointerDown = (e) => {
      // Don't drag-scroll on input elements or virtual keyboard keys
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      isDown = true;
      isDragging = false;
      startY = e.clientY;
      startScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      lastY = e.clientY;
      lastTime = performance.now();
      velocityY = 0;

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    const onPointerMove = (e) => {
      if (!isDown) return;

      const dy = e.clientY - startY;

      // Threshold of 6px to distinguish a tap from a drag gesture
      if (!isDragging && Math.abs(dy) > 6) {
        isDragging = true;
      }

      if (isDragging) {
        const now = performance.now();
        const dt = now - lastTime;
        if (dt > 0) {
          velocityY = (e.clientY - lastY) / dt;
        }
        lastY = e.clientY;
        lastTime = now;

        const targetY = startScrollY - dy;
        window.scrollTo(0, Math.max(0, targetY));
      }
    };

    const onPointerUp = () => {
      if (!isDown) return;
      isDown = false;

      if (isDragging) {
        // Suppress any accidental click triggered by releasing the finger/pointer
        const preventClick = (clickEvent) => {
          clickEvent.stopPropagation();
          clickEvent.preventDefault();
          window.removeEventListener("click", preventClick, true);
        };
        window.addEventListener("click", preventClick, true);
        setTimeout(() => window.removeEventListener("click", preventClick, true), 100);

        // Kinetic momentum coasting for a natural tablet/phone feel
        let momentum = velocityY * 200;
        const coast = () => {
          if (Math.abs(momentum) < 0.3) return;
          window.scrollBy(0, -momentum * 0.08);
          momentum *= 0.92;
          animationFrameId = requestAnimationFrame(coast);
        };
        animationFrameId = requestAnimationFrame(coast);
      }
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);
}
