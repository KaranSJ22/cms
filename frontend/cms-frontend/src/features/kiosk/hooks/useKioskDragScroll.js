import { useRef, useEffect } from "react";

/**
 * Universal touch & drag-to-scroll hook for Raspberry Pi 7-inch touchscreens.
 * Listens directly to native touch events (touchstart, touchmove, touchend)
 * and mouse drag events so you can swipe/drag anywhere on the screen to scroll.
 */
export function useKioskDragScroll() {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let touchStartY = 0;
    let initialTouchScrollTop = 0;
    let isTouching = false;
    let touchMoved = false;

    // 1. Direct Touch Events (for touchscreens)
    const onTouchStart = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      isTouching = true;
      touchMoved = false;
      touchStartY = e.touches[0].clientY;
      initialTouchScrollTop = el.scrollTop;
    };

    const onTouchMove = (e) => {
      if (!isTouching || !e.touches || e.touches.length === 0) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - touchStartY;

      if (Math.abs(deltaY) > 4) {
        touchMoved = true;
        el.scrollTop = initialTouchScrollTop - deltaY;
      }
    };

    const onTouchEnd = () => {
      isTouching = false;
    };

    // 2. Mouse Drag Fallback (in case the Pi driver emulates a mouse cursor)
    let isMouseDown = false;
    let mouseStartY = 0;
    let initialMouseScrollTop = 0;
    let mouseMoved = false;

    const onMouseDown = (e) => {
      // Don't drag if clicking inside text inputs
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }
      isMouseDown = true;
      mouseMoved = false;
      mouseStartY = e.clientY;
      initialMouseScrollTop = el.scrollTop;
    };

    const onMouseMove = (e) => {
      if (!isMouseDown) return;
      const deltaY = e.clientY - mouseStartY;

      if (Math.abs(deltaY) > 5) {
        mouseMoved = true;
        el.scrollTop = initialMouseScrollTop - deltaY;
      }
    };

    const onMouseUp = () => {
      if (!isMouseDown) return;
      isMouseDown = false;

      // If user dragged more than 5px, prevent accidental button click
      if (mouseMoved) {
        const preventClick = (evt) => {
          evt.stopPropagation();
          evt.preventDefault();
        };
        window.addEventListener("click", preventClick, { capture: true, once: true });
        setTimeout(() => {
          window.removeEventListener("click", preventClick, { capture: true });
        }, 50);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);

      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return containerRef;
}
