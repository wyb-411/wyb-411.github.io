"use client";

import { Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { CatCursor } from "@/components/CatCursor";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { useAuthStore } from "@/store/auth-store";
import { useConfigStore } from "@/store/config-store";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const loadConfig = useConfigStore((state) => state.loadConfig);
  const siteContent = useConfigStore((state) => state.siteContent);
  const configDialogOpen = useConfigStore((state) => state.configDialogOpen);
  const setConfigDialogOpen = useConfigStore((state) => state.setConfigDialogOpen);
  const refreshAuthState = useAuthStore((state) => state.refreshAuthState);
  const isDashboard = pathname === "/";
  const isWriteRoute = pathname?.startsWith("/write");
  const isToolRoute = pathname?.startsWith("/image-toolbox");
  const hideChrome = isWriteRoute || isToolRoute;

  useEffect(() => {
    loadConfig();
    refreshAuthState();
  }, [loadConfig, refreshAuthState]);

  useEffect(() => {
    const open = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && (event.key === "," || event.key.toLowerCase() === "l")) {
        event.preventDefault();
        setConfigDialogOpen(true);
      }
    };
    window.addEventListener("keydown", open);
    return () => window.removeEventListener("keydown", open);
  }, [setConfigDialogOpen]);

  return (
    <>
      <div className="page-background" />
      {!isDashboard && !hideChrome && <Navbar />}
      {!siteContent.hideEditButton && !hideChrome && (
        <motion.button
          initial={{ opacity: 0, scale: 0.65 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setConfigDialogOpen(true)}
          className="fixed right-6 top-5 z-40 grid h-11 w-11 place-items-center rounded-full border border-white/70 bg-white/45 text-[var(--color-secondary)] shadow-[0_12px_34px_rgba(51,79,82,0.08)] backdrop-blur-xl transition-colors hover:text-[var(--color-brand)]"
          aria-label="打开设置"
          title="设置"
        >
          <Settings className="h-5 w-5" strokeWidth={1.8} />
        </motion.button>
      )}
      <main className="relative z-10 min-h-screen">{children}</main>
      <SettingsModal open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} />
      <CatCursor />
    </>
  );
}
