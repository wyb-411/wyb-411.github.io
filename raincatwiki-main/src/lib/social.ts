import type { SocialIcon, SocialLink } from "@/types";

export type SocialPlatform = {
  id: SocialIcon;
  label: string;
  short: string;
  color: string;
  textColor: string;
  placeholder: string;
};

export const socialPlatforms: SocialPlatform[] = [
  { id: "github", label: "GitHub", short: "GH", color: "#24292f", textColor: "#ffffff", placeholder: "https://github.com/username" },
  { id: "juejin", label: "掘金", short: "掘", color: "#1e80ff", textColor: "#ffffff", placeholder: "https://juejin.cn/user/..." },
  { id: "mail", label: "邮箱", short: "@", color: "#66cfd0", textColor: "#ffffff", placeholder: "mailto:name@example.com" },
  { id: "x", label: "X", short: "X", color: "#111111", textColor: "#ffffff", placeholder: "https://x.com/username" },
  { id: "telegram", label: "Telegram", short: "TG", color: "#2aabee", textColor: "#ffffff", placeholder: "https://t.me/username" },
  { id: "wechat", label: "微信", short: "微", color: "#2aae67", textColor: "#ffffff", placeholder: "微信号或二维码链接" },
  { id: "facebook", label: "Facebook", short: "f", color: "#1877f2", textColor: "#ffffff", placeholder: "https://facebook.com/username" },
  { id: "tiktok", label: "TikTok", short: "TT", color: "#111111", textColor: "#ffffff", placeholder: "https://www.tiktok.com/@username" },
  { id: "instagram", label: "Instagram", short: "IG", color: "#e4405f", textColor: "#ffffff", placeholder: "https://instagram.com/username" },
  { id: "weibo", label: "微博", short: "博", color: "#e6162d", textColor: "#ffffff", placeholder: "https://weibo.com/username" },
  { id: "xiaohongshu", label: "小红书", short: "红", color: "#ff2442", textColor: "#ffffff", placeholder: "https://www.xiaohongshu.com/user/profile/..." },
  { id: "zhihu", label: "知乎", short: "知", color: "#1772f6", textColor: "#ffffff", placeholder: "https://www.zhihu.com/people/..." },
  { id: "bilibili", label: "Bilibili", short: "B", color: "#fb7299", textColor: "#ffffff", placeholder: "https://space.bilibili.com/..." },
  { id: "qq", label: "QQ", short: "QQ", color: "#12b7f5", textColor: "#ffffff", placeholder: "QQ 号或资料页链接" },
  { id: "link", label: "链接", short: "↗", color: "#7b888e", textColor: "#ffffff", placeholder: "https://example.com" }
];

export const socialPlatformMap = socialPlatforms.reduce(
  (acc, item) => ({ ...acc, [item.id]: item }),
  {} as Record<SocialIcon, SocialPlatform>
);

export function sortSocialLinks(links: SocialLink[]) {
  return [...links].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}
