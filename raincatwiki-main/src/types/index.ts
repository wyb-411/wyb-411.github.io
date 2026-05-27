export type ThemeConfig = {
  colorBrand: string;
  colorBrandSecondary: string;
  colorPrimary: string;
  colorSecondary: string;
  colorBg: string;
  colorBorder: string;
  colorCard: string;
  colorArticle: string;
};

export type AssetItem = {
  id: string;
  url: string;
  label?: string;
};

export type SiteMeta = {
  title: string;
  username: string;
  description: string;
  avatar: string;
  favicon: string;
};

export type SocialIcon =
  | "github"
  | "juejin"
  | "mail"
  | "x"
  | "telegram"
  | "wechat"
  | "facebook"
  | "tiktok"
  | "instagram"
  | "weibo"
  | "xiaohongshu"
  | "zhihu"
  | "bilibili"
  | "qq"
  | "link";

export type SocialLink = {
  id: string;
  label: string;
  url: string;
  icon: SocialIcon;
  order: number;
  enabled: boolean;
};

export type SiteConfig = {
  meta: SiteMeta;
  theme: ThemeConfig;
  backgroundColors: string[];
  artImages: AssetItem[];
  currentArtImageId: string;
  socialLinks: SocialLink[];
  hideEditButton: boolean;
  isCachePem: boolean;
  enableCategories: boolean;
  clockShowSeconds: boolean;
  summaryInContent: boolean;
};

export type CardStyle = {
  width: number;
  height: number;
  order: number;
  offset?: number;
  offsetX: number | null;
  offsetY: number | null;
  enabled: boolean;
};

export type CardStyles = Record<string, CardStyle>;

export type BlogIndexItem = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  category?: string;
  cover?: string;
  hidden?: boolean;
};

export type BlogConfig = Omit<BlogIndexItem, "slug">;

export type ProjectItem = {
  id: string;
  name: string;
  year: number;
  cover: string;
  tags: string[];
  description: string;
  websiteUrl?: string;
  githubUrl?: string;
};

export type ShareItem = {
  id: string;
  name: string;
  logo: string;
  url: string;
  description: string;
  tags: string[];
  stars: number;
  views?: number;
  likes?: number;
};

export type BloggerItem = {
  id: string;
  name: string;
  avatar: string;
  url: string;
  stars: number;
  description: string;
  category: "blog" | "link";
};

export type PhotoItem = {
  id: string;
  url: string;
  date: string;
  description: string;
  rotate: number;
  x: number;
  y: number;
};

export type UploadedImage = {
  id: string;
  type: "file";
  file: File;
  previewUrl: string;
  hash?: string;
};

export type UrlImage = {
  id: string;
  type: "url";
  url: string;
};

export type WriteImage = UploadedImage | UrlImage;
