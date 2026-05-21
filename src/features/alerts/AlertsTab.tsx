import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { listRegions } from "../../lib/api";

interface Topic {
  region_code: string;
  telegram_chat_id: string;
  telegram_topic_id: number | null;
  enabled: boolean;
}

export function AlertsTab() {
  const [regions, setRegions] = useState<{ code: string; label: string }[]>([]);
  const [topics, setTopics] = useState<Record<string, Topic>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const rs = await listRegions();
      setRegions(rs);
      const { data } = await supabase.from("alert_topics").select("*");
      const map: Record<string, Topic> = {};
      for (const t of data ?? []) map[t.region_code] = t as Topic;
      setTopics(map);
    })();
  }, []);

  function update(code: string, patch: Partial<Topic>) {
    setTopics((m) => {
      const cur: Topic = m[code] ?? {
        region_code: code, telegram_chat_id: "", telegram_topic_id: null, enabled: true,
      };
      return { ...m, [code]: { ...cur, ...patch } };
    });
  }

  async function save() {
    setSaving(true);
    const rows = Object.values(topics).filter((t) => t.telegram_chat_id);
    const { error } = await supabase.from("alert_topics").upsert(rows);
    setSaving(false);
    if (error) alert(error.message); else alert("저장됨");
  }

  return (
    <div>
      <h2 style={{ fontSize: 15, marginBottom: 12 }}>지역별 텔레그램 토픽 매핑</h2>
      <p style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
        하나의 텔레그램 그룹에서 지역별 토픽(thread)으로 알림을 분리 발송합니다.
      </p>
      <div className="table-wrap" style={{ marginBottom: 16 }}>
        <table>
          <thead>
            <tr><th>지역</th><th>Chat ID</th><th>Topic ID</th><th>활성화</th></tr>
          </thead>
          <tbody>
            {regions.map((r) => {
              const t = topics[r.code];
              return (
                <tr key={r.code}>
                  <td>{r.label}</td>
                  <td>
                    <input
                      value={t?.telegram_chat_id ?? ""}
                      onChange={(e) => update(r.code, { telegram_chat_id: e.target.value })}
                      placeholder="-1001234567890"
                      style={{ width: 200 }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={t?.telegram_topic_id ?? ""}
                      onChange={(e) => update(r.code, { telegram_topic_id: e.target.value ? Number(e.target.value) : null })}
                      placeholder="thread id"
                      style={{ width: 120 }}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={t?.enabled ?? true}
                      onChange={(e) => update(r.code, { enabled: e.target.checked })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button className="btn btn-primary" onClick={save} disabled={saving}>
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}
