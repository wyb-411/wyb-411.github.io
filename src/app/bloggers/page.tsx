"use client";

import Fuse from "fuse.js";
import { motion } from "framer-motion";
import { ExternalLink, HeartHandshake, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { usePublicJson } from "@/lib/data-hooks";
import { EmptyCard, PageShell, SearchInput, SegmentedControl } from "@/components/shared/PageShell";
import type { BloggerItem } from "@/types";

export default function BloggersPage() {
  const { data } = usePublicJson<BloggerItem[]>("/bloggers/index.json", []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | "blog" | "link">("all");
  const items = useMemo(() => {
    const base = category === "all" ? data : data.filter((item) => item.category === category);
    if (!query.trim()) return base;
    return new Fuse(base, { keys: ["name", "description"], threshold: 0.36 }).search(query).map((item) => item.item);
  }, [data, query, category]);

  return (
    <PageShell
      eyebrow="Neighbor sites"
      title="Friends"
      description="友链和喜欢的博客。先放占位链接，后续直接改 public/bloggers/index.json。"
      actions={<SearchInput value={query} onChange={setQuery} placeholder="搜索朋友" />}
    >
      <div className="mb-6">
        <SegmentedControl
          value={category}
          onChange={setCategory}
          options={[
            { value: "all", label: "全部" },
            { value: "blog", label: "博客" },
            { value: "link", label: "友链" }
          ]}
        />
      </div>
      {items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <motion.a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="card group p-5"
            >
              <div className="flex items-center gap-4">
                <img src={item.avatar} alt={item.name} className="h-16 w-16 rounded-full border border-white/70 object-cover shadow-sm" />
                <div className="min-w-0">
                  <h2 className="font-averia line-clamp-1 text-2xl">{item.name}</h2>
                  <div className="mt-1 flex items-center gap-1 text-xs text-amber-500">
                    {Array.from({ length: item.stars }).map((_, star) => <Star key={star} className="h-3.5 w-3.5 fill-amber-300" />)}
                  </div>
                </div>
              </div>
              <p className="text-secondary mt-4 min-h-12 text-sm leading-6">{item.description}</p>
              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 text-[var(--color-brand)]"><HeartHandshake className="h-4 w-4" />{item.category}</span>
                <span className="inline-flex items-center gap-1 text-secondary transition group-hover:text-[var(--color-brand)]"><ExternalLink className="h-4 w-4" />访问</span>
              </div>
            </motion.a>
          ))}
        </div>
      ) : (
        <EmptyCard title="No friends" description="没有找到匹配的友链。" />
      )}
    </PageShell>
  );
}
