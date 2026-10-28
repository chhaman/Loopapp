"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { addComment, deleteComment, listComments, type CommentView } from "@/app/actions/social";
import { COMMENT_MAX_LENGTH, validateComment } from "@/lib/domain/comments";
import { Dialog } from "./Dialog";
import { FlagIcon } from "./Icons";
import { usePrefs } from "./PrefsProvider";
import { toast } from "./Toaster";

export function CommentsSheet({
  appId,
  appName,
  open,
  signedIn,
  loginHref,
  onClose,
  onCountChange,
  onReport,
}: {
  appId: string;
  appName: string;
  open: boolean;
  signedIn: boolean;
  loginHref: string;
  onClose: () => void;
  onCountChange: (delta: number) => void;
  onReport: (commentId: string) => void;
}) {
  const { t, lang } = usePrefs();
  const [comments, setComments] = useState<CommentView[] | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listComments(appId).then((result) => {
      if (!cancelled) setComments(result.ok ? result.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [open, appId]);

  function submit() {
    const validation = validateComment(body);
    if (!validation.ok) {
      setError(validation.error === "empty" ? t("comments.error.empty") : t("comments.error.tooLong", { max: COMMENT_MAX_LENGTH }));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addComment(appId, validation.body);
      if (result.ok) {
        setComments((list) => [result.data, ...(list ?? [])]);
        setBody("");
        onCountChange(1);
      } else if (result.error === "rate_limited") {
        setError(t("comments.error.rateLimited"));
      } else if (result.error === "not_configured") {
        setError(t("actions.notConfigured"));
      } else {
        setError(t("actions.error"));
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteComment(id);
      if (result.ok) {
        setComments((list) => (list ?? []).filter((c) => c.id !== id));
        onCountChange(-1);
      } else {
        toast(t("actions.error"));
      }
    });
  }

  const dateFormat = new Intl.DateTimeFormat(lang === "es" ? "es-AR" : "en-US", { dateStyle: "medium", timeStyle: "short" });

  return (
    <Dialog open={open} onClose={onClose} title={`${t("comments.title")} · ${appName}`} variant="sheet">
      <div className="flex flex-col gap-4" data-testid="comments-sheet">
        {signedIn ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("comments.placeholder")}
              aria-label={t("comments.placeholder")}
              rows={2}
              className="rounded-2xl border border-line bg-surface-2 p-3"
            />
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs ${body.length > COMMENT_MAX_LENGTH ? "text-danger" : "text-muted"}`}>
                {t("comments.chars", { count: body.length, max: COMMENT_MAX_LENGTH })}
              </span>
              <button type="submit" disabled={pending} className="rounded-full bg-accent px-4 py-2 font-extrabold text-on-accent disabled:opacity-60">
                {t("comments.send")}
              </button>
            </div>
            {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
          </form>
        ) : (
          <Link href={loginHref} className="rounded-full border border-line px-4 py-3 text-center font-bold">
            {t("comments.loginToComment")}
          </Link>
        )}

        {comments === null ? (
          <p className="text-muted">{t("common.loading")}</p>
        ) : comments.length === 0 ? (
          <p className="text-muted">{t("comments.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-2xl bg-surface-2 p-3">
                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted">
                  <span className="font-bold text-fg">{c.author}</span>
                  <time dateTime={c.createdAt}>{dateFormat.format(new Date(c.createdAt))}</time>
                </div>
                <p className="whitespace-pre-wrap break-words">{c.body}</p>
                <div className="mt-2 flex justify-end gap-3 text-xs font-bold text-muted">
                  {c.mine ? (
                    <button type="button" onClick={() => remove(c.id)} disabled={pending} className="hover:text-danger">
                      {t("comments.delete")}
                    </button>
                  ) : (
                    <button type="button" onClick={() => onReport(c.id)} className="inline-flex items-center gap-1 hover:text-fg">
                      <FlagIcon width={14} height={14} /> {t("actions.report")}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
