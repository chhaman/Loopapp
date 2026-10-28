"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { REPORT_DETAILS_MAX_LENGTH, REPORT_REASONS, validateComment } from "@/lib/domain/comments";
import { getCurrentUser, type CurrentUser } from "@/lib/data/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uuid = z.uuid();

type UserContext =
  | { ok: false; result: ActionResult<never> }
  | { ok: true; supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>; user: CurrentUser };

async function requireUser(): Promise<UserContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, result: fail("not_configured") };
  const user = await getCurrentUser();
  if (!user) return { ok: false, result: fail("auth") };
  return { ok: true, supabase, user };
}

/** Sets (not toggles) the like state, so retries are idempotent (RF-022, TC-007). */
export async function setLike(appId: string, liked: boolean): Promise<ActionResult> {
  if (!uuid.safeParse(appId).success) return fail("validation");
  const ctx = await requireUser();
  if (!ctx.ok) return ctx.result;
  const { supabase, user } = ctx;
  const { error } = liked
    ? await supabase.from("likes").upsert({ user_id: user.id, app_id: appId }, { ignoreDuplicates: true })
    : await supabase.from("likes").delete().eq("user_id", user.id).eq("app_id", appId);
  return error ? fail("unknown") : ok(undefined);
}

export async function setSaved(appId: string, saved: boolean): Promise<ActionResult> {
  if (!uuid.safeParse(appId).success) return fail("validation");
  const ctx = await requireUser();
  if (!ctx.ok) return ctx.result;
  const { supabase, user } = ctx;
  const { error } = saved
    ? await supabase.from("saves").upsert({ user_id: user.id, app_id: appId }, { ignoreDuplicates: true })
    : await supabase.from("saves").delete().eq("user_id", user.id).eq("app_id", appId);
  if (error) return fail("unknown");
  revalidatePath("/guardados");
  return ok(undefined);
}

export type CommentView = { id: string; body: string; author: string; createdAt: string; mine: boolean };

export async function listComments(appId: string): Promise<ActionResult<CommentView[]>> {
  if (!uuid.safeParse(appId).success) return fail("validation");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return ok([]);
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from("comment_feed")
    .select("id, user_id, body, created_at, display_name")
    .eq("app_id", appId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return fail("unknown");
  return ok(
    data.map((c) => ({
      id: c.id,
      body: c.body,
      author: c.display_name,
      createdAt: c.created_at,
      mine: c.user_id === user?.id,
    })),
  );
}

export async function addComment(appId: string, rawBody: string): Promise<ActionResult<CommentView>> {
  if (!uuid.safeParse(appId).success) return fail("validation");
  const validation = validateComment(rawBody);
  if (!validation.ok) return fail("validation", validation.error);
  const ctx = await requireUser();
  if (!ctx.ok) return ctx.result;
  const { supabase, user } = ctx;
  const { data, error } = await supabase
    .from("comments")
    .insert({ app_id: appId, user_id: user.id, body: validation.body })
    .select("id, body, created_at")
    .single();
  if (error) return error.message.includes("rate_limited") ? fail("rate_limited") : fail("unknown");
  return ok({ id: data.id, body: data.body, author: user.displayName, createdAt: data.created_at, mine: true });
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  if (!uuid.safeParse(commentId).success) return fail("validation");
  const ctx = await requireUser();
  if (!ctx.ok) return ctx.result;
  const { error } = await ctx.supabase.from("comments").delete().eq("id", commentId).eq("user_id", ctx.user.id);
  return error ? fail("unknown") : ok(undefined);
}

const reportSchema = z.object({
  targetType: z.enum(["app", "comment"]),
  targetId: z.uuid(),
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(REPORT_DETAILS_MAX_LENGTH).optional(),
});

export async function reportContent(input: z.input<typeof reportSchema>): Promise<ActionResult> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return fail("validation");
  const ctx = await requireUser();
  if (!ctx.ok) return ctx.result;
  const { targetType, targetId, reason, details } = parsed.data;
  const { error } = await ctx.supabase.from("reports").insert({
    reporter_id: ctx.user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    details: details || null,
  });
  return error ? fail("unknown") : ok(undefined);
}
