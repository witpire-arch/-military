import { supabase } from "./supabase";
import type { Soldier, MonthlyPlan, Stage } from "./database.types";
import { DEMO_MODE, DEMO_REGIONS, demoStore } from "./demo";

export async function listSoldiers(stage?: Stage) {
  if (DEMO_MODE) {
    return demoStore.soldiers.filter((s) => !stage || s.stage === stage);
  }
  let q = supabase.from("soldiers").select("*").order("region_code").order("name");
  if (stage) q = q.eq("stage", stage);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Soldier[];
}

export async function upsertSoldier(s: Partial<Soldier>) {
  if (DEMO_MODE) {
    if (s.id) {
      const i = demoStore.soldiers.findIndex((x) => x.id === s.id);
      if (i >= 0) demoStore.soldiers[i] = { ...demoStore.soldiers[i], ...s, updated_at: new Date().toISOString() } as Soldier;
      return demoStore.soldiers[i];
    }
    const created: Soldier = {
      id: crypto.randomUUID(),
      uid: null, serial_no: null, birth: null,
      region_code: null, team: null, reg_state: "정회원",
      stage: "pre",
      enlist_date: null, discharge_date: null,
      is_career: false, service_type: "일반",
      base: null, location: null, reach: null, attend_excluded: null,
      contact_name: null, contact_relation: null, contact_tel: null,
      manager_name: null, manager_relation: null, manager_tel: null,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      name: "",
      ...s,
    } as Soldier;
    demoStore.soldiers.push(created);
    return created;
  }
  const { data, error } = await supabase.from("soldiers").upsert(s).select().single();
  if (error) throw error;
  return data as Soldier;
}

export async function deleteSoldier(id: string) {
  if (DEMO_MODE) {
    demoStore.soldiers = demoStore.soldiers.filter((s) => s.id !== id);
    return;
  }
  const { error } = await supabase.from("soldiers").delete().eq("id", id);
  if (error) throw error;
}

export async function listRegions() {
  if (DEMO_MODE) return DEMO_REGIONS;
  const { data, error } = await supabase
    .from("regions").select("*").eq("active", true).order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function getMonthlyPlan(soldierId: string, planMonth: string) {
  if (DEMO_MODE) return null;
  const { data, error } = await supabase
    .from("monthly_plans").select("*")
    .eq("soldier_id", soldierId).eq("plan_month", planMonth).maybeSingle();
  if (error) throw error;
  return data as MonthlyPlan | null;
}

export async function upsertMonthlyPlan(p: Partial<MonthlyPlan>) {
  if (DEMO_MODE) return p as MonthlyPlan;
  const { data, error } = await supabase
    .from("monthly_plans")
    .upsert(p, { onConflict: "soldier_id,plan_month" })
    .select().single();
  if (error) throw error;
  return data as MonthlyPlan;
}

export async function runAutoMove() {
  if (DEMO_MODE) return [];
  const { data, error } = await supabase.rpc("fn_auto_move_stages");
  if (error) throw error;
  return data;
}
