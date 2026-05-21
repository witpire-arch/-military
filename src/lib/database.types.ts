// 임시 placeholder. 실 Supabase 프로젝트 연결 후
// `npm run gen:types`로 자동 생성된 파일로 교체하세요.
export type Database = any;

export type Stage = "pre" | "active" | "post";
export type Reach = "사명자연락가능" | "인섬교·가족연락가능" | "연락두절";
export type ServiceKind = "일반" | "직업군인";
export type Method = "대면" | "전화" | "문자" | "없음";
export type WorshipKind = "대면" | "줌" | "인시센" | "통화" | "문자" | "결석";
export type AppRole = "admin" | "team_lead" | "viewer";

export interface Soldier {
  id: string;
  uid: string | null;
  serial_no: number | null;
  name: string;
  birth: string | null;
  region_code: string | null;
  team: string | null;
  reg_state: string | null;
  stage: Stage;
  enlist_date: string | null;
  discharge_date: string | null;
  is_career: boolean;
  service_type: ServiceKind;
  base: string | null;
  location: string | null;
  reach: Reach | null;
  attend_excluded: string | null;
  contact_ok: string | null;
  contact_name: string | null;
  contact_relation: string | null;
  contact_tel: string | null;
  manager_name: string | null;
  manager_relation: string | null;
  manager_tel: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PreDetails {
  soldier_id: string;
  enlist_period: string | null;       // 예: "2025.08월"
  worship_type: string | null;        // 본예배 등
  worship_status: string | null;      // o/x
  tithe: number | null;               // 십일조 금액
  head_date: string | null;           // 총무 면담 일자
  head_react: string | null;          // 총무 면담 반응
  head_reason: string | null;         // 총무 면담 미진행 사유
  upper_date: string | null;          // 상위 사명자 면담 일자
  upper_who: string | null;           // 상위 사명자 면담자
  upper_react: string | null;         // 상위 사명자 면담 반응
}

export interface ActiveDetails {
  soldier_id: string;
  feedback: string | null;            // 피드백 진행여부 o/x
  visit_date: string | null;          // 면회예정일
  d100_done: boolean;                 // 전역 100일 전 축하 발송여부
  counsel_target: string | null;      // 면담대상 / 해당없음(직업군인) / ''
  counsel_date: string | null;
  counsel_react: string | null;
  counsel_reason: string | null;
}

export interface PostDetails {
  soldier_id: string;
  interview_done: boolean;            // 면담완료
  release_requested: boolean;         // 해제요청
  worship_kind: WorshipKind | null;   // 제대 후 예배 여부
  absence_reason: string | null;      // 결석 시 사유
}

export interface MonthlyPlan {
  id: string;
  soldier_id: string;
  plan_month: string;                 // 'YYYY-MM'
  stage_at_plan: Stage;
  plan: string | null;
  execution_date: string | null;
  method: Method | null;
  reaction: string | null;
  achieved: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface Region {
  code: string;
  label: string;
  sort_order: number;
  active: boolean;
}
