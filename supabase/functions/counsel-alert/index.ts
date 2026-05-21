// 매일 자정: 입대 30일 전(pre) / 전역 30일 전(post) 총무 면담 대상 알림
import { adminClient } from "../_shared/supabase.ts";
import { sendTelegram } from "../_shared/telegram.ts";

Deno.serve(async () => {
  const db = adminClient();
  const [{ data: pre }, { data: post }, { data: topics }, { data: settings }] = await Promise.all([
    db.rpc("fn_pre_counsel_due"),
    db.rpc("fn_post_counsel_due"),
    db.from("alert_topics").select("*").eq("enabled", true),
    db.from("alert_settings").select("enabled_pre_counsel,enabled_post_counsel").eq("id", 1).single(),
  ]);

  const topicMap = new Map((topics ?? []).map((t) => [t.region_code, t]));
  const results: unknown[] = [];

  async function emit(kind: "pre_counsel" | "post_counsel", rows: any[]) {
    for (const s of rows) {
      const t = topicMap.get(s.region_code);
      if (!t) continue;
      const when = kind === "pre_counsel"
        ? `입대예정일: ${s.enlist_date} (D-30)`
        : `전역예정일: ${s.discharge_date} (D-30)`;
      const head = kind === "pre_counsel" ? "📨 입대 전 총무님 면담 대상" : "📨 제대 전 총무님 면담 대상";
      const msg = `<b>${head}</b>\n<b>${s.name}</b> 형제\n${when}`;
      try {
        await sendTelegram(t.telegram_chat_id, msg, t.telegram_topic_id ?? undefined);
        await db.from("alert_logs").insert({
          kind, region_code: s.region_code, soldier_id: s.soldier_id, ok: true,
        });
        results.push({ kind, soldier: s.name, ok: true });
      } catch (e) {
        await db.from("alert_logs").insert({
          kind, region_code: s.region_code, soldier_id: s.soldier_id, ok: false, error: String(e),
        });
        results.push({ kind, soldier: s.name, ok: false, error: String(e) });
      }
    }
  }

  if (settings?.enabled_pre_counsel) await emit("pre_counsel", pre ?? []);
  if (settings?.enabled_post_counsel) await emit("post_counsel", post ?? []);

  return Response.json({ ok: true, results });
});
