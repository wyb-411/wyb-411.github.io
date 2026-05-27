"use client";

import { useEffect, useState } from "react";
import { fetchJson, fetchText } from "@/lib/utils";

export function usePublicJson<T>(url: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchJson<T>(url, fallback).then((value) => {
      if (!active) return;
      setData(value);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [url]);
  return { data, loading };
}

export function usePublicText(url: string, fallback = "") {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchText(url, fallback).then((value) => {
      if (!active) return;
      setData(value);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [url]);
  return { data, loading };
}
