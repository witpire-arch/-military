// Placeholder. Chart.js 차트는 v_region_reach / v_monthly_plan_rate / v_d100_upcoming view를 호출해 구성.
export function StatsTab() {
  return (
    <div>
      <h2 style={{ fontSize: 15, marginBottom: 12 }}>통계 (TODO)</h2>
      <ul style={{ fontSize: 13, lineHeight: 1.9, color: "#555" }}>
        <li>지역별 재적 현황 (사명자/가족/연락두절 비율)</li>
        <li>단계별 인원 분포</li>
        <li>월별 단계향상 계획 작성률/이행률 (지역별)</li>
        <li>심방방법별 분포</li>
        <li>전역 임박자 (D-100 이내) 리스트</li>
        <li>총무 면담 시행률</li>
        <li>제대 후 예배 참석률</li>
      </ul>
    </div>
  );
}
