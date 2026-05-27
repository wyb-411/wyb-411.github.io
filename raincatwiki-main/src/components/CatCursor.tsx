"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Tap = { id: number; x: number; y: number };

export function CatCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [sleeping, setSleeping] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [visible, setVisible] = useState(false);
  const [taps, setTaps] = useState<Tap[]>([]);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches) return;
    const enablePageCursor = () => document.documentElement.classList.add("cat-cursor-enabled");
    const disablePageCursor = () => document.documentElement.classList.remove("cat-cursor-enabled");
    const clearSleepTimer = () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
    };
    const hideCursor = () => {
      setVisible(false);
      setSleeping(false);
      setClicking(false);
      clearSleepTimer();
      disablePageCursor();
    };
    const resetSleep = () => {
      setSleeping(false);
      clearSleepTimer();
      timer.current = window.setTimeout(() => setSleeping(true), 5000);
    };
    const isInsideViewport = (event: PointerEvent | MouseEvent) => {
      return event.clientX > 1 && event.clientY > 1 && event.clientX < window.innerWidth - 1 && event.clientY < window.innerHeight - 1;
    };
    const onMove = (event: PointerEvent) => {
      if (!isInsideViewport(event)) {
        hideCursor();
        return;
      }
      enablePageCursor();
      setVisible(true);
      setPosition({ x: event.clientX, y: event.clientY });
      resetSleep();
    };
    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) hideCursor();
    };
    const onMouseOut = (event: MouseEvent) => {
      if (!event.relatedTarget || !isInsideViewport(event)) hideCursor();
    };
    const onDown = () => {
      enablePageCursor();
      setClicking(true);
      window.setTimeout(() => setClicking(false), 160);
      resetSleep();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerout", onPointerOut);
    window.addEventListener("mouseout", onMouseOut);
    window.addEventListener("blur", hideCursor);
    document.addEventListener("mouseleave", hideCursor);
    document.addEventListener("pointerleave", hideCursor);
    document.documentElement.addEventListener("mouseleave", hideCursor);
    document.addEventListener("visibilitychange", hideCursor);
    return () => {
      disablePageCursor();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("blur", hideCursor);
      document.removeEventListener("mouseleave", hideCursor);
      document.removeEventListener("pointerleave", hideCursor);
      document.documentElement.removeEventListener("mouseleave", hideCursor);
      document.removeEventListener("visibilitychange", hideCursor);
      clearSleepTimer();
    };
  }, []);

  useEffect(() => {
    const onTouch = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      const id = Date.now();
      setTaps((items) => [...items, { id, x: touch.clientX, y: touch.clientY }]);
      window.setTimeout(() => setTaps((items) => items.filter((item) => item.id !== id)), 760);
    };
    window.addEventListener("touchstart", onTouch, { passive: true });
    return () => window.removeEventListener("touchstart", onTouch);
  }, []);

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] h-12 w-14 -translate-x-2 -translate-y-1 select-none"
        style={{ display: visible ? "block" : "none" }}
        animate={{
          x: position.x,
          y: position.y,
          scaleX: clicking ? 0.92 : 1,
          scaleY: clicking ? 0.86 : 1
        }}
        transition={{ type: "spring", damping: 28, stiffness: 520, mass: 0.35 }}
      >
        <CursorCat sleeping={sleeping} />
      </motion.div>
      <AnimatePresence>
        {taps.map((tap) => (
          <motion.div
            key={tap.id}
            className="pointer-events-none fixed z-[100] h-12 w-14"
            initial={{ x: tap.x - 18, y: tap.y - 18, scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <CursorCat sleeping={false} />
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
}

function CursorCat({ sleeping }: { sleeping: boolean }) {
  return (
    <div className="relative h-full w-full">
      <img
        src={sleeping ? "/images/cursor/cat-sleep.png" : "/images/cursor/cat-awake.png"}
        alt=""
        draggable={false}
        className={sleeping ? "h-full w-[72px] max-w-none object-contain" : "h-full w-full object-contain"}
      />
      {sleeping && (
        <motion.div
          className="absolute -right-6 -top-3 text-[10px] font-semibold text-[var(--color-secondary)]"
          animate={{ y: [-2, -10], opacity: [0, 1, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        >
          Zzz
        </motion.div>
      )}
    </div>
  );
}
