"use client";

import Fuse from "fuse.js";
import { motion } from "framer-motion";
import { ExternalLink, Heart, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { usePublicJson } from "@/lib/data-hooks";
import { EmptyCard, PageShell, SearchInput, SegmentedControl } from "@/components/shared/PageShell";
import type { ShareItem } from "@/types";

export default function SharePage() {
  const { data } = usePublicJson<ShareItem[]>("/share/index.json", []);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("all");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const tags = useMemo(() => Array.from(new Set(data.flatMap((item) => item.tags))), [data]);
  const items = useMemo(() => {
    const base = tag === "all" ? data : data.filter((item) => item.tags.includes(tag));
    if (!query.trim()) return base;
    return new Fuse(base, { keys: ["name", "description", "tags"], threshold: 0.36 }).search(query).map((item) => item.item);
  }, [data, query, tag]);

  return (
    <PageShell
      eyebrow="Bookmarks"
      title="Share"
      description="一些可收藏的链接、工具和灵感。这里的浏览/喜欢/星标先做前端互动，内容本体来自仓库 JSON。"
      actions={<SearchInput value={query} onChange={setQuery} placeholder="搜索分享" />}
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl value={tag} onChange={setTag} options={[{ value: "all", label: "全部" }, ...tags.map((item) => ({ value: item, label: item }))]} />
        <div className="flex items-center gap-2 text-sm text-secondary"><Search className="h-4 w-4" />{items.length} 条</div>
      </div>
      {items.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="card p-5"
            >
              <div className="flex items-start gap-4">
                <img src={item.logo} alt={item.name} className="h-16 w-16 rounded-3xl bg-white/55 object-cover p-1" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-averia line-clamp-1 text-2xl">{item.name}</h2>
                  <p className="text-secondary mt-2 line-clamp-2 text-sm leading-6">{item.description}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((name) => <span key={name} className="rounded-full bg-white/55 px-3 py-1 text-xs text-secondary">{name}</span>)}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <a href={item.url} target="_blank" rel="noreferrer" className="brand-btn flex h-10 items-center gap-2 px-4 text-sm">
                  <ExternalLink className="h-4 w-4" />
                  打开
                </a>
                <button className="flex h-10 items-center gap-2 rounded-full bg-white/60 px-4 text-sm">
                  <Star className="h-4 w-4 text-amber-400" />
                  {item.stars}
                </button>
                <button
                  onClick={() => setLiked((value) => ({ ...value, [item.id]: true }))}
                  className="flex h-10 items-center gap-2 rounded-full bg-white/60 px-4 text-sm"
                >
                  <Heart className={liked[item.id] ? "h-4 w-4 fill-rose-400 text-rose-400" : "h-4 w-4 text-rose-300"} />
                  {(item.likes || 0) + (liked[item.id] ? 1 : 0)}
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <EmptyCard title="No shares" description="没有找到匹配的收藏。" />
      )}
    </PageShell>
  );
}
