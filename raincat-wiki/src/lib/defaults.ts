import type { CardStyles, SiteConfig } from "@/types";

export const defaultSiteConfig: SiteConfig = {
  meta: {
    title: "Raincat Wiki",
    username: "Raincat",
    description: "一只把日常、灵感和小小作品收进玻璃罐里的雨猫。",
    avatar: "/images/avatar/raincat-reading.png",
    favicon: "/favicon.png"
  },
  theme: {
    colorBrand: "#35bfab",
    colorBrandSecondary: "#1fc9e7",
    colorPrimary: "#334f52",
    colorSecondary: "#7b888e",
    colorBg: "#eeeeee",
    colorBorder: "#ffffff",
    colorCard: "#ffffff66",
    colorArticle: "#ffffffcc"
  },
  backgroundColors: ["#dff7ef", "#fff7cc", "#dff4ff", "#f6e7ff"],
  artImages: [
    { id: "rain-window", url: "/images/art/rain-window.svg", label: "Rain Window" },
    { id: "cat-desk", url: "/images/art/cat-desk.svg", label: "Cat Desk" }
  ],
  currentArtImageId: "rain-window",
  socialLinks: [
    { id: "github", label: "GitHub", url: "https://github.com/wyb-411/rain-wiki", icon: "github", order: 1, enabled: true },
    { id: "bilibili", label: "Bilibili", url: "https://www.bilibili.com/", icon: "bilibili", order: 2, enabled: true },
    { id: "xiaohongshu", label: "小红书", url: "https://www.xiaohongshu.com/", icon: "xiaohongshu", order: 3, enabled: true },
    { id: "mail", label: "邮箱", url: "mailto:hello@example.com", icon: "mail", order: 4, enabled: true }
  ],
  hideEditButton: false,
  isCachePem: false,
  enableCategories: true,
  clockShowSeconds: false,
  summaryInContent: false
};

export const defaultCardStyles: CardStyles = {
  artCard: { width: 360, height: 200, order: 3, offsetX: null, offsetY: null, enabled: true },
  hiCard: { width: 360, height: 288, order: 1, offsetX: null, offsetY: null, enabled: true },
  clockCard: { width: 232, height: 132, order: 4, offset: 92, offsetX: null, offsetY: null, enabled: true },
  calendarCard: { width: 350, height: 286, order: 5, offsetX: null, offsetY: null, enabled: true },
  musicCard: { width: 293, height: 66, order: 6, offset: 120, offsetX: null, offsetY: null, enabled: true },
  socialButtons: { width: 420, height: 96, order: 6, offsetX: null, offsetY: null, enabled: true },
  shareCard: { width: 266, height: 160, order: 7, offsetX: null, offsetY: null, enabled: true },
  articleCard: { width: 266, height: 160, order: 8, offsetX: null, offsetY: null, enabled: true },
  writeButtons: { width: 180, height: 42, order: 8, offsetX: null, offsetY: null, enabled: true },
  navCard: { width: 280, height: 434, order: 2, offsetX: null, offsetY: null, enabled: true },
  likePosition: { width: 54, height: 54, order: 8, offsetX: null, offsetY: null, enabled: true }
};

export const githubConfig = {
  owner: process.env.NEXT_PUBLIC_GITHUB_OWNER || "wyb-411",
  repo: process.env.NEXT_PUBLIC_GITHUB_REPO || "rain-wiki",
  branch: process.env.NEXT_PUBLIC_GITHUB_BRANCH || "main",
  appId: process.env.NEXT_PUBLIC_GITHUB_APP_ID || "",
  encryptKey: process.env.NEXT_PUBLIC_GITHUB_ENCRYPT_KEY || "raincat-wiki-session-key"
};

export function normalizeSiteConfig(value: SiteConfig): SiteConfig {
  const site = value || defaultSiteConfig;
  const socialLinks = (site.socialLinks?.length ? site.socialLinks : defaultSiteConfig.socialLinks).map((item, index) => ({
    ...item,
    order: item.order ?? index + 1,
    enabled: item.enabled ?? true
  }));

  return {
    ...defaultSiteConfig,
    ...site,
    meta: { ...defaultSiteConfig.meta, ...site.meta },
    theme: { ...defaultSiteConfig.theme, ...site.theme },
    backgroundColors: site.backgroundColors?.length ? site.backgroundColors : defaultSiteConfig.backgroundColors,
    artImages: site.artImages?.length ? site.artImages : defaultSiteConfig.artImages,
    currentArtImageId: site.currentArtImageId || site.artImages?.[0]?.id || defaultSiteConfig.currentArtImageId,
    socialLinks
  };
}
