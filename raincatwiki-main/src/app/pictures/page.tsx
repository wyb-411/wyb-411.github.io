"use client";

import { motion } from "framer-motion";
import { CalendarDays, Image as ImageIcon } from "lucide-react";
import { usePublicJson } from "@/lib/data-hooks";
import { PageShell } from "@/components/shared/PageShell";
import type { PhotoItem } from "@/types";

export default function PicturesPage() {
  const { data } = usePublicJson<PhotoItem[]>("/photos/index.json", []);

  return (
    <PageShell
      eyebrow="Small album"
      title="Pictures"
      description="v0 只放一两个示例，先看看参考站式生活化照片墙效果。图片来自 public/photos/index.json。"
    >
      <div className="card relative min-h-[620px] overflow-hidden p-5 sm:p-8">
        <div className="absolute right-8 top-8 hidden rounded-full bg-white/45 px-4 py-2 text-sm text-secondary sm:flex sm:items-center sm:gap-2">
          <ImageIcon className="h-4 w-4" />
          {data.length} photos
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:relative lg:min-h-[520px] lg:grid-cols-none">
          {data.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, scale: 0.86, rotate: 0 }}
              animate={{ opacity: 1, scale: 1, rotate: item.rotate }}
              transition={{ delay: index * 0.08, type: "spring", stiffness: 140, damping: 18 }}
              className="bg-white/80 p-3 shadow-[0_22px_60px_rgba(51,79,82,0.12)] backdrop-blur-xl lg:absolute lg:w-[340px]"
              style={{ left: `${item.x}%`, top: `${item.y}%` }}
            >
              <img src={item.url} alt={item.description} className="h-60 w-full object-cover" />
              <div className="mt-3">
                <div className="flex items-center gap-1 text-xs text-secondary">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {item.date}
                </div>
                <p className="mt-2 text-sm leading-6">{item.description}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
