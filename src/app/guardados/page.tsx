import type { Metadata } from "next";
import Link from "next/link";
import { getSavedApps } from "@/lib/data/catalog";
import { getPrefs } from "@/lib/prefs/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPrefs();
  return { title: t("nav.saved") };
}

/** Personal collection (RF-023). */
export default async function SavedPage() {
  const [{ t, lang }, saved] = await Promise.all([getPrefs(), getSavedApps()]);
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{t("saved.title")}</h1>
      {saved === null ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-muted">{t("saved.loginRequired")}</p>
          <Link href="/ingresar?next=/guardados" className="rounded-full bg-accent px-5 py-3 font-extrabold text-on-accent">
            {t("nav.login")}
          </Link>
        </div>
      ) : saved.length === 0 ? (
        <p className="text-muted">{t("saved.empty")}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {saved.map((app) => (
            <li key={app.id}>
              <Link href={`/app/${app.slug}`} className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-4 hover:bg-surface-2">
                <span className="h-12 w-12 shrink-0 rounded-2xl" style={{ background: app.accent }} aria-hidden="true" />
                <span className="flex min-w-0 flex-col">
                  <span className="font-display font-extrabold">{app.name[lang]}</span>
                  <span className="truncate text-sm text-muted">{app.tagline[lang]}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
