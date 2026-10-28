import { NextResponse, type NextRequest } from "next/server";
import { eventBatchSchema } from "@/lib/domain/events";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_BODY_BYTES = 32 * 1024;

/** Ingests pseudonymous product events (RF-040). Never stores IPs, user ids or free text from miniapps. */
export async function POST(request: NextRequest) {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_BODY_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = eventBatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_events" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  if (!supabase) return new NextResponse(null, { status: 202 });

  const { error } = await supabase.from("app_events").insert(
    parsed.data.events.map((e) => ({
      event_type: e.type,
      app_id: e.appId,
      version_id: e.versionId,
      session_id: e.sessionId,
      occurred_at: e.at,
      props: e.props ?? {},
    })),
  );
  if (error) {
    console.error(JSON.stringify({ level: "error", msg: "event_insert_failed", code: error.code }));
    return NextResponse.json({ error: "rejected" }, { status: 422 });
  }
  return new NextResponse(null, { status: 202 });
}
