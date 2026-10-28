"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthFormState } from "@/app/actions/auth";
import { usePrefs } from "./PrefsProvider";

const initial: AuthFormState = { status: "idle" };
const input = "rounded-2xl border border-line bg-surface px-4 py-3 text-fg";
const labelClass = "flex flex-col gap-1 text-sm font-bold text-muted";

export function AuthForms({ next, initialMode }: { next: string; initialMode: "login" | "signup" }) {
  const { t } = usePrefs();
  const [mode, setMode] = useState(initialMode);
  const [loginState, loginAction, loginPending] = useActionState(signIn, initial);
  const [signupState, signupAction, signupPending] = useActionState(signUp, initial);
  const state = mode === "login" ? loginState : signupState;
  const pending = mode === "login" ? loginPending : signupPending;

  const tab = (value: "login" | "signup") =>
    `flex-1 rounded-full py-2 font-bold ${mode === value ? "bg-accent text-on-accent" : "text-muted"}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1 rounded-full border border-line bg-surface p-1" role="tablist">
        <button type="button" role="tab" aria-selected={mode === "login"} className={tab("login")} onClick={() => setMode("login")}>
          {t("auth.login")}
        </button>
        <button type="button" role="tab" aria-selected={mode === "signup"} className={tab("signup")} onClick={() => setMode("signup")}>
          {t("auth.signup")}
        </button>
      </div>

      <form action={mode === "login" ? loginAction : signupAction} className="flex flex-col gap-4" noValidate={false}>
        <input type="hidden" name="next" value={next} />
        {mode === "signup" && (
          <label className={labelClass}>
            {t("auth.displayName")}
            <input name="displayName" required maxLength={40} autoComplete="nickname" className={input} />
          </label>
        )}
        <label className={labelClass}>
          {t("auth.email")}
          <input name="email" type="email" required autoComplete="email" className={input} />
        </label>
        <label className={labelClass}>
          {t("auth.password")}
          <input
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={72}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={input}
            aria-describedby="password-hint"
          />
          <span id="password-hint" className="text-xs font-normal">{t("auth.passwordHint")}</span>
        </label>

        {state.status === "error" && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {t(state.error === "not_configured" ? "auth.notConfigured" : `auth.error.${state.error ?? "generic"}`)}
          </p>
        )}
        {state.status === "check_email" && (
          <p role="status" className="text-sm font-semibold text-success">{t("auth.checkEmail")}</p>
        )}

        <button type="submit" disabled={pending} className="rounded-full bg-accent px-5 py-3 font-extrabold text-on-accent disabled:opacity-60">
          {t(mode === "login" ? "auth.submitLogin" : "auth.submitSignup")}
        </button>
      </form>
    </div>
  );
}
