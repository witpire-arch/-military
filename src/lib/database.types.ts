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

export interface MonthlyPlan {
  id: string;
  soldier_id: string;
  plan_month: string;      // 'YYYY-MM'
  stage_at_plan: Stage;
  plan: string | null;
  execution_date: string | null;
  method: Method | null;
  reaction: string | null;
  achieved: boolean | null;
}
