// Daily cron: pre→active (enlist date) / active→post (discharge date)
import { adminClient } from "../_shared/supabase.ts";

Deno.serve(async () => {
  const db = adminClient();
  const { data, error } = await db.rpc("fn_auto_move_stages");
  if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  return Response.json({ ok: true, moved: data });
});
