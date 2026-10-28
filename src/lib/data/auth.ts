import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentUser = { id: string; email: string | null; displayName: string; isAdmin: boolean };

/** Data Access Layer entry point for the session. Authorization is still enforced by RLS. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", data.user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", data.user.id),
  ]);

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    displayName: profile?.display_name ?? data.user.email?.split("@")[0] ?? "",
    isAdmin: (roles ?? []).some((r) => r.role === "admin"),
  };
});
