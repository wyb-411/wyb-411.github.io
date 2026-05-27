"use client";

import { create } from "zustand";
import { defaultCardStyles, defaultSiteConfig, normalizeSiteConfig } from "@/lib/defaults";
import { fetchJson } from "@/lib/utils";
import type { CardStyles, SiteConfig } from "@/types";

type ConfigState = {
  siteContent: SiteConfig;
  cardStyles: CardStyles;
  configDialogOpen: boolean;
  hydrated: boolean;
  loadConfig: () => Promise<void>;
  setSiteContent: (value: SiteConfig) => void;
  setCardStyles: (value: CardStyles) => void;
  setConfigDialogOpen: (open: boolean) => void;
  applyTheme: (value?: SiteConfig) => void;
};

export const useConfigStore = create<ConfigState>((set, get) => ({
  siteContent: defaultSiteConfig,
  cardStyles: defaultCardStyles,
  configDialogOpen: false,
  hydrated: false,
  loadConfig: async () => {
    const [siteContent, cardStyles] = await Promise.all([
      fetchJson<SiteConfig>("/site/config.json", defaultSiteConfig),
      fetchJson<CardStyles>("/site/card-styles.json", defaultCardStyles)
    ]);
    const normalizedSite = normalizeSiteConfig(siteContent);
    set({ siteContent: normalizedSite, cardStyles, hydrated: true });
    get().applyTheme(normalizedSite);
  },
  setSiteContent: (siteContent) => {
    set({ siteContent });
    get().applyTheme(siteContent);
  },
  setCardStyles: (cardStyles) => set({ cardStyles }),
  setConfigDialogOpen: (configDialogOpen) => set({ configDialogOpen }),
  applyTheme: (value) => {
    if (typeof document === "undefined") return;
    const site = value || get().siteContent;
    const root = document.documentElement;
    const theme = site.theme;
    root.style.setProperty("--color-brand", theme.colorBrand);
    root.style.setProperty("--color-brand-secondary", theme.colorBrandSecondary);
    root.style.setProperty("--color-primary", theme.colorPrimary);
    root.style.setProperty("--color-secondary", theme.colorSecondary);
    root.style.setProperty("--color-bg", theme.colorBg);
    root.style.setProperty("--color-border", theme.colorBorder);
    root.style.setProperty("--color-card", theme.colorCard);
    root.style.setProperty("--color-article", theme.colorArticle);
    site.backgroundColors.forEach((color, index) => {
      root.style.setProperty(`--bg-color-${index + 1}`, color);
    });
    document.title = site.meta.title;
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute("content", site.meta.description);
  }
}));
