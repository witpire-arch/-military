// 매월 alert_settings.monthly_plan_day 자정에 실행 (cron schedule은 Supabase에서 설정)
// "이번달 계획 미작성"과 "전월 계획 이행여부 미작성"을 지역별 토픽에 발송
import { adminClient } from "../_shared/supabase.ts";
import { sendTelegram } from "../_shared/telegram.ts";

function ym(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

Deno.serve(async () => {
  const db = adminClient();
  const today = new Date();
  const thisMonth = ym(today);
  const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevMonth = ym(prev);

  const [{ data: topics }, { data: unplanned }, { data: unmarked }, { data: settings }] = await Promise.all([
    db.from("alert_topics").select("*").eq("enabled", true),
    db.rpc("fn_unplanned_this_month", { target_month: thisMonth }),
    db.rpc("fn_unmarked_prev_month", { prev_month: prevMonth }),
    db.from("alert_settings").select("enabled_monthly_plan").eq("id", 1).single(),
  ]);

  if (!settings?.enabled_monthly_plan) {
    return Response.json({ ok: true, skipped: "disabled" });
  }

  const byRegion: Record<string, { unplanned: string[]; unmarked: string[] }> = {};
  for (const t of topics ?? []) byRegion[t.region_code] = { unplanned: [], unmarked: [] };
  for (const r of unplanned ?? []) {
    if (!byRegion[r.region_code]) continue;
    byRegion[r.region_code].unplanned.push(r.name);
  }
  for (const r of unmarked ?? []) {
    if (!byRegion[r.region_code]) continue;
    byRegion[r.region_code].unmarked.push(`${r.name}(${r.plan ?? ""})`);
  }

  const results: unknown[] = [];
  for (const t of topics ?? []) {
    const g = byRegion[t.region_code];
    if (!g) continue;
    if (g.unplanned.length === 0 && g.unmarked.length === 0) continue;
    const lines = [
      `<b>📋 ${thisMonth} 월별 계획 점검</b>`,
      g.unplanned.length
        ? `\n<b>· 이번달 계획 미작성</b> (${g.unplanned.length}명)\n  - ${g.unplanned.join("\n  - ")}`
        : "",
      g.unmarked.length
        ? `\n<b>· 전월(${prevMonth}) 이행여부 미작성</b> (${g.unmarked.length}명)\n  - ${g.unmarked.join("\n  - ")}`
        : "",
    ].filter(Boolean).join("\n");
    try {
      await sendTelegram(t.telegram_chat_id, lines, t.telegram_topic_id ?? undefined);
      await db.from("alert_logs").insert({
        kind: "monthly_plan", region_code: t.region_code, ok: true,
        payload: { unplanned: g.unplanned, unmarked: g.unmarked, month: thisMonth },
      });
      results.push({ region: t.region_code, ok: true });
    } catch (e) {
      await db.from("alert_logs").insert({
        kind: "monthly_plan", region_code: t.region_code, ok: false, error: String(e),
      });
      results.push({ region: t.region_code, ok: false, error: String(e) });
    }
  }
  return Response.json({ ok: true, results });
});
