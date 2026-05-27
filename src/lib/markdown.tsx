"use client";

import { marked } from "marked";
import katex from "katex";
import { useEffect, useMemo, useState } from "react";

export type TocItem = {
  id: string;
  text: string;
  level: number;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function renderMath(source: string) {
  return source
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
      try {
        return katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false });
      } catch {
        return _;
      }
    })
    .replace(/\$([^\n$]+?)\$/g, (_, expr) => {
      try {
        return katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false });
      } catch {
        return _;
      }
    });
}

export function parseToc(markdown: string): TocItem[] {
  return markdown
    .split("\n")
    .map((line) => {
      const match = /^(#{1,3})\s+(.+)$/.exec(line);
      if (!match) return null;
      const text = match[2].replace(/[#*_`]/g, "").trim();
      return { id: slugify(text), text, level: match[1].length };
    })
    .filter(Boolean) as TocItem[];
}

export function renderMarkdown(markdown: string) {
  const renderer = new marked.Renderer();
  renderer.heading = ({ tokens, depth }) => {
    const text = tokens.map((token) => "text" in token ? String(token.text) : "").join("");
    const id = slugify(text);
    return `<h${depth} id="${id}">${text}</h${depth}>`;
  };
  renderer.link = ({ href, title, tokens }) => {
    const text = tokens.map((token) => "text" in token ? String(token.text) : "").join("");
    const safeHref = href || "#";
    const titleAttr = title ? ` title="${title}"` : "";
    return `<a href="${safeHref}"${titleAttr} target="${safeHref.startsWith("#") ? "_self" : "_blank"}" rel="noreferrer">${text}</a>`;
  };
  renderer.image = ({ href, title, text }) => {
    const titleAttr = title ? ` title="${title}"` : "";
    return `<img src="${href}" alt="${text || ""}"${titleAttr} loading="lazy" />`;
  };
  marked.setOptions({ gfm: true, breaks: false, renderer });
  return marked.parse(renderMath(markdown)) as string;
}

export function MarkdownView({ markdown, className = "" }: { markdown: string; className?: string }) {
  const [html, setHtml] = useState("");
  const rendered = useMemo(() => renderMarkdown(markdown), [markdown]);
  useEffect(() => setHtml(rendered), [rendered]);
  return <div className={`prose ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
