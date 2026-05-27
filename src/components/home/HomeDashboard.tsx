"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpenText,
  FolderGit2,
  Globe2,
  Heart,
  LayoutGrid,
  MoveDiagonal2,
  Music2,
  Pause,
  Play,
  FileText,
  Settings2,
  Sparkles,
  Smile,
  Star
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePublicJson } from "@/lib/data-hooks";
import { sortSocialLinks } from "@/lib/social";
import { cn } from "@/lib/utils";
import { DASHBOARD_CANVAS_HEIGHT, DASHBOARD_CANVAS_WIDTH, useDashboardScale } from "@/components/shared/DashboardCanvas";
import { useConfigStore } from "@/store/config-store";
import { useLayoutEditStore } from "@/store/layout-edit-store";
import type { BlogIndexItem, CardStyle, ShareItem } from "@/types";

const socialPlatformMap: Record<string, { short: string; color: string; textColor: string }> = {
  github: { short: "GH", color: "#24292f", textColor: "#ffffff" },
  bilibili: { short: "B", color: "#fb7299", textColor: "#ffffff" },
  xiaohongshu: { short: "红", color: "#ff2442", textColor: "#ffffff" },
  email: { short: "邮", color: "#78d5d7", textColor: "#0f4550" },
  telegram: { short: "TG", color: "#8b939b", textColor: "#ffffff" },
  wechat: { short: "微", color: "#54c46c", textColor: "#ffffff" },
  x: { short: "X", color: "#111111", textColor: "#ffffff" },
  link: { short: "LINK", color: "#d8efe8", textColor: "#30545a" }
};

function SocialMark({ icon, className }: { icon: string; className?: string }) {
  const style = socialPlatformMap[icon] || socialPlatformMap.link;
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-[9px] text-[11px] font-bold leading-none", className)}
      style={{ backgroundColor: style.color, color: style.textColor }}
      aria-hidden="true"
    >
      {style.short}
    </span>
  );
}

const basePositions: Record<string, { x: number; y: number }> = {
  artCard: { x: -180, y: -315 },
  hiCard: { x: -180, y: -95 },
  navCard: { x: -535, y: -210 },
  clockCard: { x: 230, y: -260 },
  calendarCard: { x: 225, y: -105 },
  musicCard: { x: -520, y: 235 },
  socialButtons: { x: -210, y: 245 },
  shareCard: { x: 230, y: 205 },
  articleCard: { x: 515, y: 65 },
  writeButtons: { x: 515, y: 245 },
  likePosition: { x: -300, y: 80 }
};

const widgetOrder = [
  "artCard",
  "hiCard",
  "navCard",
  "clockCard",
  "calendarCard",
  "musicCard",
  "socialButtons",
  "shareCard",
  "articleCard",
  "writeButtons",
  "likePosition"
];

const navLinks = [
  { href: "/blog", icon: FileText, label: "近期文章" },
  { href: "/projects", icon: LayoutGrid, label: "我的项目" },
  { href: "/about", icon: Globe2, label: "关于网站" },
  { href: "/share", icon: Smile, label: "推荐分享" },
  { href: "/bloggers", icon: Star, label: "优秀博客" }
];

const MIN_CARD_WIDTH = 42;
const MIN_CARD_HEIGHT = 36;

type EditAction =
  | {
      mode: "move";
      pointerId: number;
      startX: number;
      startY: number;
      startOffsetX: number;
      startOffsetY: number;
    }
  | {
      mode: "resize";
      pointerId: number;
      startX: number;
      startY: number;
      startWidth: number;
      startHeight: number;
    };

export function HomeDashboard() {
  const cardStyles = useConfigStore((state) => state.cardStyles);
  const editing = useLayoutEditStore((state) => state.editing);
  const draft = useLayoutEditStore((state) => state.draft);
  const saveEditing = useLayoutEditStore((state) => state.saveEditing);
  const cancelEditing = useLayoutEditStore((state) => state.cancelEditing);
  const setCardStyles = useConfigStore((state) => state.setCardStyles);
  const activeStyles = draft || cardStyles;
  const { scale: canvasScale, hydrated } = useDashboardScale(DASHBOARD_CANVAS_WIDTH, 24);

  return (
    <div className="relative h-[100dvh] overflow-hidden">
      {editing && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:top-6">
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/75 bg-white/78 px-4 py-2 text-xs shadow-[0_14px_36px_rgba(47,79,82,0.16)] backdrop-blur-xl">
            <span className="hidden text-secondary sm:inline">正在编辑首页布局，拖拽卡片调整位置</span>
            <span className="text-secondary sm:hidden">正在编辑首页布局</span>
            <button className="rounded-xl bg-white/70 px-3 py-1 font-semibold text-[var(--color-primary)] transition hover:bg-white" onClick={cancelEditing}>
              取消
            </button>
            <button
              className="brand-btn px-3 py-1 font-semibold"
              onClick={() => {
                const next = saveEditing();
                if (next) setCardStyles(next);
              }}
            >
              保存偏移
            </button>
          </div>
        </div>
      )}
      {hydrated ? (
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: `${DASHBOARD_CANVAS_WIDTH}px`,
            height: `${DASHBOARD_CANVAS_HEIGHT}px`,
            transform: `translate(-50%, -50%) scale(${canvasScale})`,
            transformOrigin: "center center"
          }}
        >
          {widgetOrder.map((key) => {
            const style = activeStyles[key];
            if (!style?.enabled) return null;
            return (
              <WidgetFrame key={key} cardKey={key} styleData={style} compact={false} editable={true} scale={canvasScale}>
                <WidgetContent cardKey={key} compact={false} />
              </WidgetFrame>
            );
          })}
        </div>
      ) : (
        <div className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2" />
      )}
    </div>
  );
}

function WidgetFrame({
  cardKey,
  styleData,
  children,
  compact,
  editable,
  scale
}: {
  cardKey: string;
  styleData: CardStyle;
  children: React.ReactNode;
  compact?: boolean;
  editable: boolean;
  scale: number;
}) {
  const editing = useLayoutEditStore((state) => state.editing);
  const updateCard = useLayoutEditStore((state) => state.updateCard);
  const updateCardSize = useLayoutEditStore((state) => state.updateCardSize);
  const actionRef = useRef<EditAction | null>(null);
  if (!styleData?.enabled) return null;
  const base = basePositions[cardKey] || { x: 0, y: 0 };
  const x = styleData.offsetX ?? base.x;
  const y = styleData.offsetY ?? base.y;

  const stopAction = (event: React.PointerEvent<HTMLDivElement>) => {
    if (actionRef.current?.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      actionRef.current = null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.76 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: editing ? 1 : 1.025 }}
      className={cn("absolute", editing && "z-40")}
      style={{
        width: styleData.width,
        height: styleData.height,
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        zIndex: styleData.order
      }}
    >
      {children}
      {editing && editable && (
        <div
          className={cn(
            "absolute inset-0 z-50 touch-none select-none border border-dashed border-[var(--color-brand)] bg-[rgba(78,205,196,0.08)] shadow-[0_16px_42px_rgba(47,79,82,0.16)] outline outline-1 outline-white/60",
            compact ? "rounded-[28px]" : "rounded-[40px]"
          )}
          style={{ cursor: "move" }}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.setPointerCapture?.(event.pointerId);
            actionRef.current = {
              mode: "move",
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              startOffsetX: x,
              startOffsetY: y
            };
          }}
          onPointerMove={(event) => {
            const action = actionRef.current;
            if (!action || action.pointerId !== event.pointerId) return;
            event.preventDefault();
            const deltaX = (event.clientX - action.startX) / scale;
            const deltaY = (event.clientY - action.startY) / scale;
            if (action.mode === "move") {
              updateCard(cardKey, action.startOffsetX + deltaX, action.startOffsetY + deltaY);
              return;
            }
            updateCardSize(
              cardKey,
              Math.max(MIN_CARD_WIDTH, action.startWidth + deltaX),
              Math.max(MIN_CARD_HEIGHT, action.startHeight + deltaY)
            );
          }}
          onPointerUp={stopAction}
          onPointerCancel={stopAction}
        >
          <div
            className="absolute -bottom-1 -right-1 grid h-9 w-9 cursor-nwse-resize place-items-center rounded-br-[34px] rounded-tl-2xl border border-white/75 bg-white/82 text-[var(--color-brand)] shadow-[0_10px_24px_rgba(47,79,82,0.15)] backdrop-blur"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              event.currentTarget.parentElement?.setPointerCapture?.(event.pointerId);
              actionRef.current = {
                mode: "resize",
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                startWidth: styleData.width,
                startHeight: styleData.height
              };
            }}
            title="拖拽调整尺寸"
          >
            <MoveDiagonal2 className="h-4 w-4" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

function WidgetContent({ cardKey, compact }: { cardKey: string; compact: boolean }) {
  if (cardKey === "artCard") return <ArtCard compact={compact} />;
  if (cardKey === "hiCard") return <WelcomeCard compact={compact} />;
  if (cardKey === "navCard") return <NavCard compact={compact} />;
  if (cardKey === "clockCard") return <ClockCard compact={compact} />;
  if (cardKey === "calendarCard") return <CalendarCard compact={compact} />;
  if (cardKey === "musicCard") return <MusicCard compact={compact} />;
  if (cardKey === "socialButtons") return <SocialButtonsCard compact={compact} />;
  if (cardKey === "shareCard") return <ShareCard compact={compact} />;
  if (cardKey === "articleCard") return <LatestArticleCard compact={compact} />;
  if (cardKey === "writeButtons") return <WriteCard compact={compact} />;
  if (cardKey === "likePosition") return <LikeCard compact={compact} />;
  return null;
}

function WelcomeCard({ compact = false }: { compact?: boolean }) {
  const site = useConfigStore((state) => state.siteContent);
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 18) return "Good Afternoon";
    if (hour >= 18 && hour < 22) return "Good Evening";
    return "Good Night";
  }, []);
  return (
    <div className={cn("card flex h-full w-full flex-col items-center justify-center overflow-hidden text-center", compact ? "p-3" : "p-6")}>
      <Link href="/live2d" className="block">
        <img
          src={site.meta.avatar}
          alt={site.meta.username}
          className={cn("mx-auto rounded-full border border-white/70 object-cover shadow-[0_16px_34px_rgba(51,79,82,0.12)]", compact ? "h-16 w-16" : "h-[120px] w-[120px]")}
        />
      </Link>
      <h1 className={cn("font-averia leading-tight", compact ? "mt-2 text-base" : "mt-4 text-2xl")}>
        {greeting}
        <br />
        I&apos;m <span className={cn("text-linear", compact ? "text-xl" : "text-[32px]")}>{site.meta.username}</span> , Nice to
        <br />
        meet you!
      </h1>
    </div>
  );
}

function ArtCard({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const site = useConfigStore((state) => state.siteContent);
  const image = site.artImages.find((item) => item.id === site.currentArtImageId) || site.artImages[0];
  return (
    <button onClick={() => router.push("/pictures")} className={cn("card block h-full w-full overflow-hidden text-left", compact ? "p-1.5" : "p-2")}>
      <img src={image?.url || "/images/art/rain-window.svg"} alt="wall art" className={cn("h-full w-full object-cover", compact ? "rounded-[24px]" : "rounded-[32px]")} />
    </button>
  );
}

function ClockCard({ compact = false }: { compact?: boolean }) {
  const showSeconds = useConfigStore((state) => state.siteContent.clockShowSeconds);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), showSeconds ? 1000 : 5000);
    return () => window.clearInterval(id);
  }, [showSeconds]);
  const parts = [
    now.getHours().toString().padStart(2, "0"),
    now.getMinutes().toString().padStart(2, "0"),
    showSeconds ? now.getSeconds().toString().padStart(2, "0") : null
  ].filter(Boolean) as string[];
  return (
    <div className="card flex h-full w-full items-center justify-center overflow-hidden p-2">
      <div className={cn("flex items-center gap-1.5 rounded-[28px] bg-[rgba(123,136,142,0.13)]", compact ? "scale-[0.78] p-2" : "p-3")}>
        {parts.map((part, index) => (
          <span className="flex items-center gap-1" key={index}>
            {index > 0 && <span className="mx-1 flex flex-col gap-2"><i className="h-1.5 w-1.5 bg-[var(--color-primary)]" /><i className="h-1.5 w-1.5 bg-[var(--color-primary)]" /></span>}
            <SegmentDigit value={Number(part[0])} />
            <SegmentDigit value={Number(part[1])} />
          </span>
        ))}
      </div>
    </div>
  );
}

function SegmentDigit({ value }: { value: number }) {
  const segments = [
    [1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 0, 0, 0, 0],
    [1, 1, 0, 1, 1, 0, 1],
    [1, 1, 1, 1, 0, 0, 1],
    [0, 1, 1, 0, 0, 1, 1],
    [1, 0, 1, 1, 0, 1, 1],
    [1, 0, 1, 1, 1, 1, 1],
    [1, 1, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1]
  ][value] || [];
  return (
    <svg width="29" height="52" viewBox="0 0 29 52" fill="none">
      {[
        "M4.2 3.5C2.8 2.3 3.7 0 5.5 0h17.2c1.9 0 2.7 2.3 1.3 3.5l-.4.4c-.4.3-.8.4-1.3.4H5.9c-.5 0-.9-.2-1.3-.5z",
        "M24.9 4.3c1.3-1.1 3.3-.2 3.3 1.5v16.1c0 1.6-1.7 2.5-3.1 1.7l-.3-.2c-.6-.4-.9-1-.9-1.7V6.1c0-.6.2-1.1.7-1.5z",
        "M25.2 28.5c1.3-.8 3 .2 3 1.7v16.4c0 1.8-2.2 2.7-3.4 1.4l-.4-.3c-.3-.4-.5-.9-.5-1.4V30.4c0-.7.4-1.4 1-1.7z",
        "M23.9 48.6C25.1 49.9 24.2 52 22.5 52H5.7c-1.8 0-2.7-2.1-1.5-3.4l.4-.3c.3-.4.9-.6 1.4-.6h16.2c.5 0 1 .2 1.4.6z",
        "M3.5 47.8C2.2 49.1 0 48.2 0 46.4V30.2c0-1.6 1.7-2.5 3.1-1.7l.3.2c.6.4.9 1 .9 1.7v15.7c0 .5-.2 1-.5 1.4z",
        "M3.1 23.5C1.7 24.4 0 23.4 0 21.9V5.7C0 3.9 2.1 3 3.4 4.2l.3.4c.4.4.6.9.6 1.4v15.6c0 .7-.4 1.3-.9 1.7z",
        "M3.9 24.1c.3-.2.6-.3 1-.3h18.4c.4 0 .7.1 1 .3l.3.2c1.3.8 1.3 2.7 0 3.5l-.3.1c-.3.2-.6.3-1 .3H4.9c-.4 0-.7-.1-1-.3l-.3-.2c-1.3-.8-1.3-2.6 0-3.4z"
      ].map((d, index) => (
        <path key={index} d={d} fill={segments[index] ? "var(--color-primary)" : "rgba(0,0,0,0.06)"} />
      ))}
    </svg>
  );
}

function CalendarCard({ compact = false }: { compact?: boolean }) {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const start = (first.getDay() + 6) % 7;
  const days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const week = ["一", "二", "三", "四", "五", "六", "日"];
  return (
    <div className="card flex h-full w-full flex-col p-5">
      <div className="text-secondary text-sm">{today.getFullYear()}/{today.getMonth() + 1}/{today.getDate()} {week[(today.getDay() + 6) % 7]}</div>
      <div className="text-secondary mt-4 grid flex-1 grid-cols-7 gap-2 text-sm">
        {week.map((item) => <div className="text-center font-medium" key={item}>{item}</div>)}
        {Array.from({ length: start }).map((_, index) => <div key={`e-${index}`} />)}
        {Array.from({ length: days }).map((_, index) => {
          const day = index + 1;
          return <div key={day} className={cn("grid place-items-center rounded-xl", day === today.getDate() && "bg-linear font-semibold text-white")}>{day}</div>;
        })}
      </div>
    </div>
  );
}

function MusicCard({ compact = false }: { compact?: boolean }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="card flex h-full w-full items-center gap-3 rounded-[28px] px-4">
      <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/60" onClick={() => setPlaying((value) => !value)} aria-label="play">
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">Raincat soft loop</div>
        <div className="mt-2 h-1.5 rounded-full bg-white/60">
          <motion.div className="h-full rounded-full bg-linear" animate={{ width: playing ? "72%" : "28%" }} />
        </div>
      </div>
      <Music2 className="h-5 w-5 text-[var(--color-secondary)]" />
    </div>
  );
}

function SocialButtonsCard({ compact = false }: { compact?: boolean }) {
  const site = useConfigStore((state) => state.siteContent);
  const links = sortSocialLinks(site.socialLinks).filter((item) => item.enabled);
  return (
    <div className="card flex h-full w-full flex-wrap items-center justify-center gap-3 overflow-hidden p-4">
      {links.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          title={item.label}
          className="flex h-12 max-w-[150px] items-center gap-2 rounded-[15px] border border-white/75 bg-white/55 px-3 text-sm font-semibold shadow-[0_10px_24px_rgba(51,79,82,0.08)] transition hover:-translate-y-0.5 hover:bg-white/78"
        >
          <SocialMark icon={item.icon} className="h-7 w-7" />
          <span className="truncate">{item.label}</span>
        </a>
      ))}
    </div>
  );
}

function ShareCard({ compact = false }: { compact?: boolean }) {
  const { data } = usePublicJson<ShareItem[]>("/share/index.json", []);
  const item = data[0];
  return (
    <Link href="/share" className="card flex h-full w-full flex-col justify-between p-5">
      <div className="flex items-center justify-between">
        <Sparkles className="h-5 w-5 text-[var(--color-brand)]" />
        <span className="text-secondary text-xs">Share</span>
      </div>
      <div>
        <div className="line-clamp-1 font-medium">{item?.name || "推荐分享"}</div>
        <p className="text-secondary mt-2 line-clamp-2 text-xs">{item?.description || "一些值得收藏的小东西。"}</p>
      </div>
    </Link>
  );
}

function LatestArticleCard({ compact = false }: { compact?: boolean }) {
  const { data } = usePublicJson<BlogIndexItem[]>("/blogs/index.json", []);
  const item = [...data].filter((blog) => !blog.hidden).sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0];
  return (
    <Link href={item ? `/blog/${item.slug}` : "/blog"} className="card flex h-full w-full flex-col justify-between p-5">
      <div className="flex items-center justify-between">
        <BookOpenText className="h-5 w-5 text-[var(--color-brand)]" />
        <span className="text-secondary text-xs">Latest</span>
      </div>
      <div>
        <div className="line-clamp-2 font-medium">{item?.title || "暂无文章"}</div>
        <p className="text-secondary mt-2 line-clamp-2 text-xs">{item?.summary || "开始写第一篇文章吧。"}</p>
      </div>
    </Link>
  );
}

function WriteCard({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/write/new" className="brand-btn flex h-full w-full items-center justify-center gap-2 px-5 text-sm font-medium">
      <Settings2 className="h-4 w-4" />
      写文章
    </Link>
  );
}

function LikeCard({ compact = false }: { compact?: boolean }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(411);
  return (
    <button
      onClick={() => {
        if (!liked) setCount((value) => value + 1);
        setLiked(true);
      }}
      className="card grid h-full w-full place-items-center rounded-full"
      aria-label="like"
    >
      <Heart className={cn("h-7 w-7", liked ? "fill-rose-400 text-rose-400" : "fill-rose-200 text-rose-200")} />
      <span className="absolute -right-1 -top-2 rounded-full bg-rose-400 px-1.5 py-0.5 text-[10px] text-white">{count}</span>
    </button>
  );
}

function NavCard({ compact = false }: { compact?: boolean }) {
  const meta = useConfigStore((state) => state.siteContent.meta);
  return (
    <div className="card flex h-full w-full flex-col p-6">
      <div className="flex items-center gap-3">
        <img src={meta.avatar} alt={meta.username} className="h-[52px] w-[52px] rounded-full object-cover" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-averia text-[20px] font-semibold text-[var(--color-primary)]">{meta.title || meta.username}</span>
            <span className="shrink-0 text-[12px] font-medium text-[var(--color-brand)]">(开发中)</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-1 flex-col gap-2.5">
        {navLinks.map((item, index) => {
          const Icon = item.icon;
          const active = index === 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex min-h-[58px] items-center gap-4 rounded-[999px] px-5 transition-all",
                active ? "bg-white/80 shadow-[0_12px_26px_rgba(51,79,82,0.05)]" : "bg-transparent hover:bg-white/38"
              )}
            >
              <Icon className={cn("h-[19px] w-[19px] shrink-0", active ? "text-[var(--color-brand)]" : "text-[#8a97a0]")} strokeWidth={1.85} />
              <span className={cn("font-ui-cute text-[16px] font-semibold leading-none", active ? "text-[var(--color-primary)]" : "text-[#6f7f88]")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
