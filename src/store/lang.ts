import { create } from 'zustand';

export type Lang = 'ru' | 'kk' | 'en';

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export const useLangStore = create<LangState>((set) => ({
  lang: 'ru',
  setLang: (lang) => set({ lang }),
}));
