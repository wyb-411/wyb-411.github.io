"use client";

import { cn } from "@/lib/utils";
import { socialPlatformMap } from "@/lib/social";
import type { SocialIcon } from "@/types";

export function SocialMark({ icon, className }: { icon: SocialIcon; className?: string }) {
  const platform = socialPlatformMap[icon] || socialPlatformMap.link;
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-[9px] text-[11px] font-bold leading-none", className)}
      style={{ backgroundColor: platform.color, color: platform.textColor }}
      aria-hidden="true"
    >
      {platform.short}
    </span>
  );
}
