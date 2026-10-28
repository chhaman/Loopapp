import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/data/auth";
import type { Localized } from "@/lib/domain/types";
import { getPrefs } from "@/lib/prefs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveReport, setAppStatus, updateFeedItem } from "./actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const TABS = ["feed", "reports", "audit", "metrics"] as const;
type Tab = (typeof TABS)[number];

const input = "rounded-xl border border-line bg-surface-2 px-3 py-2";
const smallBtn = "rounded-full border border-line px-3 py-1.5 text-sm font-bold hover:bg-surface-2";

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const [params, { t, lang }, user] = await Promise.all([searchParams, getPrefs(), getCurrentUser()]);
  const supabase = await createSupabaseServerClient();

  // Server-side authorization (TC-015). RLS denies the data anyway.
  if (!user?.isAdmin || !supabase) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center" data-testid="admin-forbidden">
        <h1 className="font-display text-2xl font-extrabold">{t("admin.forbidden")}</h1>
      </div>
    );
  }

  const tab: Tab = TABS.includes(params.tab as Tab) ? (params.tab as Tab) : "feed";
  const dateFormat = new Intl.DateTimeFormat(lang === "es" ? "es-AR" : "en-US", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{t("admin.title")}</h1>
      <nav className="flex flex-wrap gap-2" aria-label={t("admin.title")}>
        {TABS.map((id) => (
          <Link
            key={id}
            href={`/admin?tab=${id}`}
            aria-current={tab === id ? "page" : undefined}
            className={`rounded-full px-4 py-2 font-bold ${tab === id ? "bg-accent text-on-accent" : "border border-line"}`}
          >
            {t(`admin.tab.${id}`)}
          </Link>
        ))}
      </nav>
      {typeof params.error === "string" && (
        <p role="alert" className="rounded-xl border border-danger p-3 font-semibold text-danger">{params.error}</p>
      )}
      {params.done === "1" && <p role="status" className="font-semibold text-success">{t("admin.done")}</p>}

      {tab === "feed" && <FeedTab />}
      {tab === "reports" && <ReportsTab />}
      {tab === "audit" && <AuditTab />}
      {tab === "metrics" && <MetricsTab />}
    </div>
  );

  async function FeedTab() {
    const { data: apps } = await supabase!
      .from("apps")
      .select("id, slug, name, status, feed_items(position, featured)")
      .order("slug");
    return (
      <div className="flex flex-col gap-3">
        {(apps ?? []).map((app) => {
          const feed = (app.feed_items as unknown as { position: number; featured: boolean } | null) ?? null;
          return (
            <section key={app.id} className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-extrabold">
                  {(app.name as Localized)[lang]} <span className="text-sm font-normal text-muted">/{app.slug}</span>
                </h2>
                <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-bold uppercase">{t(`admin.status.${app.status as "published"}`)}</span>
              </div>
              <form action={updateFeedItem} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="appId" value={app.id} />
                <label className="flex flex-col text-xs font-bold text-muted">
                  {t("admin.position")}
                  <input name="position" type="number" min={0} defaultValue={feed?.position ?? 100} className={`${input} w-24`} />
                </label>
                <label className="flex items-center gap-2 pb-2 text-sm font-bold">
                  <input name="featured" type="checkbox" defaultChecked={feed?.featured ?? false} /> {t("admin.featured")}
                </label>
                <button type="submit" className={smallBtn}>{t("admin.save")}</button>
              </form>
              <form action={setAppStatus} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="appId" value={app.id} />
                <input name="reason" placeholder={t("admin.reasonPlaceholder")} aria-label={t("admin.reason")} className={`${input} min-w-0 flex-1`} maxLength={500} />
                {app.status !== "published" && <button name="status" value="published" className={smallBtn}>{t("admin.publish")}</button>}
                {app.status !== "suspended" && <button name="status" value="suspended" className={`${smallBtn} text-danger`}>{t("admin.suspend")}</button>}
                {app.status !== "retired" && <button name="status" value="retired" className={smallBtn}>{t("admin.retire")}</button>}
              </form>
            </section>
          );
        })}
      </div>
    );
  }

  async function ReportsTab() {
    const { data: reports } = await supabase!
      .from("reports")
      .select("id, target_type, target_id, reason, details, created_at")
      .eq("status", "open")
      .order("created_at", { ascending: true })
      .limit(100);
    if (!reports?.length) return <p className="text-muted">{t("admin.reports.empty")}</p>;
    const commentIds = reports.filter((r) => r.target_type === "comment").map((r) => r.target_id);
    const { data: comments } = commentIds.length
      ? await supabase!.from("comments").select("id, body").in("id", commentIds)
      : { data: [] as { id: string; body: string }[] };
    const commentBody = new Map((comments ?? []).map((c) => [c.id, c.body]));
    return (
      <ul className="flex flex-col gap-3">
        {reports.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 rounded-3xl border border-line bg-surface p-4">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <span className="font-bold">{t(`report.reason.${r.reason as "spam"}`)} · {r.target_type}</span>
              <time className="text-muted">{dateFormat.format(new Date(r.created_at))}</time>
            </div>
            {r.target_type === "comment" && (
              <blockquote className="rounded-xl bg-surface-2 p-3 text-sm">{commentBody.get(r.target_id) ?? "—"}</blockquote>
            )}
            {r.target_type === "app" && <p className="text-sm text-muted">{t("admin.reports.target")}: {r.target_id}</p>}
            {r.details && <p className="text-sm">{r.details}</p>}
            <form action={resolveReport} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="reportId" value={r.id} />
              <input name="note" placeholder={t("admin.reasonPlaceholder")} aria-label={t("admin.reason")} className={`${input} min-w-0 flex-1`} maxLength={500} />
              {r.target_type === "comment" && (
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" name="hideComment" /> {t("admin.reports.hideComment")}
                </label>
              )}
              <button name="status" value="resolved" className={smallBtn}>{t("admin.reports.resolve")}</button>
              <button name="status" value="dismissed" className={smallBtn}>{t("admin.reports.dismiss")}</button>
            </form>
          </li>
        ))}
      </ul>
    );
  }

  async function AuditTab() {
    const { data: rows } = await supabase!
      .from("audit_log")
      .select("id, actor_id, action, target_type, target_id, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!rows?.length) return <p className="text-muted">{t("admin.audit.empty")}</p>;
    return (
      <div className="overflow-x-auto rounded-3xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted">
            <tr>
              <th className="p-3">{t("admin.audit.when")}</th>
              <th className="p-3">{t("admin.audit.action")}</th>
              <th className="p-3">{t("admin.reports.target")}</th>
              <th className="p-3">{t("admin.reason")}</th>
              <th className="p-3">{t("admin.audit.actor")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="whitespace-nowrap p-3">{dateFormat.format(new Date(row.created_at))}</td>
                <td className="p-3 font-bold">{row.action}</td>
                <td className="p-3">{row.target_type}:{String(row.target_id).slice(0, 8)}</td>
                <td className="p-3">{row.reason ?? "—"}</td>
                <td className="p-3 font-mono text-xs">{String(row.actor_id).slice(0, 8)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  async function MetricsTab() {
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const [{ data: summary }, { data: apps }] = await Promise.all([
      supabase!.rpc("admin_event_summary", { p_since: since }),
      supabase!.from("apps").select("id, name"),
    ]);
    const names = new Map((apps ?? []).map((a) => [a.id, (a.name as Localized)[lang]]));
    const rows = (summary ?? []) as { app_id: string; event_type: string; total: number }[];
    if (!rows.length) return <p className="text-muted">{t("admin.metrics.empty")}</p>;
    const types = [...new Set(rows.map((r) => r.event_type))].sort();
    const byApp = new Map<string, Record<string, number>>();
    for (const r of rows) byApp.set(r.app_id, { ...(byApp.get(r.app_id) ?? {}), [r.event_type]: Number(r.total) });
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted">{t("admin.metrics.range")}</p>
        <div className="overflow-x-auto rounded-3xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted">
              <tr>
                <th className="p-3">{t("admin.app")}</th>
                {types.map((type) => <th key={type} className="p-3 text-right">{type}</th>)}
              </tr>
            </thead>
            <tbody>
              {[...byApp.entries()].map(([appId, counts]) => (
                <tr key={appId} className="border-t border-line">
                  <td className="p-3 font-bold">{names.get(appId) ?? appId.slice(0, 8)}</td>
                  {types.map((type) => <td key={type} className="p-3 text-right tabular-nums">{counts[type] ?? 0}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
