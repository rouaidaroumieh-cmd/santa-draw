"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_LANG, LANG_STORAGE_KEY, translate, type Lang } from "./i18n";

const CHANGE_EVENT = "santa-lang-change";

function readLang(): Lang {
  return window.localStorage.getItem(LANG_STORAGE_KEY) === "fr" ? "fr" : DEFAULT_LANG;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The visitor's language. English on the server and until the saved choice is read. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, readLang, () => DEFAULT_LANG);
}

export function setLang(lang: Lang): void {
  window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Returns a translator bound to the current language. */
export function useT(): (text: string, vars?: Record<string, string | number>) => string {
  const lang = useLang();
  return useCallback((text, vars) => translate(lang, text, vars), [lang]);
}
