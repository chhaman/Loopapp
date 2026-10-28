"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNextPath } from "@/lib/action-result";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthFormState = { status: "idle" | "error" | "check_email"; error?: "invalid" | "validation" | "generic" | "not_configured" };

const credentials = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(72),
});

export async function signIn(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const parsed = credentials.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { status: "error", error: "validation" };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", error: "not_configured" };
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Same message for unknown email and wrong password: don't reveal which accounts exist (RF-021).
  if (error) return { status: "error", error: error.status === 400 ? "invalid" : "generic" };
  redirect(safeNextPath(form.get("next")));
}

const signUpSchema = credentials.extend({ displayName: z.string().trim().min(1).max(40) });

export async function signUp(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
    displayName: form.get("displayName"),
  });
  if (!parsed.success) return { status: "error", error: "validation" };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", error: "not_configured" };
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName } },
  });
  if (error) return { status: "error", error: "generic" };
  if (!data.session) return { status: "check_email" };
  redirect(safeNextPath(form.get("next")));
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/");
}
