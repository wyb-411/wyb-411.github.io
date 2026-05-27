"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronDown, KeyRound, Send, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MarkdownView, parseToc } from "@/lib/markdown";
import { usePublicJson, usePublicText } from "@/lib/data-hooks";
import { commitFiles, getAuthToken, hasGithubAppConfig, listRepoFilesRecursive } from "@/lib/github";
import { fileToBase64NoPrefix, hashFileSHA256, readFileAsText } from "@/lib/files";
import { cn, fileExt, uid } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useConfigStore } from "@/store/config-store";
import type { BlogConfig, BlogIndexItem, WriteImage } from "@/types";

type Mode = "edit" | "preview";

const WRITE_CANVAS_WIDTH = 1152;
const WRITE_CANVAS_HEIGHT = 812;
const HORIZONTAL_INSET = 24;
const TOP_SPACE = 118;
const BOTTOM_SPACE = 24;
const starterMarkdown = "";
const editorSpring = { duration: 0.24, ease: [0.24, 0.88, 0.32, 1] as const };
const defaultCategories = ["未分类", "代码实现", "总结", "开源"];

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "new-post";
}

function nowForInput() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function formatPreviewDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}年 ${date.getMonth() + 1}月 ${date.getDate()}日`;
}

function resetImages(items: WriteImage[]) {
  for (const image of items) {
    if (image.type === "file") URL.revokeObjectURL(image.previewUrl);
  }
}

function useWriteCanvasScale() {
  const [viewport, setViewport] = useState({
    width: WRITE_CANVAS_WIDTH + HORIZONTAL_INSET * 2,
    height: 900
  });

  useEffect(() => {
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const scale = useMemo(() => {
    const widthScale = (viewport.width - HORIZONTAL_INSET * 2) / WRITE_CANVAS_WIDTH;
    const heightScale = (viewport.height - TOP_SPACE - BOTTOM_SPACE) / WRITE_CANVAS_HEIGHT;
    return Math.min(1, Math.max(0.28, Math.min(widthScale, heightScale)));
  }, [viewport.height, viewport.width]);

  return { scale };
}

function parseTagValue(value: string) {
  return value.trim().replace(/^#+/, "").replace(/[，,]+$/g, "").slice(0, 24);
}

export function WriteEditor() {
  const params = useParams<{ slug: string }>();
  const routeSlug = useMemo(() => decodeURIComponent(params.slug || "new"), [params.slug]);
  const isNew = routeSlug === "new";
  const router = useRouter();
  const { scale } = useWriteCanvasScale();
  const siteContent = useConfigStore((state) => state.siteContent);
  const isAuth = useAuthStore((state) => state.isAuth);
  const setPrivateKey = useAuthStore((state) => state.setPrivateKey);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mdInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);
  const imagesRef = useRef<WriteImage[]>([]);

  const { data: index } = usePublicJson<BlogIndexItem[]>("/blogs/index.json", []);
  const { data: categoriesData } = usePublicJson<{ categories: string[] }>("/blogs/categories.json", { categories: [] });
  const { data: existingConfig } = usePublicJson<BlogConfig | null>(
    isNew ? "/__raincat-missing-config.json" : `/blogs/${routeSlug}/config.json`,
    null
  );
  const { data: existingMarkdown } = usePublicText(isNew ? "/__raincat-missing-index.md" : `/blogs/${routeSlug}/index.md`, "");

  const [mode, setMode] = useState<Mode>("edit");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState(isNew ? "" : routeSlug);
  const [summary, setSummary] = useState("");
  const [cover, setCover] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [category, setCategory] = useState("");
  const [datetime, setDatetime] = useState("");
  const [hidden, setHidden] = useState(false);
  const [markdown, setMarkdown] = useState(starterMarkdown);
  const [images, setImages] = useState<WriteImage[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  const appReady = hasGithubAppConfig();
  const normalizedSlug = slugify(slug);
  const toc = useMemo(() => parseToc(markdown), [markdown]);
  const previewTitle = title.trim() || "Untitled";
  const previewDate = formatPreviewDate(datetime);
  const coverPreview = cover.trim();
  const actionLabel = !appReady || !isAuth ? "导入密钥" : pending ? "处理中..." : isNew ? "发布" : "保存";
  const categoryOptions = useMemo(
    () => Array.from(new Set([...defaultCategories, ...categoriesData.categories, category].filter(Boolean))),
    [categoriesData.categories, category]
  );

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => resetImages(imagesRef.current);
  }, []);

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(""), 2200);
    return () => window.clearTimeout(id);
  }, [message]);

  useEffect(() => {
    initialized.current = false;
    resetImages(imagesRef.current);
    imagesRef.current = [];
    setMode("edit");
    setTitle("");
    setSlug(isNew ? "" : routeSlug);
    setSummary("");
    setCover("");
    setTags([]);
    setTagInput("");
    setCategory("");
    setDatetime(nowForInput());
    setHidden(false);
    setMarkdown(starterMarkdown);
    setImages([]);
    setImageUrl("");
    setPending(false);
    setMessage("");
  }, [isNew, routeSlug]);

  useEffect(() => {
    if (initialized.current) return;
    if (isNew) {
      initialized.current = true;
      return;
    }
    if (!existingConfig && !existingMarkdown) return;
    setTitle(existingConfig?.title || "");
    setSummary(existingConfig?.summary || "");
    setCover(existingConfig?.cover || "");
    setTags(existingConfig?.tags || []);
    setCategory(existingConfig?.category || "");
    setHidden(Boolean(existingConfig?.hidden));
    if (existingConfig?.date) {
      const date = new Date(existingConfig.date);
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
      setDatetime(date.toISOString().slice(0, 16));
    }
    if (existingMarkdown) setMarkdown(existingMarkdown);
    initialized.current = true;
  }, [existingConfig, existingMarkdown, isNew]);

  const showMessage = (next: string) => setMessage(next);

  const addTag = (raw: string) => {
    const value = parseTagValue(raw);
    if (!value) return false;
    setTags((current) => {
      if (current.some((item) => item.toLowerCase() === value.toLowerCase())) return current;
      return [...current, value];
    });
    return true;
  };

  const removeTag = (target: string) => {
    setTags((current) => current.filter((item) => item !== target));
  };

  const importPem = async (file?: File) => {
    if (!file) return;
    await setPrivateKey(await readFileAsText(file), siteContent.isCachePem);
    showMessage("已导入密钥");
  };

  const importMarkdown = async (file?: File) => {
    if (!file) return;
    setMarkdown(await readFileAsText(file));
    showMessage("已导入 MD");
  };

  const addImages = async (files?: FileList | null) => {
    if (!files?.length) return;
    const next: WriteImage[] = [];
    const seen = new Set(
      images.filter((image) => image.type === "file").map((image) => `${image.hash}:${image.file.name.toLowerCase()}`)
    );
    for (const file of Array.from(files)) {
      const hash = await hashFileSHA256(file);
      const dedupeKey = `${hash}:${file.name.toLowerCase()}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      next.push({ id: uid("img"), type: "file", file, previewUrl: URL.createObjectURL(file), hash });
    }
    if (!next.length) {
      showMessage("图片已存在");
      return;
    }
    setImages((items) => [...items, ...next]);
    showMessage(`已添加 ${next.length} 张图片`);
  };

  const uploadCover = async (file?: File) => {
    if (!file) return;
    const hash = await hashFileSHA256(file);
    const ext = fileExt(file.name) || ".png";
    const finalUrl = `/blogs/${normalizedSlug}/images/${hash}${ext}`;
    setCover(finalUrl);
    setImages((items) => {
      const exists = items.some(
        (image) => image.type === "file" && image.hash === hash && image.file.name.toLowerCase() === file.name.toLowerCase()
      );
      if (exists) return items;
      return [...items, { id: uid("img"), type: "file", file, previewUrl: URL.createObjectURL(file), hash }];
    });
    showMessage("已设置封面");
  };

  const addImageUrl = () => {
    const url = imageUrl.trim();
    if (!url) return;
    setImages((items) => [...items, { id: uid("img"), type: "url", url }]);
    setImageUrl("");
    showMessage("已添加图片");
  };

  const removeImage = (id: string) => {
    setImages((items) => {
      const target = items.find((image) => image.id === id);
      if (target?.type === "file") URL.revokeObjectURL(target.previewUrl);
      return items.filter((image) => image.id !== id);
    });
  };

  const imageFinalUrl = (image: WriteImage, targetSlug: string) => {
    if (image.type !== "file") return image.url;
    const ext = fileExt(image.file.name) || ".png";
    return `/blogs/${targetSlug}/images/${image.hash || uid("image")}${ext}`;
  };

  const insertMarkdown = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMarkdown((value) => `${value}\n${text}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setMarkdown((value) => `${value.slice(0, start)}${text}${value.slice(end)}`);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const publish = async () => {
    if (!appReady) {
      showMessage("请先配置 GitHub App");
      return;
    }
    if (!isAuth) {
      fileInputRef.current?.click();
      return;
    }
    if (!title.trim()) {
      showMessage("标题不能为空");
      return;
    }
    setPending(true);
    try {
      const finalSlug = normalizedSlug;
      const config: BlogConfig = {
        title: title.trim(),
        date: new Date(datetime || nowForInput()).toISOString(),
        summary: summary.trim() || markdown.replace(/[#>*_\-\[\]()`]/g, "").trim().slice(0, 120),
        tags,
        category: category.trim() || "未分类",
        cover: cover.trim(),
        hidden
      };
      const indexItem: BlogIndexItem = { slug: finalSlug, ...config };
      const nextIndex = [...index.filter((item) => item.slug !== routeSlug && item.slug !== finalSlug), indexItem].sort(
        (a, b) => Date.parse(b.date) - Date.parse(a.date)
      );
      const nextCategories = Array.from(new Set(nextIndex.map((item) => item.category).filter(Boolean)));
      const deletes: string[] = [];
      if (!isNew && routeSlug !== finalSlug) {
        const token = await getAuthToken();
        deletes.push(...(await listRepoFilesRecursive(token, `public/blogs/${routeSlug}`)));
      }
      const files: Array<{ path: string; content: string; encoding?: "base64" | "utf-8" }> = [
        { path: `public/blogs/${finalSlug}/index.md`, content: markdown, encoding: "utf-8" },
        { path: `public/blogs/${finalSlug}/config.json`, content: JSON.stringify(config, null, 2) + "\n", encoding: "utf-8" },
        { path: "public/blogs/index.json", content: JSON.stringify(nextIndex, null, 2) + "\n", encoding: "utf-8" },
        { path: "public/blogs/categories.json", content: JSON.stringify({ categories: nextCategories }, null, 2) + "\n", encoding: "utf-8" }
      ];
      for (const image of images) {
        if (image.type !== "file") continue;
        const ext = fileExt(image.file.name) || ".png";
        files.push({
          path: `public/blogs/${finalSlug}/images/${image.hash || uid("image")}${ext}`,
          content: await fileToBase64NoPrefix(image.file),
          encoding: "base64"
        });
      }
      await commitFiles(`${isNew ? "feat" : "docs"}: publish ${finalSlug}`, files, deletes);
      router.push(`/blog/${finalSlug}`);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "发布失败");
    } finally {
      setPending(false);
    }
  };

  const deleteArticle = async () => {
    if (isNew) return;
    if (!appReady) {
      showMessage("请先配置 GitHub App");
      return;
    }
    if (!isAuth) {
      fileInputRef.current?.click();
      return;
    }
    if (!window.confirm("确认删除这篇文章吗？")) return;
    setPending(true);
    try {
      const token = await getAuthToken();
      const deletes = await listRepoFilesRecursive(token, `public/blogs/${routeSlug}`);
      const nextIndex = index.filter((item) => item.slug !== routeSlug);
      const nextCategories = Array.from(new Set(nextIndex.map((item) => item.category).filter(Boolean)));
      const files = [
        { path: "public/blogs/index.json", content: JSON.stringify(nextIndex, null, 2) + "\n", encoding: "utf-8" as const },
        { path: "public/blogs/categories.json", content: JSON.stringify({ categories: nextCategories }, null, 2) + "\n", encoding: "utf-8" as const }
      ];
      await commitFiles(`docs: delete ${routeSlug}`, files, deletes);
      router.push("/blog");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "删除失败");
    } finally {
      setPending(false);
    }
  };

  const cardClass =
    "rounded-[30px] border border-white/75 bg-white/[0.5] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_18px_42px_rgba(51,79,82,0.055)] backdrop-blur-[15px]";
  const fieldClass =
    "h-[42px] w-full rounded-[14px] border border-white/70 bg-white/[0.48] px-4 text-[13px] text-[var(--color-primary)] placeholder:text-[#a3afb4] shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] outline-none";
  const fieldTextareaClass =
    "w-full rounded-[16px] border border-white/70 bg-white/[0.48] px-4 py-3 text-[13px] text-[var(--color-primary)] placeholder:text-[#a3afb4] shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] outline-none";
  const softButtonClass =
    "rounded-[14px] border border-white/72 bg-white/58 px-4 py-[10px] text-[13px] font-medium text-[var(--color-primary)] shadow-[0_10px_26px_rgba(51,79,82,0.045)] backdrop-blur-xl";

  return (
    <div className="font-ui-cute relative h-screen overflow-hidden px-4 pt-4 sm:px-6">
      <input ref={fileInputRef} type="file" accept=".pem,.key,text/*" className="hidden" onChange={(event) => importPem(event.target.files?.[0])} />
      <input
        ref={mdInputRef}
        type="file"
        accept=".md,.markdown,text/markdown,text/plain"
        className="hidden"
        onChange={(event) => importMarkdown(event.target.files?.[0])}
      />
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => addImages(event.target.files)} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => uploadCover(event.target.files?.[0])} />

      <Link
        href="/"
        className={cn(
          cardClass,
          "fixed left-4 top-4 z-30 flex h-[64px] w-[64px] items-center justify-center rounded-[22px] p-2 sm:left-6"
        )}
      >
        <img src={siteContent.meta.avatar} alt={siteContent.meta.username} className="h-[42px] w-[42px] rounded-full object-cover" />
      </Link>

      <div className="fixed right-4 top-4 z-30 flex flex-wrap items-center justify-end gap-2 sm:right-6">
        {mode === "edit" ? (
          <>
            {!isNew ? (
              <>
                <button className="rounded-[14px] border border-[#6aa6ff]/28 bg-white/62 px-4 py-[10px] text-[13px] font-medium text-[#4e7cff] shadow-[0_10px_26px_rgba(51,79,82,0.045)] backdrop-blur-xl">
                  编辑模式
                </button>
                <button
                  className="rounded-[14px] border border-rose-200 bg-white/62 px-4 py-[10px] text-[13px] font-medium text-rose-500 shadow-[0_10px_26px_rgba(51,79,82,0.045)] backdrop-blur-xl"
                  disabled={pending}
                  onClick={deleteArticle}
                >
                  删除
                </button>
                <button className={softButtonClass} onClick={() => router.push(`/blog/${routeSlug}`)}>
                  取消
                </button>
              </>
            ) : null}
            <button className={softButtonClass} onClick={() => mdInputRef.current?.click()}>
              导入 MD
            </button>
            <button className={softButtonClass} onClick={() => setMode("preview")}>
              预览
            </button>
            <button className="brand-btn flex h-[42px] items-center gap-1 px-5 text-[13px] font-medium" disabled={pending} onClick={publish}>
              {!isAuth && <KeyRound className="h-4 w-4" />}
              {isAuth && pending && <Send className="h-4 w-4" />}
              {actionLabel}
            </button>
          </>
        ) : (
          <button className={softButtonClass} onClick={() => setMode("edit")}>
            关闭预览
          </button>
        )}
      </div>

      <div className="relative h-[calc(100vh-88px)] overflow-hidden pt-20">
        <div className="absolute inset-x-0 top-4 bottom-0 overflow-hidden">
          <div
            className="absolute left-1/2 top-0"
            style={{
              width: `${WRITE_CANVAS_WIDTH}px`,
              height: `${WRITE_CANVAS_HEIGHT}px`,
              transform: `translateX(-50%) scale(${scale})`,
              transformOrigin: "top center"
            }}
          >
            {mode === "edit" ? (
              <div className="flex h-full gap-6">
                <motion.section
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={editorSpring}
                  className={cn(cardClass, "flex h-full w-[806px] flex-col p-6")}
                >
                  <div className="mb-3 flex gap-3">
                    <input
                      type="text"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      onBlur={() => isNew && setSlug(slugify(title))}
                      placeholder="标题"
                      className={cn(fieldClass, "flex-1")}
                    />
                    <input
                      type="text"
                      value={slug}
                      onChange={(event) => setSlug(event.target.value)}
                      placeholder="slug（xx-xx）"
                      className={cn(fieldClass, "w-[200px]")}
                    />
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={markdown}
                    onChange={(event) => setMarkdown(event.target.value)}
                    placeholder="Markdown 内容"
                    spellCheck={false}
                    className="h-full w-full resize-none rounded-[20px] border border-white/70 bg-white/[0.48] px-4 py-4 text-[13px] leading-[2.05] text-[var(--color-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] outline-none placeholder:text-[#a3afb4]"
                  />
                </motion.section>

                <div className="w-[320px] space-y-5">
                  <motion.section
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ ...editorSpring, delay: 0.02 }}
                    className={cn(cardClass, "p-5")}
                  >
                    <h2 className="text-[15px] font-medium text-[var(--color-primary)]">封面</h2>
                    <div className="mt-4 h-[150px] overflow-hidden rounded-[18px] border border-white/70 bg-white/[0.46]">
                      <button
                        type="button"
                        className="group relative grid h-full w-full place-items-center overflow-hidden transition-colors hover:bg-white/60"
                        onClick={() => coverInputRef.current?.click()}
                      >
                        {coverPreview ? (
                          <>
                            <img src={coverPreview} alt="cover" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/8">
                              <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] text-[var(--color-primary)] opacity-0 shadow-[0_8px_20px_rgba(51,79,82,0.08)] transition group-hover:opacity-100">
                                更换封面
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#9ca9ad]">
                            <span className="text-[38px] leading-none">+</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </motion.section>

                  <motion.section
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ ...editorSpring, delay: 0.04 }}
                    className={cn(cardClass, "p-5")}
                  >
                    <h2 className="text-[15px] font-medium text-[var(--color-primary)]">元信息</h2>
                    <div className="mt-4 space-y-2.5">
                      <textarea
                        placeholder="为这篇文章写一段简短摘要"
                        rows={2}
                        value={summary}
                        onChange={(event) => setSummary(event.target.value)}
                        className={cn(fieldTextareaClass, "min-h-[72px] resize-none")}
                      />

                      <div className="rounded-[16px] border border-white/70 bg-white/[0.48] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.62)]">
                        {tags.length ? (
                          <div className="mb-2 flex flex-wrap gap-2">
                            {tags.map((tag) => (
                              <span key={tag} className="inline-flex items-center gap-1 rounded-[10px] bg-[#e8f0ff] px-2.5 py-1 text-[12px] text-[#4e7cff]">
                                #{tag}
                                <button
                                  type="button"
                                  className="grid h-3.5 w-3.5 place-items-center rounded-full text-[#7e8ed0] transition hover:bg-[#d6e2ff]"
                                  onClick={() => removeTag(tag)}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(event) => setTagInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === "," || event.key === "，") {
                              event.preventDefault();
                              if (addTag(tagInput)) setTagInput("");
                            } else if (event.key === "Backspace" && !tagInput && tags.length) {
                              removeTag(tags[tags.length - 1]);
                            }
                          }}
                          placeholder="添加标签（按回车）"
                          className="w-full bg-transparent text-[13px] text-[var(--color-primary)] outline-none placeholder:text-[#a3afb4]"
                        />
                      </div>

                      <div className="relative">
                        <select
                          value={category || "未分类"}
                          onChange={(event) => setCategory(event.target.value)}
                          className={cn(fieldClass, "appearance-none pr-10")}
                        >
                          {categoryOptions.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-secondary" />
                      </div>

                      <input type="datetime-local" value={datetime} onChange={(event) => setDatetime(event.target.value)} className={fieldClass} />

                      <div className="flex items-center gap-2 px-0.5 pt-1">
                        <input
                          type="checkbox"
                          id="hidden-check"
                          checked={hidden}
                          onChange={(event) => setHidden(event.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="hidden-check" className="cursor-pointer select-none text-[13px] text-[#617176]">
                          隐藏此文章（仅管理员可见）
                        </label>
                      </div>
                    </div>
                  </motion.section>

                  <motion.section
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ ...editorSpring, delay: 0.06 }}
                    className={cn(cardClass, "p-5")}
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-[15px] font-medium text-[var(--color-primary)]">图片管理</h2>
                      <a href="/image-toolbox" className="text-[12px] text-secondary hover:underline">
                        压缩工具
                      </a>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(event) => setImageUrl(event.target.value)}
                        placeholder="https://..."
                        className={cn(fieldClass, "flex-1")}
                      />
                      <button className="h-[42px] rounded-[14px] border border-white/70 bg-white/72 px-4 text-[13px] text-[var(--color-primary)]" onClick={addImageUrl}>
                        添加
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        className="grid aspect-square place-items-center rounded-[16px] border border-white/70 bg-white/[0.46] text-2xl leading-none text-neutral-400 transition hover:bg-white/70"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        +
                      </button>
                      {images.map((image) => {
                        const src = image.type === "file" ? image.previewUrl : image.url;
                        const finalUrl = imageFinalUrl(image, normalizedSlug);
                        const imageName = image.type === "file" ? image.file.name.replace(/\.[^.]+$/, "") : "image";
                        const isCover = finalUrl === cover;
                        return (
                          <div key={image.id} className="group relative aspect-square overflow-hidden rounded-[16px] border border-white/70 bg-white/45">
                            <img src={src} alt="" className="h-full w-full object-cover" />
                            {isCover ? (
                              <span className="absolute left-1.5 top-1.5 rounded-[8px] bg-[#4a9dff] px-1.5 py-0.5 text-[10px] text-white shadow-[0_8px_18px_rgba(74,157,255,0.32)]">
                                封面
                              </span>
                            ) : null}
                            <div className="absolute inset-0 flex flex-col justify-end gap-1 bg-[linear-gradient(180deg,transparent,rgba(51,79,82,0.84))] p-1.5 opacity-0 transition group-hover:opacity-100">
                              <button className="rounded-md bg-white/88 px-2 py-1 text-[10px]" onClick={() => insertMarkdown(`\n![${imageName}](${finalUrl})\n`)}>
                                插入
                              </button>
                              <div className="grid grid-cols-2 gap-1">
                                <button className="rounded-md bg-white/88 px-1 py-1 text-[10px]" onClick={() => { setCover(finalUrl); showMessage("已设置封面"); }}>
                                  封面
                                </button>
                                <button className="rounded-md bg-white/88 px-1 py-1 text-[10px] text-rose-600" onClick={() => removeImage(image.id)}>
                                  <Trash2 className="mx-auto h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.section>
                </div>
              </div>
            ) : (
              <div className="flex h-full gap-6">
                <div className="w-[930px]">
                  <motion.section
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={editorSpring}
                    className={cn(cardClass, "min-h-[168px] rounded-[28px] px-8 py-10 text-center")}
                  >
                    <h1 className="text-[29px] font-semibold text-[var(--color-primary)]">{previewTitle}</h1>
                    <div className="mt-7 text-[14px] text-secondary">{previewDate}</div>
                  </motion.section>
                  <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...editorSpring, delay: 0.04 }}
                    className={cn(cardClass, "mt-6 h-[638px] rounded-[28px] bg-white/[0.78] p-6")}
                  >
                    <div className="scrollbar-none h-full overflow-y-auto pr-2">
                      {coverPreview ? <img src={coverPreview} alt="" className="mb-8 max-h-[360px] w-full rounded-[24px] object-cover" /> : null}
                      <MarkdownView markdown={markdown} />
                    </div>
                  </motion.section>
                </div>
                <div className="w-[196px]">
                  <motion.section
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ ...editorSpring, delay: 0.06 }}
                    className={cn(cardClass, "rounded-[22px] p-4")}
                  >
                    <div className="text-[15px] font-medium">目录</div>
                    <div className="mt-3 space-y-2 text-[14px] text-secondary">
                      {toc.length ? (
                        toc.map((item) => (
                          <a
                            key={item.id}
                            href={`#${item.id}`}
                            className={cn("block transition hover:text-[var(--color-brand)]", item.level === 2 && "pl-3", item.level === 3 && "pl-6")}
                          >
                            {item.text}
                          </a>
                        ))
                      ) : (
                        <div>暂无</div>
                      )}
                    </div>
                  </motion.section>
                  <motion.div
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ ...editorSpring, delay: 0.08 }}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/72 bg-white/55 px-4 py-2 shadow-[0_10px_30px_rgba(51,79,82,0.06)] backdrop-blur-sm"
                  >
                    <span className="rounded-full bg-rose-100 p-2 text-rose-400">❤</span>
                    <span className="text-xs text-secondary">17966</span>
                  </motion.div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {message ? (
        <div className="fixed bottom-5 right-6 z-40 rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-[13px] text-[var(--color-brand)] shadow-[0_16px_36px_rgba(51,79,82,0.08)] backdrop-blur-xl">
          {message}
        </div>
      ) : null}
    </div>
  );
}
