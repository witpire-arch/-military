import { useQuery } from "@tanstack/react-query";
import { listSoldiers } from "../../lib/api";

export function PostTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["soldiers", "post"],
    queryFn: () => listSoldiers("post"),
  });

  if (isLoading) return <p>불러오는 중...</p>;
  const rows = data ?? [];

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>지역</th><th>팀-구역</th><th>이름</th><th>고유번호</th>
            <th>입대일</th><th>전역일</th><th>연락가능자</th><th>관리담당자</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={8} style={{ textAlign: "center", color: "#bbb", padding: 28 }}>
              전역 인원이 없습니다
            </td></tr>
          ) : rows.map((p) => (
            <tr key={p.id}>
              <td>{p.region_code ?? "-"}</td>
              <td>{p.team ?? "-"}</td>
              <td style={{ fontWeight: 700 }}>{p.name}</td>
              <td>{p.uid ?? "-"}</td>
              <td>{p.enlist_date ?? "-"}</td>
              <td>{p.discharge_date ?? "-"}</td>
              <td style={{ fontSize: 11 }}>
                <strong>{p.contact_name ?? "-"}</strong><br />
                {p.contact_relation ?? ""} {p.contact_tel ?? ""}
              </td>
              <td style={{ fontSize: 11 }}>
                <strong>{p.manager_name ?? "-"}</strong><br />
                {p.manager_tel ?? ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
