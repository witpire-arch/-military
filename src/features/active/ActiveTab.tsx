import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getActiveDetails, listMonthlyPlans, listSoldiers } from "../../lib/api";
import { daysUntil, dischargeLabel, ym, prevYm } from "../../lib/format";
import { SoldierModal } from "../../components/SoldierModal";
import type { ActiveDetails, MonthlyPlan, Soldier } from "../../lib/database.types";

function d100Date(discharge: string | null): string | null {
  if (!discharge) return null;
  const d = new Date(discharge); d.setDate(d.getDate() - 100);
  return d.toISOString().slice(0, 10);
}

export function ActiveTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["soldiers", "active"],
    queryFn: () => listSoldiers("active"),
  });
  const [details, setDetails] = useState<Record<string, ActiveDetails | null>>({});
  const [planByMonth, setPlanByMonth] = useState<Record<string, Record<string, MonthlyPlan | undefined>>>({});
  const [editing, setEditing] = useState<Soldier | null>(null);
  const [creating, setCreating] = useState(false);
  const cur = ym(), prev = prevYm();

  useEffect(() => {
    (async () => {
      const list = data ?? [];
      const det = await Promise.all(
        list.map(async (s) => [s.id, await getActiveDetails(s.id)] as const),
      );
      setDetails(Object.fromEntries(det));
      const plans = await Promise.all(
        list.map(async (s) => {
          const ps = await listMonthlyPlans(s.id);
          const map: Record<string, MonthlyPlan | undefined> = {};
          for (const p of ps) map[p.plan_month] = p;
          return [s.id, map] as const;
        }),
      );
      setPlanByMonth(Object.fromEntries(plans));
    })();
  }, [data]);

  if (isLoading) return <p>불러오는 중...</p>;
  const rows = data ?? [];

  return (
    <>
      <div className="tab-toolbar">
        <button className="btn btn-primary" onClick={() => setCreating(true)}>+ 신규 등록</button>
        <span className="muted">전월: {prev} · 당월: {cur}</span>
      </div>
      <div className="table-wrap">
        <table className="wide">
          <thead>
            <tr>
              <th>번호</th><th>지역</th><th>팀-구역</th><th>이름</th><th>고유번호</th>
              <th>입대일</th><th>전역일</th><th>D-?</th>
              <th>군대위치</th><th>복무</th>
              <th>출결제외</th><th>연락여부</th><th>연락상태</th>
              <th>피드백</th><th>면회예정</th>
              <th>D-100일</th><th>축하발송</th>
              <th>전월계획</th><th>당월계획</th>
              <th>총무면담(제대예정)</th>
              <th>연락가능자</th><th>관리담당자</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={23} className="empty-row">등록된 인원이 없습니다</td></tr>
            ) : rows.map((a) => {
              const d = details[a.id];
              const pPrev = planByMonth[a.id]?.[prev];
              const pCur = planByMonth[a.id]?.[cur];
              const days = a.is_career ? null : daysUntil(a.discharge_date);
              const d100 = a.is_career ? null : d100Date(a.discharge_date);
              return (
                <tr key={a.id} className={"clickable " + (a.is_career ? "career" : "")}
                    onClick={() => setEditing(a)}>
                  <td>{a.serial_no ?? "-"}</td>
                  <td>{a.region_code ?? "-"}</td>
                  <td>{a.team ?? "-"}</td>
                  <td className="name">{a.name}</td>
                  <td>{a.uid ?? "-"}</td>
                  <td>{a.enlist_date ?? "-"}</td>
                  <td>{dischargeLabel(a)}</td>
                  <td>{days == null ? "-" : `D-${days}`}</td>
                  <td>{a.location ?? "-"}</td>
                  <td>
                    {a.is_career
                      ? <span className="pill pill-career">직업군인</span>
                      : <span className="pill pill-no">일반</span>}
                  </td>
                  <td>{a.attend_excluded ?? "-"}</td>
                  <td>{a.contact_ok ?? "-"}</td>
                  <td>{a.reach ?? "-"}</td>
                  <td>{d?.feedback ?? "-"}</td>
                  <td>{d?.visit_date ?? "-"}</td>
                  <td>{d100 ?? "-"}</td>
                  <td>{d?.d100_done ? <span className="pill pill-ok">발송</span> : <span className="pill pill-no">미발송</span>}</td>
                  <td className="cell-multi">
                    {planCell(pPrev)}
                  </td>
                  <td className="cell-multi">
                    {planCell(pCur)}
                  </td>
                  <td className="cell-multi">
                    {d?.counsel_target
                      ? <>{d.counsel_target}<br />{d.counsel_date ?? ""} {d.counsel_react ?? ""}</>
                      : "-"}
                  </td>
                  <td className="cell-multi">
                    <strong>{a.contact_name ?? "-"}</strong><br />
                    {a.contact_relation ?? ""} {a.contact_tel ?? ""}
                  </td>
                  <td className="cell-multi">
                    <strong>{a.manager_name ?? "-"}</strong><br />
                    {a.manager_relation ?? ""} {a.manager_tel ?? ""}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-sm" onClick={() => setEditing(a)}>수정</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && <SoldierModal soldier={editing} onClose={() => setEditing(null)} />}
      {creating && <SoldierModal soldier={null} defaultStage="active" onClose={() => setCreating(false)} />}
    </>
  );
}

function planCell(p?: MonthlyPlan) {
  if (!p) return <span className="pill pill-warn">미작성</span>;
  if (p.achieved === true) return <><span className="pill pill-ok">이행</span><br />{p.plan ?? ""}</>;
  if (p.achieved === false) return <><span className="pill pill-danger">미이행</span><br />{p.plan ?? ""}</>;
  return <><span className="pill pill-info">작성</span><br />{p.plan ?? ""}</>;
}
