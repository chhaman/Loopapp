"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/data/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Admin mutations. The database functions re-check the role and write the
 * audit log; the check here only avoids a pointless round-trip.
 */
async function adminClient() {
  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);
  if (!user?.isAdmin || !supabase) redirect("/admin");
  return supabase;
}

function finish(tab: string, error?: string): never {
  revalidatePath("/", "layout");
  redirect(`/admin?tab=${tab}${error ? `&error=${encodeURIComponent(error)}` : "&done=1"}`);
}

const feedSchema = z.object({
  appId: z.uuid(),
  position: z.coerce.number().int().min(0).max(10_000),
  featured: z.literal("on").optional(),
});

export async function updateFeedItem(form: FormData) {
  const parsed = feedSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) finish("feed", "validation");
  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_set_feed_item", {
    p_app_id: parsed.data.appId,
    p_position: parsed.data.position,
    p_featured: parsed.data.featured === "on",
  });
  finish("feed", error?.message);
}

const statusSchema = z.object({
  appId: z.uuid(),
  status: z.enum(["published", "suspended", "retired"]),
  reason: z.string().trim().max(500).optional(),
});

export async function setAppStatus(form: FormData) {
  const parsed = statusSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) finish("feed", "validation");
  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_set_app_status", {
    p_app_id: parsed.data.appId,
    p_status: parsed.data.status,
    p_reason: parsed.data.reason || null,
  });
  finish("feed", error?.message);
}

const reportSchema = z.object({
  reportId: z.uuid(),
  status: z.enum(["resolved", "dismissed"]),
  hideComment: z.literal("on").optional(),
  note: z.string().trim().max(500).optional(),
});

export async function resolveReport(form: FormData) {
  const parsed = reportSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) finish("reports", "validation");
  const supabase = await adminClient();
  const { error } = await supabase.rpc("admin_resolve_report", {
    p_report_id: parsed.data.reportId,
    p_status: parsed.data.status,
    p_hide_comment: parsed.data.hideComment === "on",
    p_note: parsed.data.note || null,
  });
  finish("reports", error?.message);
}
