"use client";

export function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function fileToBase64NoPrefix(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").replace(/^data:[^;]+;base64,/, ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function hashFileSHA256(file: File) {
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes).map((item) => item.toString(16).padStart(2, "0")).join("").slice(0, 16);
}
