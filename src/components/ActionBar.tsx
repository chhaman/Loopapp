"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { setLike, setSaved } from "@/app/actions/social";
import { track } from "@/lib/client/analytics";
import type { FeedEntry } from "@/lib/domain/types";
import type { AuthReason } from "./AuthPrompt";
import { BookmarkIcon, CommentIcon, FlagIcon, HeartIcon, InfoIcon, ResetIcon, ShareIcon } from "./Icons";
import { usePrefs } from "./PrefsProvider";
import { toast } from "./Toaster";

type Props = {
  entry: FeedEntry;
  signedIn: boolean;
  commentCount: number;
  onNeedsAuth: (reason: AuthReason) => void;
  onOpenComments: () => void;
  onReport: () => void;
  onReset: () => void;
};

const itemClass =
  "group flex w-12 flex-col items-center gap-1 text-center text-xs font-bold text-muted hover:text-fg focus-visible:text-fg md:w-20";
const bubbleClass =
  "grid h-12 w-12 place-items-center rounded-full border border-line bg-surface transition group-hover:bg-surface-2 group-active:scale-95";

export function ActionBar({ entry, signedIn, commentCount, onNeedsAuth, onOpenComments, onReport, onReset }: Props) {
  const { t, lang } = usePrefs();
  const [liked, setLikedState] = useState(entry.viewer.liked);
  const [likes, setLikes] = useState(entry.stats.likes);
  const [saved, setSavedState] = useState(entry.viewer.saved);
  const [, startTransition] = useTransition();
  const ref = { id: entry.id, versionId: entry.version.id };

  function handleError(error: string, rollback: () => void) {
    rollback();
    toast(t(error === "not_configured" ? "actions.notConfigured" : "actions.error"));
  }

  function toggleLike() {
    if (!signedIn) return onNeedsAuth("like");
    const next = !liked;
    setLikedState(next);
    setLikes((n) => n + (next ? 1 : -1));
    startTransition(async () => {
      const result = await setLike(entry.id, next);
      if (!result.ok) {
        if (result.error === "auth") onNeedsAuth("like");
        handleError(result.error, () => {
          setLikedState(!next);
          setLikes((n) => n + (next ? -1 : 1));
        });
      }
    });
  }

  function toggleSave() {
    if (!signedIn) return onNeedsAuth("save");
    const next = !saved;
    setSavedState(next);
    startTransition(async () => {
      const result = await setSaved(entry.id, next);
      if (!result.ok) {
        if (result.error === "auth") onNeedsAuth("save");
        handleError(result.error, () => setSavedState(!next));
      }
    });
  }

  async function share() {
    const url = `${window.location.origin}/app/${entry.slug}`;
    track("share", ref);
    try {
      if (navigator.share) {
        await navigator.share({ title: entry.name[lang], text: entry.tagline[lang], url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast(t("actions.linkCopied"));
    } catch {
      // User cancelled the share sheet or clipboard is unavailable: nothing to do.
    }
  }

  return (
    <div className="flex items-start justify-around gap-2 md:flex-col md:justify-end md:gap-4" data-testid="action-bar">
      <button type="button" className={itemClass} onClick={toggleLike} aria-pressed={liked} aria-label={t(liked ? "actions.unlike" : "actions.like")}>
        <span className={`${bubbleClass} ${liked ? "text-accent" : ""}`}>
          <HeartIcon filled={liked} />
        </span>
        <span aria-hidden="true">{likes}</span>
      </button>
      <button type="button" className={itemClass} onClick={onOpenComments} aria-label={t("actions.comments")}>
        <span className={bubbleClass}>
          <CommentIcon />
        </span>
        <span aria-hidden="true">{commentCount}</span>
      </button>
      <button type="button" className={itemClass} onClick={toggleSave} aria-pressed={saved} aria-label={t(saved ? "actions.unsave" : "actions.save")}>
        <span className={`${bubbleClass} ${saved ? "text-sun" : ""}`}>
          <BookmarkIcon filled={saved} />
        </span>
        <span aria-hidden="true" className="max-md:sr-only">{t("actions.save")}</span>
      </button>
      <button type="button" className={itemClass} onClick={share} aria-label={t("actions.share")}>
        <span className={bubbleClass}>
          <ShareIcon />
        </span>
        <span aria-hidden="true" className="max-md:sr-only">{t("actions.share")}</span>
      </button>
      <button type="button" className={itemClass} onClick={onReset} aria-label={t("actions.reset")} data-testid="reset-demo">
        <span className={bubbleClass}>
          <ResetIcon />
        </span>
        <span aria-hidden="true" className="max-md:sr-only">{t("actions.reset")}</span>
      </button>
      <Link href={`/app/${entry.slug}`} className={itemClass} aria-label={t("actions.details")}>
        <span className={bubbleClass}>
          <InfoIcon />
        </span>
        <span aria-hidden="true" className="max-md:sr-only">{t("actions.details")}</span>
      </Link>
      <button type="button" className={`${itemClass} max-md:hidden`} onClick={onReport} aria-label={t("actions.report")}>
        <span className={bubbleClass}>
          <FlagIcon width={20} height={20} />
        </span>
      </button>
    </div>
  );
}
