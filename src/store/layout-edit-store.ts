"use client";

import { create } from "zustand";
import type { CardStyles } from "@/types";

type LayoutEditState = {
  editing: boolean;
  draft: CardStyles | null;
  startEditing: (styles: CardStyles) => void;
  updateCard: (key: string, x: number, y: number) => void;
  updateCardSize: (key: string, width: number, height: number) => void;
  cancelEditing: () => void;
  saveEditing: () => CardStyles | null;
};

export const useLayoutEditStore = create<LayoutEditState>((set, get) => ({
  editing: false,
  draft: null,
  startEditing: (styles) => set({ editing: true, draft: structuredClone(styles) }),
  updateCard: (key, x, y) => set((state) => {
    if (!state.draft?.[key]) return state;
    return {
      draft: {
        ...state.draft,
        [key]: {
          ...state.draft[key],
          offsetX: Math.round(x),
          offsetY: Math.round(y)
        }
      }
    };
  }),
  updateCardSize: (key, width, height) => set((state) => {
    if (!state.draft?.[key]) return state;
    return {
      draft: {
        ...state.draft,
        [key]: {
          ...state.draft[key],
          width: Math.round(width),
          height: Math.round(height)
        }
      }
    };
  }),
  cancelEditing: () => set({ editing: false, draft: null }),
  saveEditing: () => {
    const draft = get().draft;
    set({ editing: false, draft: null });
    return draft;
  }
}));
