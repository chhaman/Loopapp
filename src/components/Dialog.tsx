"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "./Icons";
import { usePrefs } from "./PrefsProvider";

/** Accessible modal built on <dialog> (focus trapping and Esc handled by the browser). */
export function Dialog({
  open,
  onClose,
  title,
  children,
  variant = "center",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  variant?: "center" | "sheet";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = usePrefs();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const placement =
    variant === "sheet"
      ? "mt-auto mb-0 w-full max-w-lg rounded-t-3xl sm:mb-auto sm:rounded-3xl max-h-[80dvh]"
      : "m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl";

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={`${placement} border border-line bg-surface p-0 text-fg backdrop:bg-[var(--overlay)]`}
      aria-labelledby="dialog-title"
    >
      {open && (
        <div className="flex max-h-[80dvh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <h2 id="dialog-title" className="font-display text-lg font-extrabold">{title}</h2>
            <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-surface-2" aria-label={t("common.close")}>
              <CloseIcon width={20} height={20} />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}
