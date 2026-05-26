"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Edit3, Eye, Heart, ListTree, Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MarkdownView, parseToc } from "@/lib/markdown";
import { usePublicJson, usePublicText } from "@/lib/data-hooks";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/shared/PageShell";
import { useConfigStore } from "@/store/config-store";
import type { BlogConfig } from "@/types";

function formatLongDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function BlogDetailClient() {
  const params = useParams<{ slug: string }>();
  const slug = useMemo(() => decodeURIComponent(params.slug || ""), [params.slug]);
  const hideEditButton = useConfigStore((state) => state.siteContent.hideEditButton);
  const { data: config, loading: configLoading } = usePublicJson<BlogConfig | null>(`/blogs/${slug}/config.json`, null);
  const { data: markdown, loading: markdownLoading } = usePublicText(`/blogs/${slug}/index.md`, "");
  const toc = useMemo(() => parseToc(markdown), [markdown]);
  const [liked, setLiked] = useState(false);
  const [views, setViews] = useState(0);

  useEffect(() => {
    const key = `raincat-views-${slug}`;
    const next = Number(localStorage.getItem(key) || "0") + 1;
    localStorage.setItem(key, String(next));
    setViews(next);
    try {
      const readKey = "raincat-read-articles";
      const read = JSON.parse(localStorage.getItem(readKey) || "[]") as string[];
      localStorage.setItem(readKey, JSON.stringify(Array.from(new Set([...read, slug]))));
    } catch {
      localStorage.setItem("raincat-read-articles", JSON.stringify([slug]));
    }
  }, [slug]);

  if (!configLoading && !markdownLoading && !config && !markdown) {
    return (
      <PageShell eyebrow="Article" title="文章没有找到" description="这个 slug 还没有对应的 config.json / index.md。">
        <Link href="/blog" className="brand-btn inline-flex h-11 items-center gap-2 px-4 text-sm">
          <ArrowLeft className="h-4 w-4" />
          返回文章列表
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow={config?.category || "Raincat note"}
      title={config?.title || "Loading..."}
      description={config?.summary || "文章正在从仓库文件中读取。"}
      actions={
        <>
          <Link href="/blog" className="rounded-full border border-white/70 bg-white/50 px-4 py-2 text-sm backdrop-blur-xl">
            返回
          </Link>
          {!hideEditButton && (
            <Link href={`/write/${slug}`} className="brand-btn flex h-10 items-center gap-2 px-4 text-sm">
              <Edit3 className="h-4 w-4" />
              编辑
            </Link>
          )}
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card overflow-hidden bg-article"
        >
          {config?.cover && (
            <div className="h-64 overflow-hidden border-b border-white/50 sm:h-80">
              <img src={config.cover} alt={config.title} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="p-5 sm:p-9">
            <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-secondary">
              {config?.date && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{formatLongDate(config.date)}</span>}
              <span className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />{views} views</span>
              <button
                onClick={() => setLiked(true)}
                className={cn("inline-flex items-center gap-1.5 rounded-full bg-white/55 px-2.5 py-1", liked && "text-rose-500")}
              >
                <Heart className={cn("h-3.5 w-3.5", liked && "fill-rose-400")} />
                {liked ? "liked" : "like"}
              </button>
            </div>
            {config?.tags?.length ? (
              <div className="mb-7 flex flex-wrap gap-2">
                {config.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-white/55 px-3 py-1 text-xs text-secondary">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            {markdownLoading ? (
              <div className="text-secondary">Markdown 加载中...</div>
            ) : (
              <MarkdownView markdown={markdown} />
            )}
          </div>
        </motion.article>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2 font-medium">
              <ListTree className="h-4 w-4 text-[var(--color-brand)]" />
              Contents
            </div>
            <div className="space-y-2 text-sm">
              {toc.length ? toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block rounded-xl px-3 py-2 text-secondary transition hover:bg-white/55 hover:text-[var(--color-brand)]"
                  style={{ paddingLeft: 12 + (item.level - 1) * 12 }}
                >
                  {item.text}
                </a>
              )) : <span className="text-secondary">暂无目录</span>}
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
