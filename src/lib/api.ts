import { supabase } from "./supabase";
import type {
  Soldier, MonthlyPlan, Stage,
  PreDetails, ActiveDetails, PostDetails,
} from "./database.types";
import { DEMO_MODE, DEMO_REGIONS, demoStore } from "./demo";

// ── Soldiers
export async function listSoldiers(stage?: Stage) {
  if (DEMO_MODE) {
    return demoStore.soldiers
      .filter((s) => !stage || s.stage === stage)
      .sort((a, b) => (a.serial_no ?? 0) - (b.serial_no ?? 0));
  }
  let q = supabase.from("soldiers").select("*").order("serial_no").order("name");
  if (stage) q = q.eq("stage", stage);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Soldier[];
}

export async function upsertSoldier(s: Partial<Soldier>) {
  if (DEMO_MODE) {
    if (s.id) {
      const i = demoStore.soldiers.findIndex((x) => x.id === s.id);
      if (i >= 0) {
        demoStore.soldiers[i] = {
          ...demoStore.soldiers[i], ...s,
          updated_at: new Date().toISOString(),
        } as Soldier;
        return demoStore.soldiers[i];
      }
    }
    const maxSerial = demoStore.soldiers.reduce(
      (m, x) => Math.max(m, x.serial_no ?? 0), 0,
    );
    const created: Soldier = {
      id: crypto.randomUUID(),
      uid: null, serial_no: maxSerial + 1, birth: null,
      region_code: null, team: null, reg_state: "정회원",
      stage: "pre",
      enlist_date: null, discharge_date: null,
      is_career: false, service_type: "일반",
      base: null, location: null, reach: null, attend_excluded: null,
      contact_ok: null,
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
    delete demoStore.preDetails[id];
    delete demoStore.activeDetails[id];
    delete demoStore.postDetails[id];
    demoStore.monthlyPlans = demoStore.monthlyPlans.filter((p) => p.soldier_id !== id);
    return;
  }
  const { error } = await supabase.from("soldiers").delete().eq("id", id);
  if (error) throw error;
}

// ── Regions
export async function listRegions() {
  if (DEMO_MODE) return DEMO_REGIONS;
  const { data, error } = await supabase
    .from("regions").select("*").eq("active", true).order("sort_order");
  if (error) throw error;
  return data ?? [];
}

// ── Pre details
export async function getPreDetails(soldierId: string): Promise<PreDetails | null> {
  if (DEMO_MODE) return demoStore.preDetails[soldierId] ?? null;
  const { data, error } = await supabase
    .from("pre_details").select("*").eq("soldier_id", soldierId).maybeSingle();
  if (error) throw error;
  return (data as PreDetails) ?? null;
}

export async function upsertPreDetails(p: PreDetails) {
  if (DEMO_MODE) {
    demoStore.preDetails[p.soldier_id] = { ...p };
    return p;
  }
  const { data, error } = await supabase
    .from("pre_details").upsert(p).select().single();
  if (error) throw error;
  return data as PreDetails;
}

// ── Active details
export async function getActiveDetails(soldierId: string): Promise<ActiveDetails | null> {
  if (DEMO_MODE) return demoStore.activeDetails[soldierId] ?? null;
  const { data, error } = await supabase
    .from("active_details").select("*").eq("soldier_id", soldierId).maybeSingle();
  if (error) throw error;
  return (data as ActiveDetails) ?? null;
}

export async function upsertActiveDetails(a: ActiveDetails) {
  if (DEMO_MODE) {
    demoStore.activeDetails[a.soldier_id] = { ...a };
    return a;
  }
  const { data, error } = await supabase
    .from("active_details").upsert(a).select().single();
  if (error) throw error;
  return data as ActiveDetails;
}

// ── Post details
export async function getPostDetails(soldierId: string): Promise<PostDetails | null> {
  if (DEMO_MODE) return demoStore.postDetails[soldierId] ?? null;
  const { data, error } = await supabase
    .from("post_details").select("*").eq("soldier_id", soldierId).maybeSingle();
  if (error) throw error;
  return (data as PostDetails) ?? null;
}

export async function upsertPostDetails(p: PostDetails) {
  if (DEMO_MODE) {
    demoStore.postDetails[p.soldier_id] = { ...p };
    return p;
  }
  const { data, error } = await supabase
    .from("post_details").upsert(p).select().single();
  if (error) throw error;
  return data as PostDetails;
}

// ── Monthly plans
export async function listMonthlyPlans(soldierId: string): Promise<MonthlyPlan[]> {
  if (DEMO_MODE) {
    return demoStore.monthlyPlans
      .filter((p) => p.soldier_id === soldierId)
      .sort((a, b) => b.plan_month.localeCompare(a.plan_month));
  }
  const { data, error } = await supabase
    .from("monthly_plans").select("*")
    .eq("soldier_id", soldierId)
    .order("plan_month", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MonthlyPlan[];
}

export async function getMonthlyPlan(soldierId: string, planMonth: string) {
  if (DEMO_MODE) {
    return demoStore.monthlyPlans.find(
      (p) => p.soldier_id === soldierId && p.plan_month === planMonth,
    ) ?? null;
  }
  const { data, error } = await supabase
    .from("monthly_plans").select("*")
    .eq("soldier_id", soldierId).eq("plan_month", planMonth).maybeSingle();
  if (error) throw error;
  return data as MonthlyPlan | null;
}

export async function upsertMonthlyPlan(p: Partial<MonthlyPlan>) {
  if (DEMO_MODE) {
    if (!p.soldier_id || !p.plan_month) throw new Error("soldier_id, plan_month 필수");
    const existing = demoStore.monthlyPlans.find(
      (x) => x.soldier_id === p.soldier_id && x.plan_month === p.plan_month,
    );
    if (existing) {
      Object.assign(existing, p, { updated_at: new Date().toISOString() });
      return existing;
    }
    const created: MonthlyPlan = {
      id: crypto.randomUUID(),
      soldier_id: p.soldier_id, plan_month: p.plan_month,
      stage_at_plan: p.stage_at_plan ?? "active",
      plan: p.plan ?? null,
      execution_date: p.execution_date ?? null,
      method: p.method ?? null,
      reaction: p.reaction ?? null,
      achieved: p.achieved ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    demoStore.monthlyPlans.push(created);
    return created;
  }
  const { data, error } = await supabase
    .from("monthly_plans")
    .upsert(p, { onConflict: "soldier_id,plan_month" })
    .select().single();
  if (error) throw error;
  return data as MonthlyPlan;
}

export async function deleteMonthlyPlan(id: string) {
  if (DEMO_MODE) {
    demoStore.monthlyPlans = demoStore.monthlyPlans.filter((p) => p.id !== id);
    return;
  }
  const { error } = await supabase.from("monthly_plans").delete().eq("id", id);
  if (error) throw error;
}

export async function runAutoMove() {
  if (DEMO_MODE) return [];
  const { data, error } = await supabase.rpc("fn_auto_move_stages");
  if (error) throw error;
  return data;
}
