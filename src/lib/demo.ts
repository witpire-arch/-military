// Demo mode: Supabase URL이 placeholder인 경우 자동 활성화.
// 실제 프로젝트 연결 후에는 자동으로 꺼집니다.
import type {
  Soldier, Stage,
  PreDetails, ActiveDetails, PostDetails, MonthlyPlan,
} from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL ?? "";
export const DEMO_MODE = !url || url.includes("placeholder") || url.includes("YOUR-PROJECT");

export const DEMO_PROFILE = {
  id: "demo-user",
  email: "demo@example.com",
  display_name: "데모 관리자",
  role: "admin" as const,
  region_code: null,
  team: null,
};

export const DEMO_REGIONS = [
  { code: "gangbuk",  label: "강북", sort_order: 10, active: true },
  { code: "nowon",    label: "노원", sort_order: 20, active: true },
  { code: "univ",     label: "대학", sort_order: 30, active: true },
  { code: "seongbuk", label: "성북", sort_order: 40, active: true },
];

function mkSoldier(
  p: Partial<Soldier> & { name: string; stage: Stage; region_code: string; serial_no: number },
): Soldier {
  return {
    id: crypto.randomUUID(),
    uid: null, birth: null,
    team: null, reg_state: "정회원",
    enlist_date: null, discharge_date: null,
    is_career: false, service_type: "일반",
    base: null, location: null, reach: null, attend_excluded: null,
    contact_ok: null,
    contact_name: null, contact_relation: null, contact_tel: null,
    manager_name: null, manager_relation: null, manager_tel: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...p,
  };
}

const today = new Date();
const inDays = (n: number) => {
  const d = new Date(today); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const ymStr = (n = 0) => {
  const d = new Date(today.getFullYear(), today.getMonth() + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// ── Soldiers
const S = {
  김민준: mkSoldier({
    serial_no: 1, name: "김민준", stage: "pre", region_code: "gangbuk", team: "1팀 A구역",
    uid: "A001", birth: "2005-03-14",
    enlist_date: inDays(20), discharge_date: inDays(20 + 18 * 30),
    base: "논산 육군훈련소", reach: "사명자연락가능", contact_ok: "o",
    contact_name: "김부친", contact_relation: "부", contact_tel: "010-1234-5678",
    manager_name: "박팀장", manager_relation: "팀장", manager_tel: "010-2222-3333",
    attend_excluded: "제외신청",
  }),
  이준혁: mkSoldier({
    serial_no: 2, name: "이준혁", stage: "pre", region_code: "nowon", team: "2팀 B구역",
    uid: "A002", birth: "2004-11-02",
    enlist_date: inDays(28), discharge_date: inDays(28 + 18 * 30),
    base: "육군훈련소", reach: "인섬교·가족연락가능", contact_ok: "o",
    contact_name: "이모친", contact_relation: "모", contact_tel: "010-8888-1111",
    manager_name: "최담당", manager_relation: "구역장", manager_tel: "010-9999-1234",
  }),
  박성현: mkSoldier({
    serial_no: 3, name: "박성현", stage: "active", region_code: "gangbuk", team: "1팀 C구역",
    uid: "B001", birth: "2003-07-21",
    enlist_date: inDays(-200), discharge_date: inDays(95),
    location: "강원 인제 12사단", reach: "사명자연락가능", contact_ok: "o",
    contact_name: "박부친", contact_relation: "부", contact_tel: "010-1111-3333",
    manager_name: "김팀장", manager_relation: "팀장", manager_tel: "010-5555-6666",
  }),
  최재원: mkSoldier({
    serial_no: 4, name: "최재원", stage: "active", region_code: "univ", team: "3팀 A구역",
    uid: "B002", birth: "2003-02-09",
    enlist_date: inDays(-300), discharge_date: inDays(60),
    location: "경기 포천 8사단", reach: "인섬교·가족연락가능", contact_ok: "o",
    contact_name: "최모친", contact_relation: "모", contact_tel: "010-2222-4444",
    manager_name: "이담당", manager_relation: "순장", manager_tel: "010-7777-8888",
  }),
  장직업: mkSoldier({
    serial_no: 5, name: "장직업", stage: "active", region_code: "seongbuk", team: "4팀 D구역",
    uid: "B003", birth: "1998-05-30",
    enlist_date: inDays(-700), discharge_date: null,
    is_career: true, service_type: "직업군인",
    location: "계룡대", reach: "사명자연락가능", contact_ok: "o",
    contact_name: "장배우자", contact_relation: "배우자", contact_tel: "010-4444-5555",
    manager_name: "한팀장", manager_relation: "팀장", manager_tel: "010-1111-2222",
  }),
  강연락두절: mkSoldier({
    serial_no: 6, name: "강연락두절", stage: "active", region_code: "nowon", team: "2팀 A구역",
    uid: "B004", birth: "2004-09-12",
    enlist_date: inDays(-150), discharge_date: inDays(420),
    location: "미상", reach: "연락두절", contact_ok: "x",
    manager_name: "정담당", manager_relation: "팀원", manager_tel: "010-3333-4444",
  }),
  정도현: mkSoldier({
    serial_no: 7, name: "정도현", stage: "post", region_code: "seongbuk", team: "4팀 B구역",
    uid: "C001", birth: "2002-08-04",
    enlist_date: inDays(-800), discharge_date: inDays(-20),
    reach: "사명자연락가능", contact_ok: "o",
    contact_name: "정부친", contact_relation: "부", contact_tel: "010-6666-7777",
    manager_name: "홍팀장", manager_relation: "팀장", manager_tel: "010-3333-4444",
  }),
};

export const DEMO_SOLDIERS: Soldier[] = Object.values(S);

// ── Stage-별 상세
const PRE: Record<string, PreDetails> = {
  [S.김민준.id]: {
    soldier_id: S.김민준.id,
    enlist_period: "2025.08월",
    worship_type: "본예배", worship_status: "o",
    tithe: 50000,
    head_date: inDays(-10), head_react: "긍정적, 군 생활 계획 공유함", head_reason: null,
    upper_date: inDays(-7), upper_who: "장순장", upper_react: "기도제목 나눔",
  },
  [S.이준혁.id]: {
    soldier_id: S.이준혁.id,
    enlist_period: "2025.09월",
    worship_type: "본예배", worship_status: "x",
    tithe: 0,
    head_date: null, head_react: null, head_reason: "일정 미협의",
    upper_date: inDays(-3), upper_who: "최순장", upper_react: "면담 예정",
  },
};

const ACT: Record<string, ActiveDetails> = {
  [S.박성현.id]: {
    soldier_id: S.박성현.id,
    feedback: "o", visit_date: inDays(15), d100_done: true,
    counsel_target: "면담대상", counsel_date: inDays(-30),
    counsel_react: "전역 후 진로 고민 공유", counsel_reason: null,
  },
  [S.최재원.id]: {
    soldier_id: S.최재원.id,
    feedback: "o", visit_date: inDays(7), d100_done: false,
    counsel_target: "면담대상", counsel_date: null,
    counsel_react: null, counsel_reason: "휴가 일정 미정",
  },
  [S.장직업.id]: {
    soldier_id: S.장직업.id,
    feedback: "o", visit_date: null, d100_done: false,
    counsel_target: "해당없음(직업군인)", counsel_date: null,
    counsel_react: null, counsel_reason: null,
  },
  [S.강연락두절.id]: {
    soldier_id: S.강연락두절.id,
    feedback: "x", visit_date: null, d100_done: false,
    counsel_target: "", counsel_date: null,
    counsel_react: null, counsel_reason: "연락두절 상태",
  },
};

const POST: Record<string, PostDetails> = {
  [S.정도현.id]: {
    soldier_id: S.정도현.id,
    interview_done: true, release_requested: true,
    worship_kind: "대면", absence_reason: null,
  },
};

// ── 월별 단계향상 계획 (전월/당월 샘플)
function mkPlan(p: Partial<MonthlyPlan> & {
  soldier_id: string; plan_month: string; stage_at_plan: Stage;
}): MonthlyPlan {
  return {
    id: crypto.randomUUID(),
    plan: null, execution_date: null,
    method: null, reaction: null, achieved: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...p,
  };
}

const PLANS: MonthlyPlan[] = [
  // 박성현: 전월 이행, 당월 미작성
  mkPlan({
    soldier_id: S.박성현.id, plan_month: ymStr(-1), stage_at_plan: "active",
    plan: "전화 심방 및 기도제목 공유",
    execution_date: inDays(-15), method: "전화",
    reaction: "감사 인사, 동기들과 잘 지냄", achieved: true,
  }),
  // 최재원: 전월 미이행
  mkPlan({
    soldier_id: S.최재원.id, plan_month: ymStr(-1), stage_at_plan: "active",
    plan: "면회 및 식사",
    execution_date: null, method: null,
    reaction: null, achieved: false,
  }),
  mkPlan({
    soldier_id: S.최재원.id, plan_month: ymStr(0), stage_at_plan: "active",
    plan: "휴가 복귀 시 카페 만남",
    execution_date: null, method: null,
    reaction: null, achieved: null,
  }),
  // 정도현(Post): 당월 계획
  mkPlan({
    soldier_id: S.정도현.id, plan_month: ymStr(0), stage_at_plan: "post",
    plan: "복귀 면담 및 예배 참석 확인",
    execution_date: inDays(-5), method: "대면",
    reaction: "주일 본예배 참석 약속", achieved: true,
  }),
];

// 메모리 mutable store (등록/수정/삭제 데모용)
export const demoStore = {
  soldiers: [...DEMO_SOLDIERS],
  preDetails: { ...PRE } as Record<string, PreDetails>,
  activeDetails: { ...ACT } as Record<string, ActiveDetails>,
  postDetails: { ...POST } as Record<string, PostDetails>,
  monthlyPlans: [...PLANS] as MonthlyPlan[],
};
