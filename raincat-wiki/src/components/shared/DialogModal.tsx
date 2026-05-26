"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function DialogModal({
  open,
  onClose,
  children,
  className,
  disableCloseOnOverlay
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  disableCloseOnOverlay?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 p-4 backdrop-blur-xl"
          onClick={disableCloseOnOverlay ? undefined : onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.82, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.82, y: 20 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn("static", className)}
            onClick={(event) => event.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
