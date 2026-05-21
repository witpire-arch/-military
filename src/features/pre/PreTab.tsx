import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPreDetails, listSoldiers } from "../../lib/api";
import { dischargeLabel } from "../../lib/format";
import { SoldierModal } from "../../components/SoldierModal";
import type { PreDetails, Soldier } from "../../lib/database.types";

export function PreTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["soldiers", "pre"],
    queryFn: () => listSoldiers("pre"),
  });
  const [details, setDetails] = useState<Record<string, PreDetails | null>>({});
  const [editing, setEditing] = useState<Soldier | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      const list = data ?? [];
      const entries = await Promise.all(
        list.map(async (s) => [s.id, await getPreDetails(s.id)] as const),
      );
      setDetails(Object.fromEntries(entries));
    })();
  }, [data]);

  if (isLoading) return <p>불러오는 중...</p>;
  const rows = data ?? [];

  return (
    <>
      <div className="tab-toolbar">
        <button className="btn btn-primary" onClick={() => setCreating(true)}>+ 신규 등록</button>
      </div>
      <div className="table-wrap">
        <table className="wide">
          <thead>
            <tr>
              <th>번호</th><th>지역</th><th>팀-구역</th><th>이름</th><th>생년월일</th>
              <th>고유번호</th><th>등록</th><th>입대예정시기</th><th>훈련소</th>
              <th>입대일</th><th>전역일</th><th>출결제외</th>
              <th>연락여부</th><th>연락상태</th>
              <th>예배</th><th>십일조</th>
              <th>총무면담</th><th>상위사명자면담</th>
              <th>연락가능자</th><th>관리담당자</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={21} className="empty-row">등록된 인원이 없습니다</td></tr>
            ) : rows.map((p) => {
              const d = details[p.id];
              return (
                <tr key={p.id} className="clickable" onClick={() => setEditing(p)}>
                  <td>{p.serial_no ?? "-"}</td>
                  <td>{p.region_code ?? "-"}</td>
                  <td>{p.team ?? "-"}</td>
                  <td className="name">{p.name}</td>
                  <td>{p.birth ?? "-"}</td>
                  <td>{p.uid ?? "-"}</td>
                  <td>{p.reg_state ?? "-"}</td>
                  <td>{d?.enlist_period ?? "-"}</td>
                  <td>{p.base ?? "-"}</td>
                  <td>{p.enlist_date ?? "-"}</td>
                  <td>{dischargeLabel(p)}</td>
                  <td>{p.attend_excluded ?? "-"}</td>
                  <td>{p.contact_ok ?? "-"}</td>
                  <td>{p.reach ?? "-"}</td>
                  <td>{d?.worship_type ? `${d.worship_type} ${d.worship_status ?? ""}` : "-"}</td>
                  <td>{d?.tithe != null ? d.tithe.toLocaleString() : "-"}</td>
                  <td className="cell-multi">
                    {d?.head_date ? <><strong>{d.head_date}</strong><br />{d.head_react ?? ""}</> : "-"}
                  </td>
                  <td className="cell-multi">
                    {d?.upper_date ? <><strong>{d.upper_date}</strong> {d.upper_who ?? ""}<br />{d.upper_react ?? ""}</> : "-"}
                  </td>
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
      {creating && <SoldierModal soldier={null} defaultStage="pre" onClose={() => setCreating(false)} />}
    </>
  );
}
