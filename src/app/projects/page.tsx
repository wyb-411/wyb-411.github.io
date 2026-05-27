"use client";

import Fuse from "fuse.js";
import { motion } from "framer-motion";
import { Code2, ExternalLink, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { usePublicJson } from "@/lib/data-hooks";
import { EmptyCard, PageShell, SearchInput, SegmentedControl } from "@/components/shared/PageShell";
import type { ProjectItem } from "@/types";

export default function ProjectsPage() {
  const { data } = usePublicJson<ProjectItem[]>("/projects/index.json", []);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const years = useMemo(() => Array.from(new Set(data.map((item) => String(item.year)))).sort((a, b) => Number(b) - Number(a)), [data]);
  const projects = useMemo(() => {
    const base = year === "all" ? data : data.filter((item) => String(item.year) === year);
    if (!query.trim()) return base;
    return new Fuse(base, { keys: ["name", "description", "tags"], threshold: 0.36 }).search(query).map((item) => item.item);
  }, [data, query, year]);

  return (
    <PageShell
      eyebrow="Things I made"
      title="Projects"
      description="一些作品和小实验。数据来自 public/projects/index.json，后续可以直接改仓库文件。"
      actions={<SearchInput value={query} onChange={setQuery} placeholder="搜索项目" />}
    >
      <div className="mb-6">
        <SegmentedControl value={year} onChange={setYear} options={[{ value: "all", label: "全部" }, ...years.map((item) => ({ value: item, label: item }))]} />
      </div>
      {projects.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {projects.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="card overflow-hidden"
            >
              <div className="h-52 overflow-hidden">
                <img src={item.cover} alt={item.name} className="h-full w-full object-cover transition duration-300 hover:scale-105" />
              </div>
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="font-averia text-2xl">{item.name}</h2>
                  <span className="rounded-full bg-white/55 px-3 py-1 text-xs text-secondary">{item.year}</span>
                </div>
                <p className="text-secondary min-h-12 text-sm leading-6">{item.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.tags.map((tag) => <span key={tag} className="rounded-full bg-white/55 px-3 py-1 text-xs text-secondary">{tag}</span>)}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {item.websiteUrl && <a href={item.websiteUrl} target="_blank" rel="noreferrer" className="brand-btn flex h-10 items-center gap-2 px-4 text-sm"><ExternalLink className="h-4 w-4" />访问</a>}
                  {item.githubUrl && <a href={item.githubUrl} target="_blank" rel="noreferrer" className="flex h-10 items-center gap-2 rounded-full bg-white/60 px-4 text-sm"><Code2 className="h-4 w-4" />GitHub</a>}
                  <button className="flex h-10 items-center gap-2 rounded-full bg-white/60 px-4 text-sm"><Star className="h-4 w-4 text-amber-400" />Star</button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <EmptyCard title="No projects" description="没有找到匹配的项目。" />
      )}
    </PageShell>
  );
}
