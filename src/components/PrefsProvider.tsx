"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { createTranslator, type Lang, type Translate } from "@/lib/i18n/dictionaries";
import { LANG_COOKIE, THEME_COOKIE, preferenceCookie, type Theme } from "@/lib/prefs/prefs";

type Prefs = {
  lang: Lang;
  theme: Theme;
  /** The theme actually shown ("system" resolved through prefers-color-scheme). */
  resolvedTheme: "light" | "dark";
  t: Translate;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
};

const PrefsContext = createContext<Prefs | null>(null);

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribeSystemTheme(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function useSystemDark(): boolean {
  return useSyncExternalStore(subscribeSystemTheme, () => window.matchMedia(DARK_QUERY).matches, () => false);
}

export function PrefsProvider({ lang, theme: initialTheme, children }: { lang: Lang; theme: Theme; children: ReactNode }) {
  const router = useRouter();
  const [theme, setThemeState] = useState(initialTheme);
  const systemDark = useSystemDark();

  const setTheme = useCallback((next: Theme) => {
    document.cookie = preferenceCookie(THEME_COOKIE, next);
    document.documentElement.dataset.theme = next;
    setThemeState(next);
  }, []);

  const setLang = useCallback(
    (next: Lang) => {
      document.cookie = preferenceCookie(LANG_COOKIE, next);
      document.documentElement.lang = next;
      router.refresh();
    },
    [router],
  );

  const value = useMemo<Prefs>(
    () => ({
      lang,
      theme,
      resolvedTheme: theme === "system" ? (systemDark ? "dark" : "light") : theme,
      t: createTranslator(lang),
      setLang,
      setTheme,
    }),
    [lang, theme, systemDark, setLang, setTheme],
  );

  return <PrefsContext value={value}>{children}</PrefsContext>;
}

export function usePrefs(): Prefs {
  const prefs = useContext(PrefsContext);
  if (!prefs) throw new Error("usePrefs must be used inside <PrefsProvider>");
  return prefs;
}
