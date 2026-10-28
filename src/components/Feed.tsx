"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/client/analytics";
import type { FeedEntry } from "@/lib/domain/types";
import { ActionBar } from "./ActionBar";
import { AuthPrompt, type AuthReason } from "./AuthPrompt";
import { CommentsSheet } from "./CommentsSheet";
import { ChevronDownIcon, ChevronUpIcon } from "./Icons";
import { MiniappViewer } from "./MiniappViewer";
import { usePrefs } from "./PrefsProvider";
import { ReportDialog, type ReportTarget } from "./ReportDialog";

type Viewer = { signedIn: boolean };

/** Vertical, snap-scrolling feed of miniapps (RF-001, RF-003). */
export function Feed({ entries, viewer }: { entries: FeedEntry[]; viewer: Viewer }) {
  const { t } = usePrefs();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [authReason, setAuthReason] = useState<AuthReason | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const activeEntry = entries[active];

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(entries.length - 1, index));
      const node = scrollerRef.current?.children[clamped] as HTMLElement | undefined;
      node?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [entries.length],
  );

  // Track which item is on screen.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          if (record.isIntersecting) setActive(Number((record.target as HTMLElement).dataset.index));
        }
      },
      { root: scroller, threshold: 0.6 },
    );
    Array.from(scroller.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [entries]);

  // Impression / exit analytics and a shareable URL for the current item.
  useEffect(() => {
    if (!activeEntry) return;
    const ref = { id: activeEntry.id, versionId: activeEntry.version.id };
    const shownAt = Date.now();
    track("impression", ref);
    window.history.replaceState(window.history.state, "", `/?app=${activeEntry.slug}`);
    return () => track("exit", ref, { dwellMs: Date.now() - shownAt });
  }, [activeEntry]);

  // Keyboard alternative to the swipe gesture (RNF-007).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, dialog, [contenteditable]")) return;
      if (["ArrowDown", "PageDown", "j"].includes(e.key)) {
        e.preventDefault();
        goTo(active + 1);
      } else if (["ArrowUp", "PageUp", "k"].includes(e.key)) {
        e.preventDefault();
        goTo(active - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, goTo]);

  if (entries.length === 0) {
    return <p className="p-10 text-center text-muted">{t("feed.empty")}</p>;
  }

  const returnPath = activeEntry ? `/?app=${activeEntry.slug}` : "/";

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="feed-scroll h-[calc(100dvh-4rem)] overflow-y-scroll"
        aria-label={t("feed.label")}
        data-testid="feed"
      >
        {entries.map((entry, index) => (
          <FeedCard
            key={entry.id}
            entry={entry}
            index={index}
            total={entries.length}
            active={index === active}
            load={Math.abs(index - active) <= 1}
            viewer={viewer}
            returnPath={returnPath}
            onPrev={() => goTo(index - 1)}
            onNext={() => goTo(index + 1)}
            onNeedsAuth={setAuthReason}
            onReport={(target) => (viewer.signedIn ? setReportTarget(target) : setAuthReason("report"))}
          />
        ))}
      </div>

      <div className="pointer-events-none fixed right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 md:flex">
        <NavButton label={t("feed.prev")} disabled={active === 0} onClick={() => goTo(active - 1)}>
          <ChevronUpIcon />
        </NavButton>
        <NavButton label={t("feed.next")} disabled={active === entries.length - 1} onClick={() => goTo(active + 1)}>
          <ChevronDownIcon />
        </NavButton>
      </div>

      <AuthPrompt reason={authReason} next={returnPath} onClose={() => setAuthReason(null)} />
      <ReportDialog target={reportTarget} onClose={() => setReportTarget(null)} onNeedsAuth={() => setAuthReason("report")} />
    </div>
  );
}

function NavButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full border border-line bg-surface shadow-sm hover:bg-surface-2 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function FeedCard({
  entry,
  index,
  total,
  active,
  load,
  viewer,
  returnPath,
  onPrev,
  onNext,
  onNeedsAuth,
  onReport,
}: {
  entry: FeedEntry;
  index: number;
  total: number;
  active: boolean;
  load: boolean;
  viewer: Viewer;
  returnPath: string;
  onPrev: () => void;
  onNext: () => void;
  onNeedsAuth: (reason: AuthReason) => void;
  onReport: (target: ReportTarget) => void;
}) {
  const { t, lang } = usePrefs();
  const [resetKey, setResetKey] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(entry.stats.comments);
  const name = entry.name[lang];

  return (
    <section
      className="feed-item flex h-[calc(100dvh-4rem)] justify-center px-3 py-3 md:px-6 md:py-5"
      data-index={index}
      data-slug={entry.slug}
      aria-roledescription="miniapp"
      aria-label={`${name} — ${t("feed.position", { current: index + 1, total })}`}
      data-testid="feed-item"
    >
      <div className="flex h-full w-full max-w-[440px] flex-col gap-3 md:max-w-[540px] md:flex-row md:gap-5">
        <article className="flex min-h-0 flex-1 flex-col gap-3">
          <header className="flex items-center gap-3">
            <span className="h-10 w-10 shrink-0 rounded-2xl" style={{ background: entry.accent }} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-lg font-extrabold leading-tight">
                {name}
                {entry.feed?.featured && (
                  <span className="ml-2 rounded-full bg-sun px-2 py-0.5 align-middle text-[10px] font-extrabold uppercase tracking-wider text-ink">
                    {t("feed.featured")}
                  </span>
                )}
              </h2>
              <p className="truncate text-xs text-muted">
                {t("app.by", { creator: entry.creatorName })} · {t(`category.${entry.category}`)} · {t(`app.provenance.${entry.provenance}`)}
              </p>
            </div>
            <div className="flex gap-1 md:hidden">
              <button type="button" onClick={onPrev} disabled={index === 0} aria-label={t("feed.prev")} className="grid h-9 w-9 place-items-center rounded-full border border-line disabled:opacity-30">
                <ChevronUpIcon width={18} height={18} />
              </button>
              <button type="button" onClick={onNext} disabled={index === total - 1} aria-label={t("feed.next")} className="grid h-9 w-9 place-items-center rounded-full border border-line disabled:opacity-30">
                <ChevronDownIcon width={18} height={18} />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1">
            <MiniappViewer
              app={{ id: entry.id, slug: entry.slug, name, accent: entry.accent, versionId: entry.version.id, entryPath: entry.version.entryPath }}
              load={load}
              active={active}
              resetKey={resetKey}
              onSkip={onNext}
            />
          </div>

          <p className="line-clamp-2 text-sm text-muted">
            {entry.tagline[lang]}{" "}
            <Link href={`/app/${entry.slug}`} className="font-bold text-accent-strong underline-offset-2 hover:underline">
              {t("actions.details")}
            </Link>
          </p>
        </article>

        <ActionBar
          entry={entry}
          signedIn={viewer.signedIn}
          commentCount={commentCount}
          onNeedsAuth={onNeedsAuth}
          onOpenComments={() => setCommentsOpen(true)}
          onReport={() => onReport({ type: "app", id: entry.id })}
          onReset={() => setResetKey((n) => n + 1)}
        />
      </div>

      <CommentsSheet
        appId={entry.id}
        appName={name}
        open={commentsOpen}
        signedIn={viewer.signedIn}
        loginHref={`/ingresar?next=${encodeURIComponent(returnPath)}`}
        onClose={() => setCommentsOpen(false)}
        onCountChange={(delta) => setCommentCount((n) => n + delta)}
        onReport={(id) => {
          setCommentsOpen(false);
          onReport({ type: "comment", id });
        }}
      />
    </section>
  );
}
