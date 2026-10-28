import { DEFAULT_LANG, isLang, type Lang } from "@/lib/i18n/dictionaries";

export const LANG_COOKIE = "loop_lang";
export const THEME_COOKIE = "loop_theme";

export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

export function parseLang(value: string | undefined | null, acceptLanguage?: string | null): Lang {
  if (isLang(value)) return value;
  const preferred = acceptLanguage?.split(",")[0]?.trim().slice(0, 2).toLowerCase();
  return isLang(preferred) ? preferred : DEFAULT_LANG;
}

export function parseTheme(value: string | undefined | null): Theme {
  return isTheme(value) ? value : "system";
}

export function nextTheme(theme: Theme): Theme {
  return THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
}

/** One year, readable by client code so the toggles can update it. */
export function preferenceCookie(name: string, value: string): string {
  return `${name}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
