"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Globe2, LayoutGrid, Smile, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useConfigStore } from "@/store/config-store";

const items = [
  { href: "/", label: "首页", icon: null },
  { href: "/blog", label: "文章", icon: FileText },
  { href: "/projects", label: "项目", icon: LayoutGrid },
  { href: "/share", label: "分享", icon: Smile },
  { href: "/bloggers", label: "朋友", icon: Star },
  { href: "/about", label: "关于", icon: Globe2 }
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const siteContent = useConfigStore((state) => state.siteContent);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const activeHref = useMemo(() => items.find((item) => isActivePath(pathname, item.href))?.href || "", [pathname]);
  const highlightHref = hoveredHref || activeHref;

  return (
    <motion.nav
      initial={{ opacity: 0, scale: 0.8, y: -12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 360, damping: 30 }}
      onMouseLeave={() => setHoveredHref(null)}
      className="fixed left-1/2 top-3 z-40 flex -translate-x-1/2 items-center gap-4 rounded-[24px] border border-white/80 bg-white/58 px-4 py-3 shadow-[0_22px_44px_-30px_rgba(0,0,0,0.26),0_6px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);
        const highlighted = highlightHref === item.href;
        return (
          <motion.div
            key={item.href}
            whileHover={{ y: -2, scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 520, damping: 28 }}
          >
            <Link
              href={item.href}
              aria-label={item.label}
              title={item.label}
              onMouseEnter={() => setHoveredHref(item.href)}
              onFocus={() => setHoveredHref(item.href)}
              onBlur={() => setHoveredHref(null)}
              className={cn(
                "relative grid h-12 w-12 place-items-center rounded-[18px] text-[var(--color-secondary)] transition-colors duration-200",
                (highlighted || active) && "text-[var(--color-brand)]"
              )}
            >
              {highlighted && (
                <motion.span
                  layoutId="nav-highlight"
                  className="absolute inset-0 rounded-[18px] bg-white/88 shadow-[0_10px_22px_-14px_rgba(0,0,0,0.34)]"
                  transition={{ type: "spring", stiffness: 430, damping: 36 }}
                />
              )}
              {Icon ? (
                <Icon className="relative z-10 h-6 w-6 drop-shadow-[0_7px_7px_rgba(0,0,0,0.16)]" strokeWidth={1.72} />
              ) : (
                <span className="relative z-10 grid h-12 w-12 place-items-center rounded-full">
                  <img
                    src={siteContent.meta.favicon || "/favicon.png"}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover drop-shadow-[0_7px_8px_rgba(0,0,0,0.14)]"
                    draggable={false}
                  />
                </span>
              )}
            </Link>
          </motion.div>
        );
      })}
    </motion.nav>
  );
}
