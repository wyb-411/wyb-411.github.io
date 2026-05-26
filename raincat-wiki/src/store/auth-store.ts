"use client";

import { create } from "zustand";
import { githubConfig } from "@/lib/defaults";

const TOKEN_KEY = "raincat-github-token";
const PEM_KEY = "raincat-pem";

type TokenCache = {
  token: string;
  expiresAt?: string;
};

type AuthState = {
  isAuth: boolean;
  privateKey: string | null;
  setPrivateKey: (pem: string, cache?: boolean) => Promise<void>;
  clearAuth: () => void;
  refreshAuthState: () => Promise<void>;
};

async function encrypt(text: string, secret: string) {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  const key = await crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt"]);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(text));
  const output = new Uint8Array(iv.length + encrypted.byteLength);
  output.set(iv, 0);
  output.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...output));
}

async function decrypt(payload: string, secret: string) {
  const raw = Uint8Array.from(atob(payload), (item) => item.charCodeAt(0));
  const iv = raw.slice(0, 12);
  const data = raw.slice(12);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  const key = await crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["decrypt"]);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(decrypted);
}

export async function getCachedPem() {
  if (typeof sessionStorage === "undefined") return null;
  const payload = sessionStorage.getItem(PEM_KEY);
  if (!payload) return null;
  try {
    return await decrypt(payload, githubConfig.encryptKey);
  } catch {
    return null;
  }
}

export function getCachedToken() {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as TokenCache;
    if (!parsed?.token) return null;
    if (parsed.expiresAt && Date.parse(parsed.expiresAt) <= Date.now() + 60_000) {
      sessionStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return parsed.token;
  } catch {
    return raw;
  }
}

export function setCachedToken(token: string, expiresAt?: string) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ token, expiresAt } satisfies TokenCache));
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuth: false,
  privateKey: null,
  setPrivateKey: async (privateKey, cache) => {
    set({ privateKey, isAuth: true });
    if (cache && typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(PEM_KEY, await encrypt(privateKey, githubConfig.encryptKey));
    }
  },
  clearAuth: () => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(PEM_KEY);
    }
    set({ privateKey: null, isAuth: false });
  },
  refreshAuthState: async () => {
    const privateKey = await getCachedPem();
    set({ privateKey, isAuth: Boolean(privateKey || getCachedToken()) });
  }
}));

if (typeof window !== "undefined") {
  getCachedPem().then((privateKey) => {
    if (privateKey) useAuthStore.setState({ privateKey, isAuth: true });
    else useAuthStore.setState({ isAuth: Boolean(getCachedToken()) });
  });
}
