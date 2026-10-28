import type { Metadata } from "next";
import Link from "next/link";
import { ExternalIcon } from "@/components/Icons";
import { ReportAppButton } from "@/components/ReportAppButton";
import { getCurrentUser } from "@/lib/data/auth";
import { getAppBySlug } from "@/lib/data/catalog";
import { getPrefs } from "@/lib/prefs/server";

export async function generateMetadata({ params }: PageProps<"/app/[slug]">): Promise<Metadata> {
  const [{ slug }, { lang }] = await Promise.all([params, getPrefs()]);
  const app = await getAppBySlug(slug);
  return app ? { title: app.name[lang], description: app.tagline[lang] } : {};
}

/** App detail page and stable share target (RF-005, RF-006, RF-015). */
export default async function AppPage({ params }: PageProps<"/app/[slug]">) {
  const [{ slug }, { t, lang }] = await Promise.all([params, getPrefs()]);
  const [app, user] = await Promise.all([getAppBySlug(slug), getCurrentUser()]);

  if (!app) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-20 text-center" data-testid="app-unavailable">
        <h1 className="font-display text-3xl font-extrabold">{t("app.unavailable.title")}</h1>
        <p className="text-muted">{t("app.unavailable.body")}</p>
        <Link href="/" className="rounded-full bg-accent px-5 py-3 font-extrabold text-on-accent">
          {t("app.backToFeed")}
        </Link>
      </div>
    );
  }

  const rows: [string, string][] = [
    [t("app.version"), app.version.version],
    [t("app.category"), t(`category.${app.category}`)],
  ];

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8" data-testid="app-details">
      <header className="flex items-start gap-4">
        <span className="h-16 w-16 shrink-0 rounded-3xl" style={{ background: app.accent }} aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <span className="self-start rounded-full border border-line px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted">
            {t(`app.provenance.${app.provenance}`)}
          </span>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">{app.name[lang]}</h1>
          <p className="text-muted">{t("app.by", { creator: app.creatorName })}</p>
        </div>
      </header>

      <p className="text-lg">{app.tagline[lang]}</p>
      <p className="text-muted">{app.description[lang]}</p>

      <div className="flex flex-wrap gap-3">
        <Link href={`/?app=${app.slug}`} className="rounded-full bg-accent px-6 py-3 font-extrabold text-on-accent">
          {t("app.tryInFeed")}
        </Link>
        {app.externalUrl && (
          <a
            href={app.externalUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 font-bold"
          >
            {t("app.externalLink")} <ExternalIcon width={18} height={18} />
            <span className="sr-only">({t("app.externalNote")})</span>
          </a>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-3xl border border-line bg-surface p-5 sm:grid-cols-4">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-bold uppercase tracking-wider text-muted">{label}</dt>
            <dd className="font-bold">{value}</dd>
          </div>
        ))}
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">{t("app.stats")}</dt>
          <dd className="font-bold">{t("app.likes", { count: app.stats.likes })}</dd>
        </div>
      </dl>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-xl font-extrabold">{t("app.permissions")}</h2>
        <p className="text-muted">
          {app.version.permissions.length === 0 ? t("app.permissions.none") : app.version.permissions.join(", ")}
        </p>
      </section>

      <ReportAppButton appId={app.id} signedIn={user !== null} next={`/app/${app.slug}`} />
    </article>
  );
}
