import "server-only";
import { cookies, headers } from "next/headers";
import { createTranslator } from "@/lib/i18n/dictionaries";
import { LANG_COOKIE, THEME_COOKIE, parseLang, parseTheme } from "./prefs";

export async function getPrefs() {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const lang = parseLang(cookieStore.get(LANG_COOKIE)?.value, headerStore.get("accept-language"));
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);
  return { lang, theme, t: createTranslator(lang) };
}
