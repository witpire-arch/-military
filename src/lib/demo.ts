// Demo mode: Supabase URL이 placeholder인 경우 자동 활성화.
// 실제 프로젝트 연결 후에는 자동으로 꺼집니다.
import type { Soldier, Stage } from "./database.types";

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

function mk(p: Partial<Soldier> & { name: string; stage: Stage; region_code: string }): Soldier {
  return {
    id: crypto.randomUUID(),
    uid: null, serial_no: null, birth: null,
    team: null, reg_state: "정회원",
    enlist_date: null, discharge_date: null,
    is_career: false, service_type: "일반",
    base: null, location: null, reach: null, attend_excluded: null,
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

export const DEMO_SOLDIERS: Soldier[] = [
  mk({
    name: "김민준", stage: "pre", region_code: "gangbuk", team: "1팀 A구역",
    uid: "A001", enlist_date: inDays(20), discharge_date: inDays(20 + 18 * 30),
    base: "논산", reach: "사명자연락가능",
    contact_name: "김부친", contact_relation: "부", contact_tel: "010-1234-5678",
    manager_name: "박팀장", manager_relation: "팀장", manager_tel: "010-2222-3333",
  }),
  mk({
    name: "이준혁", stage: "pre", region_code: "nowon", team: "2팀 B구역",
    uid: "A002", enlist_date: inDays(28), discharge_date: inDays(28 + 18 * 30),
    base: "육군훈련소", reach: "인섬교·가족연락가능",
    manager_name: "최담당", manager_relation: "구역장", manager_tel: "010-9999-1234",
  }),
  mk({
    name: "박성현", stage: "active", region_code: "gangbuk", team: "1팀 C구역",
    uid: "B001", enlist_date: inDays(-200), discharge_date: inDays(95),
    location: "강원 인제", reach: "사명자연락가능",
    manager_name: "김팀장", manager_relation: "팀장", manager_tel: "010-5555-6666",
  }),
  mk({
    name: "최재원", stage: "active", region_code: "univ", team: "3팀 A구역",
    uid: "B002", enlist_date: inDays(-300), discharge_date: inDays(60),
    location: "경기 포천", reach: "인섬교·가족연락가능",
    manager_name: "이담당", manager_relation: "순장", manager_tel: "010-7777-8888",
  }),
  mk({
    name: "장직업", stage: "active", region_code: "seongbuk", team: "4팀 D구역",
    uid: "B003", enlist_date: inDays(-700), discharge_date: null,
    is_career: true, service_type: "직업군인",
    location: "계룡대", reach: "사명자연락가능",
    manager_name: "한팀장", manager_relation: "팀장", manager_tel: "010-1111-2222",
  }),
  mk({
    name: "강연락두절", stage: "active", region_code: "nowon", team: "2팀 A구역",
    uid: "B004", enlist_date: inDays(-150), discharge_date: inDays(420),
    location: "미상", reach: "연락두절",
    manager_name: "정담당", manager_relation: "팀원", manager_tel: "010-3333-4444",
  }),
  mk({
    name: "정도현", stage: "post", region_code: "seongbuk", team: "4팀 B구역",
    uid: "C001", enlist_date: inDays(-800), discharge_date: inDays(-20),
    reach: "사명자연락가능",
    manager_name: "홍팀장", manager_relation: "팀장", manager_tel: "010-3333-4444",
  }),
];

// 메모리 mutable store (등록/수정/삭제 데모용)
export const demoStore = {
  soldiers: [...DEMO_SOLDIERS],
};
