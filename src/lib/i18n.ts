import { FR } from "./i18n-fr";

export type Lang = "en" | "fr";

export const DEFAULT_LANG: Lang = "en";
export const LANG_STORAGE_KEY = "santa-lang";

/**
 * Translates an English source string. The English text is the key: when no
 * French entry exists the English text is shown, so the UI never breaks.
 * `{name}` placeholders are replaced from `vars`.
 */
export function translate(lang: Lang, text: string, vars?: Record<string, string | number>): string {
  const base = lang === "fr" ? (FR[text] ?? text) : text;
  if (!vars) return base;
  return base.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}
