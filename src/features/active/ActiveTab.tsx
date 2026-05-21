import { useQuery } from "@tanstack/react-query";
import { listSoldiers } from "../../lib/api";
import { daysUntil, dischargeLabel } from "../../lib/format";

export function ActiveTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["soldiers", "active"],
    queryFn: () => listSoldiers("active"),
  });

  if (isLoading) return <p>불러오는 중...</p>;
  const rows = data ?? [];

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>지역</th><th>팀-구역</th><th>이름</th><th>고유번호</th>
            <th>입대일</th><th>전역일</th><th>D-?</th><th>군대위치</th>
            <th>복무</th><th>연락가능자</th><th>관리담당자</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={11} style={{ textAlign: "center", color: "#bbb", padding: 28 }}>
              등록된 인원이 없습니다
            </td></tr>
          ) : rows.map((a) => {
            const d = a.is_career ? null : daysUntil(a.discharge_date);
            return (
              <tr key={a.id} className={a.is_career ? "career" : ""}>
                <td>{a.region_code ?? "-"}</td>
                <td>{a.team ?? "-"}</td>
                <td style={{ fontWeight: 700 }}>{a.name}</td>
                <td>{a.uid ?? "-"}</td>
                <td>{a.enlist_date ?? "-"}</td>
                <td>{dischargeLabel(a)}</td>
                <td>{d == null ? "-" : `D-${d}`}</td>
                <td>{a.location ?? "-"}</td>
                <td>
                  {a.is_career
                    ? <span className="pill pill-career">직업군인</span>
                    : <span className="pill pill-no">일반</span>}
                </td>
                <td style={{ fontSize: 11 }}>
                  <strong>{a.contact_name ?? "-"}</strong><br />
                  {a.contact_relation ?? ""} {a.contact_tel ?? ""}
                </td>
                <td style={{ fontSize: 11 }}>
                  <strong>{a.manager_name ?? "-"}</strong><br />
                  {a.manager_tel ?? ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
