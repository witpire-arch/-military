// 매일 자정: 전역 100일 전 인원을 해당 지역 토픽에 알림
import { adminClient } from "../_shared/supabase.ts";
import { sendTelegram } from "../_shared/telegram.ts";

Deno.serve(async () => {
  const db = adminClient();
  const [{ data: targets }, { data: topics }, { data: settings }] = await Promise.all([
    db.rpc("fn_d100_today"),
    db.from("alert_topics").select("*").eq("enabled", true),
    db.from("alert_settings").select("enabled_d100").eq("id", 1).single(),
  ]);
  if (!settings?.enabled_d100) return Response.json({ ok: true, skipped: "disabled" });

  const topicMap = new Map((topics ?? []).map((t) => [t.region_code, t]));
  const results: unknown[] = [];
  for (const s of targets ?? []) {
    const t = topicMap.get(s.region_code);
    if (!t) continue;
    const msg = `<b>🎉 전역 100일 카운트다운</b>\n<b>${s.name}</b> 형제 — 오늘이 전역 100일 전입니다.\n전역예정일: ${s.discharge_date}\n축하 메시지를 보내주세요!`;
    try {
      await sendTelegram(t.telegram_chat_id, msg, t.telegram_topic_id ?? undefined);
      await db.from("active_details").update({ d100_done: true }).eq("soldier_id", s.soldier_id);
      await db.from("alert_logs").insert({
        kind: "d100", region_code: s.region_code, soldier_id: s.soldier_id, ok: true,
      });
      results.push({ soldier: s.name, ok: true });
    } catch (e) {
      await db.from("alert_logs").insert({
        kind: "d100", region_code: s.region_code, soldier_id: s.soldier_id, ok: false, error: String(e),
      });
      results.push({ soldier: s.name, ok: false, error: String(e) });
    }
  }
  return Response.json({ ok: true, results });
});
