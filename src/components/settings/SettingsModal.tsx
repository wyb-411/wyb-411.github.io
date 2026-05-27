"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  KeyRound,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload
} from "lucide-react";
import { DialogModal } from "@/components/shared/DialogModal";
import { defaultCardStyles, defaultSiteConfig, normalizeSiteConfig } from "@/lib/defaults";
import { fileToBase64NoPrefix, fileToDataUrl, hashFileSHA256, readFileAsText } from "@/lib/files";
import { commitFiles, hasGithubAppConfig } from "@/lib/github";
import { socialPlatformMap, socialPlatforms, sortSocialLinks } from "@/lib/social";
import { cn, fileExt, uid } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useConfigStore } from "@/store/config-store";
import { useLayoutEditStore } from "@/store/layout-edit-store";
import type { AssetItem, CardStyle, CardStyles, SiteConfig, SocialIcon, SocialLink } from "@/types";

type Tab = "site" | "color" | "layout";

type PendingAsset = {
  draftUrl: string;
  finalUrl: string;
  path: string;
  content: string;
};

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "site", label: "网站设置" },
  { id: "color", label: "色彩配置" },
  { id: "layout", label: "首页布局" }
];

const themeLabels: Record<keyof SiteConfig["theme"], string> = {
  colorBrand: "主题色",
  colorBrandSecondary: "次级主题色",
  colorPrimary: "主色",
  colorSecondary: "次色",
  colorBg: "背景色",
  colorBorder: "边框色",
  colorCard: "卡片色",
  colorArticle: "文章背景"
};

const colorPresets = [
  {
    name: "春暖",
    colors: ["#35bfab", "#f7e55f", "#9ee6d2", "#7ed58d", "#f3df55", "#7fdde0", "#a5edcf"],
    theme: { colorBrand: "#35bfab", colorBrandSecondary: "#39c6d9", colorPrimary: "#334f52", colorSecondary: "#7b888e" }
  },
  {
    name: "秋实",
    colors: ["#ee4035", "#ffc43d", "#dceeff", "#dfe38f", "#ec3f34", "#ff934f", "#ffc83d"],
    theme: { colorBrand: "#ee6b4d", colorBrandSecondary: "#ffc43d", colorPrimary: "#4d403a", colorSecondary: "#8b756b" }
  },
  {
    name: "深夜",
    colors: ["#3155f6", "#24117a"],
    theme: { colorBrand: "#3155f6", colorBrandSecondary: "#24117a", colorPrimary: "#d9e6ff", colorSecondary: "#9da9cf" }
  }
] satisfies Array<{ name: string; colors: string[]; theme: Partial<SiteConfig["theme"]> }>;

const cardLabels: Record<string, string> = {
  artCard: "首图",
  hiCard: "中心",
  clockCard: "时钟",
  calendarCard: "日历",
  musicCard: "音乐",
  socialButtons: "联系",
  shareCard: "分享",
  articleCard: "文章",
  writeButtons: "写作",
  navCard: "导航",
  likePosition: "点赞",
};

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const siteContent = useConfigStore((state) => state.siteContent);
  const cardStyles = useConfigStore((state) => state.cardStyles);
  const setSiteContent = useConfigStore((state) => state.setSiteContent);
  const setCardStyles = useConfigStore((state) => state.setCardStyles);
  const setConfigDialogOpen = useConfigStore((state) => state.setConfigDialogOpen);
  const startEditing = useLayoutEditStore((state) => state.startEditing);
  const isAuth = useAuthStore((state) => state.isAuth);
  const setPrivateKey = useAuthStore((state) => state.setPrivateKey);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const pemInputRef = useRef<HTMLInputElement>(null);
  const initialSiteRef = useRef<SiteConfig>(siteContent);
  const initialCardsRef = useRef<CardStyles>(cardStyles);
  const [tab, setTab] = useState<Tab>("site");
  const [draftSite, setDraftSite] = useState<SiteConfig>(normalizeSiteConfig(siteContent));
  const [draftCards, setDraftCards] = useState<CardStyles>(cardStyles);
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const appReady = hasGithubAppConfig();
  const canSave = appReady && isAuth;

  useEffect(() => {
    if (!open) return;
    const normalized = normalizeSiteConfig(siteContent);
    initialSiteRef.current = normalized;
    initialCardsRef.current = cardStyles;
    setDraftSite(normalized);
    setDraftCards(cardStyles);
    setPendingAssets([]);
    setMessage("");
  }, [open, siteContent, cardStyles]);

  const missingReason = useMemo(() => {
    if (!appReady) return "缺少 NEXT_PUBLIC_GITHUB_APP_ID，保存按钮会保持禁用。";
    if (!isAuth) return "需要先导入 GitHub App .pem 私钥。";
    return "";
  }, [appReady, isAuth]);

  const updateSite = (next: SiteConfig) => {
    const normalized = normalizeSiteConfig(next);
    setDraftSite(normalized);
  };

  const updateCards = (next: CardStyles) => {
    setDraftCards(next);
  };

  const previewSettings = () => {
    setSiteContent(draftSite);
    setCardStyles(draftCards);
    setMessage("本地预览已应用，保存到仓库前仍可取消恢复。");
  };

  const importPem = async (file?: File) => {
    if (!file) return;
    const text = await readFileAsText(file);
    await setPrivateKey(text, draftSite.isCachePem);
    setMessage("已导入私钥，本次会话可发布到 GitHub 仓库。");
  };

  const makePendingImage = async (file: File, prefix: string) => {
    const [content, previewUrl, hash] = await Promise.all([fileToBase64NoPrefix(file), fileToDataUrl(file), hashFileSHA256(file)]);
    const ext = fileExt(file.name) || ".png";
    const path = `public/images/site/${prefix}-${hash}${ext}`;
    const finalUrl = `/${path.replace(/^public\//, "")}`;
    const asset = { draftUrl: previewUrl, finalUrl, path, content };
    setPendingAssets((current) => [...current.filter((item) => item.draftUrl !== previewUrl), asset]);
    return asset;
  };

  const uploadMetaImage = async (file: File | undefined, field: "avatar" | "favicon") => {
    if (!file) return;
    const asset = await makePendingImage(file, field);
    updateSite({ ...draftSite, meta: { ...draftSite.meta, [field]: asset.draftUrl } });
  };

  const uploadGalleryImage = async (file: File | undefined) => {
    if (!file) return;
    const asset = await makePendingImage(file, "art");
    const item: AssetItem = { id: uid("art"), url: asset.draftUrl, label: file.name.replace(/\.[^.]+$/, "") };
    updateSite({ ...draftSite, artImages: [...draftSite.artImages, item], currentArtImageId: item.id });
  };

  const replacePendingUrls = (site: SiteConfig): SiteConfig => {
    const replace = (url: string) => pendingAssets.find((item) => item.draftUrl === url)?.finalUrl || url;
    return {
      ...site,
      meta: {
        ...site.meta,
        avatar: replace(site.meta.avatar),
        favicon: replace(site.meta.favicon)
      },
      artImages: site.artImages.map((item) => ({ ...item, url: replace(item.url) }))
    };
  };

  const saveSettings = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setMessage("");
    try {
      const siteForSave = replacePendingUrls(draftSite);
      const result = await commitFiles("chore: update site settings", [
        { path: "public/site/config.json", content: JSON.stringify(siteForSave, null, 2) + "\n", encoding: "utf-8" },
        { path: "public/site/card-styles.json", content: JSON.stringify(draftCards, null, 2) + "\n", encoding: "utf-8" },
        ...pendingAssets.map((asset) => ({ path: asset.path, content: asset.content, encoding: "base64" as const }))
      ]);
      const normalized = normalizeSiteConfig(siteForSave);
      setDraftSite(normalized);
      setSiteContent(normalized);
      setCardStyles(draftCards);
      initialSiteRef.current = normalized;
      initialCardsRef.current = draftCards;
      setPendingAssets([]);
      setMessage(`已提交到 GitHub（${result.commitSha.slice(0, 7)}），Vercel 稍后会自动重新部署。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const cancelChanges = () => {
    setDraftSite(initialSiteRef.current);
    setDraftCards(initialCardsRef.current);
    setSiteContent(initialSiteRef.current);
    setCardStyles(initialCardsRef.current);
    setPendingAssets([]);
    setMessage("已取消本次未保存修改。");
    onClose();
  };

  const resetLocal = () => {
    setDraftSite(normalizeSiteConfig(defaultSiteConfig));
    setDraftCards(defaultCardStyles);
    setMessage("已恢复默认配置草稿，点击预览可查看效果。");
  };

  const updateSocial = (id: string, patch: Partial<SocialLink>) => {
    updateSite({
      ...draftSite,
      socialLinks: draftSite.socialLinks.map((item) => (item.id === id ? { ...item, ...patch } : item))
    });
  };

  const moveSocial = (id: string, direction: -1 | 1) => {
    const sorted = sortSocialLinks(draftSite.socialLinks);
    const index = sorted.findIndex((item) => item.id === id);
    const swap = sorted[index + direction];
    if (!swap) return;
    updateSite({
      ...draftSite,
      socialLinks: draftSite.socialLinks.map((item) => {
        if (item.id === id) return { ...item, order: swap.order };
        if (item.id === swap.id) return { ...item, order: sorted[index].order };
        return item;
      })
    });
  };

  const addSocial = () => {
    const order = Math.max(0, ...draftSite.socialLinks.map((item) => item.order || 0)) + 1;
    updateSite({
      ...draftSite,
      socialLinks: [
        ...draftSite.socialLinks,
        { id: uid("social"), label: "GitHub", url: "", icon: "github", order, enabled: true }
      ]
    });
  };

  return (
    <DialogModal open={open} onClose={cancelChanges} className="w-full max-w-4xl">
      <div className="overflow-hidden rounded-[38px] border border-white/70 bg-white/58 shadow-[0_28px_80px_rgba(51,79,82,0.14)] backdrop-blur-2xl">
        <header className="flex flex-wrap items-center justify-between gap-4 px-7 py-6">
          <nav className="flex items-center gap-7">
            {tabs.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "h-10 border-b-2 px-1 text-sm font-semibold transition",
                  tab === item.id ? "border-[var(--color-brand)] text-[var(--color-brand)]" : "border-transparent text-secondary hover:text-[var(--color-primary)]"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button className="h-10 rounded-2xl bg-white/58 px-6 text-sm shadow-[0_10px_26px_rgba(51,79,82,0.06)]" onClick={previewSettings}>
              预览
            </button>
            <button className="h-10 rounded-2xl bg-white/58 px-6 text-sm shadow-[0_10px_26px_rgba(51,79,82,0.06)]" onClick={cancelChanges}>
              取消
            </button>
            <input ref={pemInputRef} type="file" accept=".pem,.key,text/*" className="hidden" onChange={(event) => importPem(event.target.files?.[0])} />
            <button className="brand-btn flex h-10 items-center gap-2 px-5 text-sm" onClick={() => pemInputRef.current?.click()}>
              <KeyRound className="h-4 w-4" />
              导入密钥
            </button>
          </div>
        </header>

        <section className="max-h-[72vh] overflow-y-auto px-7 pb-7">
          {tab === "site" && (
            <div className="grid gap-7">
              <div className="grid gap-6 md:grid-cols-2">
                <ImagePicker
                  label="Favicon"
                  image={draftSite.meta.favicon}
                  shape="square"
                  onUpload={(file) => uploadMetaImage(file, "favicon")}
                />
                <ImagePicker
                  label="Avatar"
                  image={draftSite.meta.avatar}
                  shape="circle"
                  onUpload={(file) => uploadMetaImage(file, "avatar")}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <TextField label="站点标题" value={draftSite.meta.title} onChange={(value) => updateSite({ ...draftSite, meta: { ...draftSite.meta, title: value } })} />
                <TextField label="用户名" value={draftSite.meta.username} onChange={(value) => updateSite({ ...draftSite, meta: { ...draftSite.meta, username: value } })} />
              </div>
              <TextAreaField label="站点描述" value={draftSite.meta.description} onChange={(value) => updateSite({ ...draftSite, meta: { ...draftSite.meta, description: value } })} />

              <SettingGroup title="社交按钮">
                <div className="grid gap-3">
                  {sortSocialLinks(draftSite.socialLinks).map((item, index, sorted) => (
                    <SocialRow
                      key={item.id}
                      item={item}
                      index={index}
                      isFirst={index === 0}
                      isLast={index === sorted.length - 1}
                      onChange={updateSocial}
                      onMove={moveSocial}
                      onDelete={(id) => updateSite({ ...draftSite, socialLinks: draftSite.socialLinks.filter((link) => link.id !== id) })}
                    />
                  ))}
                  <button onClick={addSocial} className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-white/80 bg-white/30 text-sm text-secondary hover:bg-white/55">
                    <Plus className="h-4 w-4" />
                    添加按钮
                  </button>
                </div>
              </SettingGroup>

              <AssetGallery
                title="首页图片"
                items={draftSite.artImages}
                currentId={draftSite.currentArtImageId}
                onUpload={uploadGalleryImage}
                onSelect={(id) => updateSite({ ...draftSite, currentArtImageId: id })}
                onDelete={(id) => {
                  const next = draftSite.artImages.filter((item) => item.id !== id);
                  updateSite({ ...draftSite, artImages: next, currentArtImageId: next[0]?.id || "" });
                }}
              />
            </div>
          )}

          {tab === "color" && (
            <div className="grid gap-7">
              <SettingGroup title="基础颜色">
                <div className="grid gap-x-20 gap-y-4 md:grid-cols-2">
                  {(Object.entries(draftSite.theme) as Array<[keyof SiteConfig["theme"], string]>).map(([key, value]) => (
                    <ColorField
                      key={key}
                      label={themeLabels[key]}
                      value={value}
                      onChange={(next) => updateSite({ ...draftSite, theme: { ...draftSite.theme, [key]: next } })}
                    />
                  ))}
                </div>
              </SettingGroup>

              <SettingGroup title="背景颜色">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-3">
                    {draftSite.backgroundColors.map((color, index) => (
                      <label key={`${color}-${index}`} className="group relative h-10 w-10 overflow-hidden rounded-xl border border-white/80 shadow-[0_6px_14px_rgba(51,79,82,0.12)]" style={{ backgroundColor: color }}>
                        <input
                          type="color"
                          value={color.slice(0, 7)}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          onChange={(event) => {
                            const next = draftSite.backgroundColors.map((item, itemIndex) => (itemIndex === index ? event.target.value : item));
                            updateSite({ ...draftSite, backgroundColors: next });
                          }}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-xl bg-white/50 px-4 py-2 text-sm" onClick={() => updateSite({ ...draftSite, backgroundColors: shuffleColors() })}>随机配色</button>
                    <button className="rounded-xl bg-white/50 px-4 py-2 text-sm" onClick={() => updateSite({ ...draftSite, backgroundColors: [...draftSite.backgroundColors, "#ffffff"] })}>+ 添加颜色</button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => updateSite({ ...draftSite, theme: { ...draftSite.theme, ...preset.theme }, backgroundColors: preset.colors })}
                      className="flex min-h-16 items-center gap-4 rounded-2xl bg-white/32 px-4 py-3 text-left transition hover:bg-white/55"
                    >
                      <span className="flex flex-wrap gap-2">
                        {preset.colors.map((color, index) => (
                          <span key={`${preset.name}-${color}-${index}`} className="h-10 w-10 rounded-xl border border-white/80 shadow-[0_5px_12px_rgba(51,79,82,0.12)]" style={{ backgroundColor: color }} />
                        ))}
                      </span>
                      <span className="font-semibold">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </SettingGroup>
            </div>
          )}

          {tab === "layout" && (
            <SettingGroup
              title="首页布局"
              extra={
                <div className="flex gap-2">
                  <button className="rounded-xl bg-white/50 px-4 py-2 text-xs font-semibold text-secondary shadow-[0_8px_20px_rgba(47,79,82,0.06)] transition hover:bg-white/78" onClick={() => updateCards(defaultCardStyles)}>
                    重置
                  </button>
                  <button
                    className="rounded-xl bg-white/50 px-4 py-2 text-xs font-semibold text-secondary shadow-[0_8px_20px_rgba(47,79,82,0.06)] transition hover:bg-white/78"
                    onClick={() => {
                      setCardStyles(draftCards);
                      startEditing(draftCards);
                      setConfigDialogOpen(false);
                    }}
                  >
                    进入主页拖拽布局
                  </button>
                </div>
              }
            >
              <p className="mb-5 text-sm font-semibold text-secondary">（偏移代表相对中心的偏移）</p>
              <LayoutTable cards={draftCards} onChange={updateCards} />
            </SettingGroup>
          )}
        </section>

        <footer className="flex flex-col gap-3 border-t border-white/50 px-7 py-4 md:flex-row md:items-center md:justify-between">
          <div className={cn("text-sm", message ? "text-[var(--color-brand)]" : "text-secondary")}>
            {message || missingReason || "凭据完整，可以保存到仓库。"}
            {isAuth && (
              <button className="ml-3 text-xs underline underline-offset-4" onClick={clearAuth}>
                清除密钥
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={resetLocal} className="flex h-10 items-center gap-2 rounded-2xl bg-white/55 px-4 text-sm">
              <RotateCcw className="h-4 w-4" />
              恢复默认
            </button>
            <button disabled={!canSave || saving} onClick={saveSettings} className="brand-btn flex h-10 items-center gap-2 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-45">
              <Save className="h-4 w-4" />
              {saving ? "保存中..." : "保存到仓库"}
            </button>
          </div>
        </footer>
      </div>
    </DialogModal>
  );
}

function ImagePicker({ label, image, shape, onUpload }: { label: string; image: string; shape: "square" | "circle"; onUpload: (file?: File) => void }) {
  return (
    <label className="group grid w-max gap-3 text-sm font-semibold">
      {label}
      <span className={cn("relative grid h-20 w-20 cursor-pointer place-items-center overflow-hidden border border-white/80 bg-white/42 shadow-[0_12px_28px_rgba(51,79,82,0.1)]", shape === "circle" ? "rounded-full" : "rounded-xl")}>
        <img src={image} alt="" className="h-full w-full object-cover" />
        <span className="absolute inset-0 grid place-items-center bg-[rgba(51,79,82,0.38)] text-white opacity-0 transition group-hover:opacity-100">
          <Upload className="h-5 w-5" />
        </span>
      </span>
      <input type="file" accept="image/*" className="hidden" onChange={(event) => onUpload(event.target.files?.[0])} />
    </label>
  );
}

function SocialRow({
  item,
  index,
  isFirst,
  isLast,
  onChange,
  onMove,
  onDelete
}: {
  item: SocialLink;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onChange: (id: string, patch: Partial<SocialLink>) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onDelete: (id: string) => void;
}) {
  const platform = socialPlatformMap[item.icon] || socialPlatformMap.link;
  return (
    <div className="grid gap-2 rounded-2xl bg-white/32 p-2 md:grid-cols-[104px_1fr_118px_72px_88px] md:items-center">
      <div className="relative">
        <select
          value={item.icon}
          onChange={(event) => {
            const icon = event.target.value as SocialIcon;
            const nextPlatform = socialPlatformMap[icon];
            onChange(item.id, { icon, label: nextPlatform.label });
          }}
          className="h-10 w-full appearance-none rounded-xl border border-white/65 bg-white/52 px-3 text-sm outline-none"
        >
          {socialPlatforms.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <input
        value={item.url}
        placeholder={platform.placeholder}
        onChange={(event) => onChange(item.id, { url: event.target.value })}
        className="h-10 min-w-0 rounded-xl border border-white/65 bg-white/52 px-3 text-sm outline-none"
      />
      <input
        value={item.label}
        onChange={(event) => onChange(item.id, { label: event.target.value })}
        className="h-10 min-w-0 rounded-xl border border-white/65 bg-white/52 px-3 text-sm outline-none"
      />
      <input
        type="number"
        value={index + 1}
        onChange={(event) => onChange(item.id, { order: Number(event.target.value) || index + 1 })}
        className="h-10 min-w-0 rounded-xl border border-white/65 bg-white/52 px-3 text-sm outline-none"
      />
      <div className="flex items-center justify-end gap-1">
        <button className="grid h-9 w-9 place-items-center rounded-xl bg-white/45 disabled:opacity-25" disabled={isFirst} onClick={() => onMove(item.id, -1)} aria-label="上移">
          <ArrowUp className="h-4 w-4" />
        </button>
        <button className="grid h-9 w-9 place-items-center rounded-xl bg-white/45 disabled:opacity-25" disabled={isLast} onClick={() => onMove(item.id, 1)} aria-label="下移">
          <ArrowDown className="h-4 w-4" />
        </button>
        <button className="grid h-9 w-9 place-items-center rounded-xl bg-white/45 text-red-500" onClick={() => onDelete(item.id)} aria-label="删除">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AssetGallery({
  title,
  items,
  currentId,
  onUpload,
  onSelect,
  onDelete
}: {
  title: string;
  items: AssetItem[];
  currentId: string;
  onUpload: (file?: File) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <SettingGroup title={title}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className={cn("group relative h-24 overflow-hidden rounded-2xl border bg-white/34", currentId === item.id ? "border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/30" : "border-white/65")}>
            <button type="button" onClick={() => onSelect(item.id)} className="h-full w-full text-left">
              <img src={item.url} alt={item.label || title} className="h-full w-full object-cover transition group-hover:scale-105" />
              {currentId === item.id && <span className="absolute left-2 top-2 rounded-full bg-[var(--color-brand)] px-2 py-1 text-[10px] font-semibold text-white">当前使用</span>}
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/72 text-red-500 opacity-0 transition group-hover:opacity-100"
              aria-label="删除图片"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <label className="grid h-24 cursor-pointer place-items-center rounded-2xl border border-dashed border-white/80 bg-white/25 text-secondary transition hover:bg-white/48">
          <Plus className="h-6 w-6" />
          <input type="file" accept="image/*" className="hidden" onChange={(event) => onUpload(event.target.files?.[0])} />
        </label>
      </div>
    </SettingGroup>
  );
}

function LayoutTable({ cards, onChange }: { cards: CardStyles; onChange: (value: CardStyles) => void }) {
  const entries = Object.entries(cards).filter(([key]) => key !== "beianCard");
  const updateCard = (key: string, patch: Partial<CardStyle>) => {
    onChange({ ...cards, [key]: { ...cards[key], ...patch } });
  };

  return (
    <div className="overflow-x-auto rounded-[22px] bg-white/18 p-1">
      <table className="w-full min-w-[760px] border-separate border-spacing-y-1 text-left text-sm">
        <thead className="text-xs font-semibold text-secondary">
          <tr>
            <th className="px-3 py-2">卡片</th>
            <th className="px-3 py-2">宽度</th>
            <th className="px-3 py-2">高度</th>
            <th className="px-3 py-2">显示顺序</th>
            <th className="px-3 py-2">横向偏移</th>
            <th className="px-3 py-2">纵向偏移</th>
            <th className="px-3 py-2 text-center">启用</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, card]) => (
            <tr key={key} className="group">
              <td className="rounded-l-2xl border-y border-l border-white/40 bg-white/20 px-3 py-2 font-medium">{cardLabels[key] || key}</td>
              <td className="border-y border-white/40 bg-white/20 px-3 py-2"><TableNumber value={card.width} onChange={(value) => updateCard(key, { width: value })} /></td>
              <td className="border-y border-white/40 bg-white/20 px-3 py-2"><TableNumber value={card.height} onChange={(value) => updateCard(key, { height: value })} /></td>
              <td className="border-y border-white/40 bg-white/20 px-3 py-2"><TableNumber value={card.order} onChange={(value) => updateCard(key, { order: value })} /></td>
              <td className="border-y border-white/40 bg-white/20 px-3 py-2"><NullableNumber value={card.offsetX} onChange={(value) => updateCard(key, { offsetX: value })} /></td>
              <td className="border-y border-white/40 bg-white/20 px-3 py-2"><NullableNumber value={card.offsetY} onChange={(value) => updateCard(key, { offsetY: value })} /></td>
              <td className="rounded-r-2xl border-y border-r border-white/40 bg-white/20 px-3 py-2 text-center">
                <input
                  type="checkbox"
                  checked={card.enabled}
                  onChange={(event) => updateCard(key, { enabled: event.target.checked })}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-[var(--color-brand)]"
                  aria-label={`${cardLabels[key] || key}启用`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableNumber({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-8 w-20 rounded-lg border border-white/60 bg-[rgba(123,136,142,0.1)] px-3 text-sm outline-none transition focus:border-[var(--color-brand)] focus:bg-white/70"
    />
  );
}

function NullableNumber({ value, onChange }: { value: number | null; onChange: (value: number | null) => void }) {
  return (
    <input
      type="number"
      value={value ?? ""}
      placeholder="null"
      onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
      className="h-8 w-20 rounded-lg border border-white/60 bg-[rgba(123,136,142,0.1)] px-3 text-sm outline-none transition placeholder:text-secondary/65 focus:border-[var(--color-brand)] focus:bg-white/70"
    />
  );
}

function SettingGroup({ title, children, extra }: { title: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <section className="rounded-[24px] bg-white/24 p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="font-semibold">{title}</h3>
        {extra}
      </div>
      {children}
    </section>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border border-white/65 bg-white/50 px-4 font-normal outline-none" />
    </label>
  );
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-24 resize-y rounded-xl border border-white/65 bg-white/50 px-4 py-3 font-normal outline-none" />
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center gap-4 text-sm">
      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/80 shadow-[0_6px_14px_rgba(51,79,82,0.12)]" style={{ backgroundColor: value }}>
        <input type="color" value={value.slice(0, 7)} onChange={(event) => onChange(event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </span>
      <span>{label}</span>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className={cn("grid h-4 w-4 place-items-center rounded border", checked ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white" : "border-[var(--color-secondary)] bg-white/40")}>
        {checked && <Check className="h-3 w-3" />}
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
      {label}
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-1 text-xs text-secondary">
      {label}
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="h-9 min-w-0 rounded-xl border border-white/65 bg-white/50 px-2 text-sm text-[var(--color-primary)] outline-none" />
    </label>
  );
}

function shuffleColors() {
  const source = ["#dff7ef", "#fff7cc", "#dff4ff", "#f6e7ff", "#bcebd9", "#f9d5e5", "#cde7ff", "#e3f4c8", "#ffe4bd"];
  return [...source].sort(() => Math.random() - 0.5).slice(0, 5);
}
