"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpenText, CalendarDays, CheckCircle2, Edit3, Layers3, Tag, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePublicJson } from "@/lib/data-hooks";
import { cn } from "@/lib/utils";
import { PageShell, SearchInput, SegmentedControl } from "@/components/shared/PageShell";
import type { BlogIndexItem } from "@/types";

type GroupMode = "day" | "week" | "month" | "year" | "category";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function groupKey(item: BlogIndexItem, mode: GroupMode) {
  const date = new Date(item.date);
  if (mode === "category") return item.category || "未分类";
  if (mode === "year") return `${date.getFullYear()}`;
  if (mode === "month") return `${date.getFullYear()} / ${String(date.getMonth() + 1).padStart(2, "0")}`;
  if (mode === "week") {
    const start = new Date(date);
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);
    return `${start.getFullYear()} / Week ${Math.ceil((Number(start) - Number(new Date(start.getFullYear(), 0, 1))) / 604800000) + 1}`;
  }
  return `${date.getFullYear()} / ${String(date.getMonth() + 1).padStart(2, "0")} / ${String(date.getDate()).padStart(2, "0")}`;
}

export function BlogListClient() {
  const { data } = usePublicJson<BlogIndexItem[]>("/blogs/index.json", []);
  const [query, setQuery] = useState("");
  const [groupMode, setGroupMode] = useState<GroupMode>("month");
  const [readSlugs, setReadSlugs] = useState<string[]>([]);

  useEffect(() => {
    try {
      setReadSlugs(JSON.parse(localStorage.getItem("raincat-read-articles") || "[]"));
    } catch {
      setReadSlugs([]);
    }
  }, []);

  const articles = useMemo(() => {
    const visible = data.filter((item) => !item.hidden).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    if (!query.trim()) return visible;
    const fuse = new Fuse(visible, { keys: ["title", "summary", "tags", "category"], threshold: 0.36 });
    return fuse.search(query.trim()).map((item) => item.item);
  }, [data, query]);

  const groups = useMemo(() => {
    const map = new Map<string, BlogIndexItem[]>();
    articles.forEach((item) => {
      const key = groupKey(item, groupMode);
      map.set(key, [...(map.get(key) || []), item]);
    });
    return Array.from(map.entries());
  }, [articles, groupMode]);

  const markRead = (slug: string) => {
    const next = Array.from(new Set([...readSlugs, slug]));
    setReadSlugs(next);
    localStorage.setItem("raincat-read-articles", JSON.stringify(next));
  };

  return (
    <PageShell
      eyebrow="Raincat notes"
      title="Blog"
      description="按参考站逻辑从仓库 Markdown / JSON 读取文章。这里先放一两篇示例，之后可以直接在站内写作页发布。"
      actions={
        <>
          <Link href="/write/new" className="brand-btn flex h-11 items-center gap-2 px-4 text-sm">
            <Edit3 className="h-4 w-4" />
            新增文章
          </Link>
          <SearchInput value={query} onChange={setQuery} placeholder="搜索标题、标签、分类" />
        </>
      }
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-secondary">
          <Search className="h-4 w-4" />
          {articles.length} 篇可见文章
        </div>
        <SegmentedControl
          value={groupMode}
          onChange={setGroupMode}
          options={[
            { value: "day", label: "日" },
            { value: "week", label: "周" },
            { value: "month", label: "月" },
            { value: "year", label: "年" },
            { value: "category", label: "分类" }
          ]}
        />
      </div>
      <div className="space-y-6">
        {groups.map(([label, items], groupIndex) => (
          <motion.section
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.04 }}
            className="card p-4 sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-[var(--color-brand)]" />
                <h2 className="font-averia text-2xl">{label}</h2>
              </div>
              <span className="rounded-full bg-white/55 px-3 py-1 text-xs text-secondary">{items.length}</span>
            </div>
            <div className="grid gap-3">
              {items.map((item) => {
                const read = readSlugs.includes(item.slug);
                return (
                  <Link
                    href={`/blog/${item.slug}`}
                    key={item.slug}
                    onClick={() => markRead(item.slug)}
                    className="group grid gap-4 rounded-[28px] bg-white/42 p-3 transition hover:bg-white/70 sm:grid-cols-[140px_1fr_auto] sm:items-center"
                  >
                    <div className="h-28 overflow-hidden rounded-[22px] bg-white/60 sm:h-24">
                      <img src={item.cover || "/images/art/rain-window.svg"} alt={item.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-secondary">
                        <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(item.date)}</span>
                        {item.category && <span className="inline-flex items-center gap-1"><Tag className="h-3.5 w-3.5" />{item.category}</span>}
                        {read && <span className="inline-flex items-center gap-1 text-[var(--color-brand)]"><CheckCircle2 className="h-3.5 w-3.5" />已读</span>}
                      </div>
                      <h3 className="mt-2 line-clamp-2 text-lg font-semibold">{item.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-secondary">{item.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-white/55 px-2.5 py-1 text-[11px] text-secondary">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="hidden h-11 w-11 place-items-center rounded-full bg-white/55 text-[var(--color-brand)] transition group-hover:translate-x-1 sm:grid">
                      <BookOpenText className="h-5 w-5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.section>
        ))}
        {!groups.length && (
          <div className="card p-10 text-center text-secondary">没有找到符合条件的文章。</div>
        )}
      </div>
    </PageShell>
  );
}
