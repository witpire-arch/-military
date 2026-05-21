import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPostDetails, listMonthlyPlans, listSoldiers } from "../../lib/api";
import { ym, prevYm } from "../../lib/format";
import { SoldierModal } from "../../components/SoldierModal";
import type { MonthlyPlan, PostDetails, Soldier } from "../../lib/database.types";

export function PostTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["soldiers", "post"],
    queryFn: () => listSoldiers("post"),
  });
  const [details, setDetails] = useState<Record<string, PostDetails | null>>({});
  const [planByMonth, setPlanByMonth] = useState<Record<string, Record<string, MonthlyPlan | undefined>>>({});
  const [editing, setEditing] = useState<Soldier | null>(null);
  const [creating, setCreating] = useState(false);
  const cur = ym(), prev = prevYm();

  useEffect(() => {
    (async () => {
      const list = data ?? [];
      const det = await Promise.all(
        list.map(async (s) => [s.id, await getPostDetails(s.id)] as const),
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
              <th>입대일</th><th>전역일</th>
              <th>면담완료</th><th>해제요청</th>
              <th>제대 후 예배</th><th>결석사유</th>
              <th>출결제외</th><th>연락여부</th><th>연락상태</th>
              <th>전월계획</th><th>당월계획</th>
              <th>연락가능자</th><th>관리담당자</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={19} className="empty-row">전역 인원이 없습니다</td></tr>
            ) : rows.map((p) => {
              const d = details[p.id];
              const pPrev = planByMonth[p.id]?.[prev];
              const pCur = planByMonth[p.id]?.[cur];
              return (
                <tr key={p.id} className="clickable" onClick={() => setEditing(p)}>
                  <td>{p.serial_no ?? "-"}</td>
                  <td>{p.region_code ?? "-"}</td>
                  <td>{p.team ?? "-"}</td>
                  <td className="name">{p.name}</td>
                  <td>{p.uid ?? "-"}</td>
                  <td>{p.enlist_date ?? "-"}</td>
                  <td>{p.discharge_date ?? "-"}</td>
                  <td>{d?.interview_done
                    ? <span className="pill pill-ok">완료</span>
                    : <span className="pill pill-warn">미완료</span>}</td>
                  <td>{d?.release_requested
                    ? <span className="pill pill-ok">요청</span>
                    : <span className="pill pill-no">-</span>}</td>
                  <td>{d?.worship_kind ?? "-"}</td>
                  <td>{d?.absence_reason ?? "-"}</td>
                  <td>{p.attend_excluded ?? "-"}</td>
                  <td>{p.contact_ok ?? "-"}</td>
                  <td>{p.reach ?? "-"}</td>
                  <td className="cell-multi">{planCell(pPrev)}</td>
                  <td className="cell-multi">{planCell(pCur)}</td>
                  <td className="cell-multi">
                    <strong>{p.contact_name ?? "-"}</strong><br />
                    {p.contact_relation ?? ""} {p.contact_tel ?? ""}
                  </td>
                  <td className="cell-multi">
                    <strong>{p.manager_name ?? "-"}</strong><br />
                    {p.manager_relation ?? ""} {p.manager_tel ?? ""}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-sm" onClick={() => setEditing(p)}>수정</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && <SoldierModal soldier={editing} onClose={() => setEditing(null)} />}
      {creating && <SoldierModal soldier={null} defaultStage="post" onClose={() => setCreating(false)} />}
    </>
  );
}

function planCell(p?: MonthlyPlan) {
  if (!p) return <span className="pill pill-warn">미작성</span>;
  if (p.achieved === true) return <><span className="pill pill-ok">이행</span><br />{p.plan ?? ""}</>;
  if (p.achieved === false) return <><span className="pill pill-danger">미이행</span><br />{p.plan ?? ""}</>;
  return <><span className="pill pill-info">작성</span><br />{p.plan ?? ""}</>;
}
