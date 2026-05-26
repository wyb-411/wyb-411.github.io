"use client";

import { motion } from "framer-motion";
import { Coffee, Heart, Mail, Sparkles } from "lucide-react";
import { MarkdownView } from "@/lib/markdown";
import { usePublicText } from "@/lib/data-hooks";
import { PageShell } from "@/components/shared/PageShell";
import { useConfigStore } from "@/store/config-store";

export default function AboutPage() {
  const { data } = usePublicText("/about/content.md", "");
  const site = useConfigStore((state) => state.siteContent);

  return (
    <PageShell
      eyebrow="About Raincat"
      title="About"
      description="生活化、可爱治愈、个人日记感。这里不讲太多技术，只把日常和喜欢的小东西轻轻放好。"
    >
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <motion.aside initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="card p-6 text-center lg:sticky lg:top-24 lg:self-start">
          <img src={site.meta.avatar} alt={site.meta.username} className="mx-auto h-32 w-32 rounded-full border border-white/70 object-cover shadow-[0_18px_48px_rgba(51,79,82,0.12)]" />
          <h2 className="font-averia mt-4 text-3xl">{site.meta.username}</h2>
          <p className="text-secondary mt-3 text-sm leading-7">{site.meta.description}</p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <TinyStat icon={<Coffee className="h-4 w-4" />} label="Tea" />
            <TinyStat icon={<Sparkles className="h-4 w-4" />} label="Diary" />
            <TinyStat icon={<Heart className="h-4 w-4" />} label="Cute" />
          </div>
          <a href="mailto:hello@example.com" className="brand-btn mt-5 inline-flex h-10 items-center gap-2 px-4 text-sm">
            <Mail className="h-4 w-4" />
            Say hi
          </a>
        </motion.aside>
        <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card bg-article p-5 sm:p-8">
          <MarkdownView markdown={data} />
        </motion.article>
      </div>
    </PageShell>
  );
}

function TinyStat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-3xl bg-white/45 p-3 text-secondary">
      <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-white/60 text-[var(--color-brand)]">{icon}</div>
      <div className="mt-2 text-xs">{label}</div>
    </div>
  );
}
