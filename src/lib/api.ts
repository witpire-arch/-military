import { supabase } from "./supabase";
import type { Soldier, MonthlyPlan, Stage } from "./database.types";

export async function listSoldiers(stage?: Stage) {
  let q = supabase.from("soldiers").select("*").order("region_code").order("name");
  if (stage) q = q.eq("stage", stage);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Soldier[];
}

export async function upsertSoldier(s: Partial<Soldier>) {
  const { data, error } = await supabase.from("soldiers").upsert(s).select().single();
  if (error) throw error;
  return data as Soldier;
}

export async function deleteSoldier(id: string) {
  const { error } = await supabase.from("soldiers").delete().eq("id", id);
  if (error) throw error;
}

export async function listRegions() {
  const { data, error } = await supabase
    .from("regions").select("*").eq("active", true).order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function getMonthlyPlan(soldierId: string, planMonth: string) {
  const { data, error } = await supabase
    .from("monthly_plans").select("*")
    .eq("soldier_id", soldierId).eq("plan_month", planMonth).maybeSingle();
  if (error) throw error;
  return data as MonthlyPlan | null;
}

export async function upsertMonthlyPlan(p: Partial<MonthlyPlan>) {
  const { data, error } = await supabase
    .from("monthly_plans")
    .upsert(p, { onConflict: "soldier_id,plan_month" })
    .select().single();
  if (error) throw error;
  return data as MonthlyPlan;
}

export async function runAutoMove() {
  const { data, error } = await supabase.rpc("fn_auto_move_stages");
  if (error) throw error;
  return data;
}
