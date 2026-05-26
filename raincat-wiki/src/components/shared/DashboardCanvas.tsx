"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export const DASHBOARD_CANVAS_WIDTH = 1280;
export const DASHBOARD_CANVAS_HEIGHT = 860;

export function useDashboardScale(canvasWidth = DASHBOARD_CANVAS_WIDTH, horizontalInset = 32) {
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === "undefined" ? canvasWidth + horizontalInset * 2 : window.innerWidth,
    height: typeof window === "undefined" ? 900 : window.innerHeight
  }));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const scale = useMemo(() => {
    const next = (viewport.width - horizontalInset * 2) / canvasWidth;
    return Math.min(1, Math.max(0.24, next));
  }, [canvasWidth, horizontalInset, viewport.width]);

  return { viewport, scale, hydrated };
}

export function DashboardCanvas({
  children,
  canvasWidth = DASHBOARD_CANVAS_WIDTH,
  minCanvasHeight = DASHBOARD_CANVAS_HEIGHT,
  horizontalInset = 32,
  className = ""
}: {
  children: React.ReactNode;
  canvasWidth?: number;
  minCanvasHeight?: number;
  horizontalInset?: number;
  className?: string;
}) {
  const { scale } = useDashboardScale(canvasWidth, horizontalInset);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(minCanvasHeight);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const measure = () => setContentHeight(Math.max(minCanvasHeight, element.offsetHeight));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [minCanvasHeight]);

  return (
    <div
      className="relative w-full"
      style={{ minHeight: `${Math.max(windowHeightFallback(), Math.ceil(contentHeight * scale))}px` }}
    >
      <div
        className="absolute left-1/2 top-0"
        style={{
          width: `${canvasWidth}px`,
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: "top center"
        }}
      >
        <div ref={contentRef} className={className}>
          {children}
        </div>
      </div>
    </div>
  );
}

function windowHeightFallback() {
  if (typeof window === "undefined") return 900;
  return window.innerHeight;
}
