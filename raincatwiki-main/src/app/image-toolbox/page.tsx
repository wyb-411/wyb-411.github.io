"use client";

import { motion } from "framer-motion";
import { Download, ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { uid } from "@/lib/utils";

type ToolboxItem = {
  id: string;
  file: File;
  inputUrl: string;
  outputUrl: string;
  outputSize: number;
  width: number;
  height: number;
  status: "idle" | "processing" | "done" | "error";
  error?: string;
};

const cardClass =
  "card rounded-[30px] border border-white/75 bg-white/[0.5] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_18px_42px_rgba(51,79,82,0.055)] backdrop-blur-[15px]";

export default function ImageToolboxPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<ToolboxItem[]>([]);
  const [items, setItems] = useState<ToolboxItem[]>([]);
  const [quality, setQuality] = useState(0.8);
  const [limitWidth, setLimitWidth] = useState(false);
  const [maxWidth, setMaxWidth] = useState(1600);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        URL.revokeObjectURL(item.inputUrl);
        if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
      }
    };
  }, []);

  const totalConverted = useMemo(() => items.filter((item) => item.status === "done").length, [items]);

  const addFiles = (fileList?: FileList | null) => {
    if (!fileList?.length) return;
    const next = Array.from(fileList).map((file) => ({
      id: uid("toolbox"),
      file,
      inputUrl: URL.createObjectURL(file),
      outputUrl: "",
      outputSize: 0,
      width: 0,
      height: 0,
      status: "idle" as const
    }));
    setItems((current) => [...current, ...next]);
  };

  const removeItem = (id: string) => {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.inputUrl);
        if (target.outputUrl) URL.revokeObjectURL(target.outputUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const clearAll = () => {
    for (const item of itemsRef.current) {
      URL.revokeObjectURL(item.inputUrl);
      if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
    }
    setItems([]);
  };

  const convertAll = async () => {
    if (!items.length) return;
    setConverting(true);
    const nextItems = await Promise.all(
      items.map(async (item) => {
        try {
          const converted = await convertToWebp(item.file, item.inputUrl, quality, limitWidth ? maxWidth : null);
          if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
          return {
            ...item,
            outputUrl: converted.url,
            outputSize: converted.size,
            width: converted.width,
            height: converted.height,
            status: "done" as const,
            error: undefined
          };
        } catch (error) {
          return {
            ...item,
            status: "error" as const,
            error: error instanceof Error ? error.message : "转换失败"
          };
        }
      })
    );
    setItems(nextItems);
    setConverting(false);
  };

  const downloadOne = (item: ToolboxItem) => {
    if (!item.outputUrl) return;
    const link = document.createElement("a");
    link.href = item.outputUrl;
    link.download = item.file.name.replace(/\.[^.]+$/, "") + ".webp";
    link.click();
  };

  const downloadAll = () => {
    items.filter((item) => item.outputUrl).forEach((item, index) => {
      window.setTimeout(() => downloadOne(item), index * 120);
    });
  };

  return (
    <main className="relative z-10 min-h-screen px-6 pb-12 pt-28 text-sm max-sm:pt-24">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-secondary">Image Toolbox</p>
          <h1 className="text-[28px] font-semibold text-[var(--color-primary)]">PNG / JPG 转 WEBP</h1>
          <p className="text-[13px] text-secondary">选择图片，调节质量，转换后直接下载。</p>
        </motion.div>

        <motion.label
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cardClass + " group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-4 text-center transition hover:bg-white/80"}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            addFiles(event.dataTransfer.files);
          }}
        >
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => addFiles(event.target.files)} />
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--color-brand)_12%,white)] text-[var(--color-brand)] transition group-hover:scale-105">
            <ImagePlus className="h-9 w-9" strokeWidth={1.8} />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-[var(--color-primary)]">点击或拖拽图片</p>
            <p className="text-xs text-secondary">支持 PNG、JPG、JPEG、WEBP 等常见格式</p>
          </div>
        </motion.label>

        <motion.section initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cardClass + " p-5"}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-secondary">质量</p>
                <div className="flex items-center gap-3 pt-3">
                  <input
                    type="range"
                    min="0.3"
                    max="1"
                    step="0.05"
                    value={quality}
                    onChange={(event) => setQuality(Number(event.target.value))}
                    className="w-full accent-[var(--color-brand)]"
                  />
                  <span className="w-12 text-right text-sm font-medium text-[var(--color-primary)]">{Math.round(quality * 100)}%</span>
                </div>
                <p className="pt-2 text-xs text-secondary">质量越高，体积越大；80% 一般已经很够用。</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-secondary">
                  <input type="checkbox" checked={limitWidth} onChange={(event) => setLimitWidth(event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                  限制最大宽度
                </label>
                <input
                  type="number"
                  value={maxWidth}
                  min={320}
                  max={4000}
                  step={20}
                  disabled={!limitWidth}
                  onChange={(event) => setMaxWidth(Number(event.target.value) || 1600)}
                  className="h-10 w-28 rounded-[14px] border border-white/70 bg-white/[0.48] px-3 text-[13px] text-[var(--color-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] outline-none disabled:opacity-45"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              <button
                disabled={!items.length || converting}
                onClick={convertAll}
                className="rounded-full border border-slate-200 bg-white/60 px-4 py-2 font-medium text-[var(--color-primary)] transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
              >
                {converting ? "转换中..." : "全部转换"}
              </button>
              <button
                disabled={!totalConverted}
                onClick={downloadAll}
                className="rounded-full border border-[var(--color-brand)] px-4 py-2 font-semibold text-[var(--color-brand)] transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
              >
                全部下载
              </button>
              <button
                disabled={!items.length}
                onClick={clearAll}
                className="rounded-full border border-slate-200 bg-white/60 px-4 py-2 font-medium text-secondary transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
              >
                清空
              </button>
            </div>
          </div>
        </motion.section>

        {items.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={cardClass + " overflow-hidden p-4"}
              >
                <div className="overflow-hidden rounded-[18px] border border-white/70 bg-white/45">
                  <img src={item.outputUrl || item.inputUrl} alt={item.file.name} className="aspect-[4/3] w-full object-cover" />
                </div>
                <div className="mt-4 space-y-3">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium text-[var(--color-primary)]">{item.file.name}</div>
                    <div className="mt-1 text-xs text-secondary">
                      原始 {formatBytes(item.file.size)}
                      {item.outputSize ? ` -> ${formatBytes(item.outputSize)}` : ""}
                    </div>
                    <div className="mt-1 text-xs text-secondary">
                      {item.width && item.height ? `${item.width} x ${item.height}` : "等待转换"}
                    </div>
                    {item.error ? <div className="mt-1 text-xs text-rose-500">{item.error}</div> : null}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-white/65 px-3 py-1 text-xs text-secondary">
                      {item.status === "done" ? "已转换" : item.status === "processing" ? "处理中" : item.status === "error" ? "失败" : "待转换"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={!item.outputUrl}
                        onClick={() => downloadOne(item)}
                        className="grid h-9 w-9 place-items-center rounded-full border border-white/70 bg-white/65 text-[var(--color-brand)] disabled:cursor-not-allowed disabled:text-slate-300"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="grid h-9 w-9 place-items-center rounded-full border border-white/70 bg-white/65 text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}

async function convertToWebp(file: File, sourceUrl: string, quality: number, maxWidth: number | null) {
  const image = await loadImage(sourceUrl);
  const ratio = maxWidth && image.naturalWidth > maxWidth ? maxWidth / image.naturalWidth : 1;
  const width = Math.max(1, Math.round(image.naturalWidth * ratio));
  const height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("浏览器不支持图片压缩");
  context.drawImage(image, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  if (!blob) throw new Error("转换失败");
  return {
    url: URL.createObjectURL(blob),
    size: blob.size,
    width,
    height
  };
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片读取失败"));
    image.src = url;
  });
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}
