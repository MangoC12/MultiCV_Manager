"use client";

import { create } from "zustand";
import type { PhotoSettings } from "@/types/resume";

type EditorUiStore = {
  draftPhotoSettings: PhotoSettings | null;
  setDraftPhotoSettings: (settings: PhotoSettings | null) => void;
  updateDraftPhotoSetting: (key: keyof PhotoSettings, value: number) => void;
};

export const useEditorUiStore = create<EditorUiStore>()((set) => ({
  draftPhotoSettings: null,
  setDraftPhotoSettings: (settings) => set({ draftPhotoSettings: settings }),
  updateDraftPhotoSetting: (key, value) =>
    set((state) => ({
      draftPhotoSettings: state.draftPhotoSettings
        ? { ...state.draftPhotoSettings, [key]: value }
        : null
    }))
}));
