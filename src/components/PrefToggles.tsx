"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "./Icons";
import { usePrefs } from "./PrefsProvider";
import { nextTheme } from "@/lib/prefs/prefs";

const btn =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-line bg-surface px-3 text-sm font-bold hover:bg-surface-2";

export function PrefToggles() {
  const { lang, theme, t, setLang, setTheme } = usePrefs();
  const ThemeIcon = theme === "dark" ? MoonIcon : theme === "light" ? SunIcon : MonitorIcon;
  const nextLang = lang === "es" ? "en" : "es";
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={btn}
        onClick={() => setLang(nextLang)}
        aria-label={t(nextLang === "en" ? "prefs.switchToEn" : "prefs.switchToEs")}
        data-testid="lang-toggle"
      >
        {nextLang.toUpperCase()}
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => setTheme(nextTheme(theme))}
        aria-label={t(`prefs.theme.${theme}`)}
        title={t(`prefs.theme.${theme}`)}
        data-testid="theme-toggle"
      >
        <ThemeIcon width={18} height={18} />
      </button>
    </div>
  );
}
