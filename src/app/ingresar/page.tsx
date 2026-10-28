import type { Metadata } from "next";
import { AuthForms } from "@/components/AuthForms";
import { safeNextPath } from "@/lib/action-result";
import { getPrefs } from "@/lib/prefs/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPrefs();
  return { title: t("auth.login") };
}

export default async function LoginPage({ searchParams }: PageProps<"/ingresar">) {
  const [{ next, mode }, { t }] = await Promise.all([searchParams, getPrefs()]);
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{t("auth.title")}</h1>
        <p className="text-muted">{t("auth.subtitle")}</p>
      </div>
      {isSupabaseConfigured() ? (
        <AuthForms next={safeNextPath(next)} initialMode={mode === "signup" ? "signup" : "login"} />
      ) : (
        <p role="status" className="rounded-2xl border border-line bg-surface p-4 text-muted" data-testid="auth-not-configured">
          {t("auth.notConfigured")}
        </p>
      )}
    </div>
  );
}
