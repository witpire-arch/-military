import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  Soldier, Stage, Reach, Method, WorshipKind,
  PreDetails, ActiveDetails, PostDetails, MonthlyPlan,
} from "../lib/database.types";
import {
  upsertSoldier, deleteSoldier,
  getPreDetails, upsertPreDetails,
  getActiveDetails, upsertActiveDetails,
  getPostDetails, upsertPostDetails,
  listMonthlyPlans, upsertMonthlyPlan, deleteMonthlyPlan,
  listRegions,
} from "../lib/api";
import { ym, prevYm } from "../lib/format";

type Props = {
  soldier: Soldier | null;        // null = 신규
  defaultStage?: Stage;           // 신규일 때 단계 기본값
  onClose: () => void;
};

const REACH_OPTS: Reach[] = ["사명자연락가능", "인섬교·가족연락가능", "연락두절"];
const STAGE_OPTS: { value: Stage; label: string }[] = [
  { value: "pre", label: "입대 1개월 전" },
  { value: "active", label: "복무중" },
  { value: "post", label: "제대 후 면담" },
];
const METHOD_OPTS: Method[] = ["대면", "전화", "문자", "없음"];
const WORSHIP_OPTS: WorshipKind[] = ["대면", "줌", "인시센", "통화", "문자", "결석"];
const REG_OPTS = ["정회원", "준회원", "새신자", "기타"];

function emptySoldier(stage: Stage): Soldier {
  return {
    id: "", uid: null, serial_no: null, name: "",
    birth: null, region_code: null, team: null, reg_state: "정회원",
    stage,
    enlist_date: null, discharge_date: null,
    is_career: false, service_type: "일반",
    base: null, location: null, reach: null, attend_excluded: null,
    contact_ok: null,
    contact_name: null, contact_relation: null, contact_tel: null,
    manager_name: null, manager_relation: null, manager_tel: null,
    notes: null,
    created_at: "", updated_at: "",
  };
}

function d100Date(discharge: string | null): string | null {
  if (!discharge) return null;
  const d = new Date(discharge); d.setDate(d.getDate() - 100);
  return d.toISOString().slice(0, 10);
}

export function SoldierModal({ soldier, defaultStage = "pre", onClose }: Props) {
  const qc = useQueryClient();
  const isNew = !soldier;
  const [form, setForm] = useState<Soldier>(soldier ?? emptySoldier(defaultStage));
  const [pre, setPre] = useState<PreDetails>({
    soldier_id: "", enlist_period: null, worship_type: null, worship_status: null,
    tithe: null, head_date: null, head_react: null, head_reason: null,
    upper_date: null, upper_who: null, upper_react: null,
  });
  const [act, setAct] = useState<ActiveDetails>({
    soldier_id: "", feedback: null, visit_date: null, d100_done: false,
    counsel_target: null, counsel_date: null, counsel_react: null, counsel_reason: null,
  });
  const [post, setPost] = useState<PostDetails>({
    soldier_id: "", interview_done: false, release_requested: false,
    worship_kind: null, absence_reason: null,
  });
  const [plans, setPlans] = useState<MonthlyPlan[]>([]);
  const [regions, setRegions] = useState<{ code: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const rs = await listRegions();
      setRegions(rs.map((r) => ({ code: r.code, label: r.label })));
    })();
  }, []);

  useEffect(() => {
    if (!soldier) return;
    (async () => {
      const [p, a, po, pls] = await Promise.all([
        getPreDetails(soldier.id),
        getActiveDetails(soldier.id),
        getPostDetails(soldier.id),
        listMonthlyPlans(soldier.id),
      ]);
      if (p) setPre(p); else setPre((s) => ({ ...s, soldier_id: soldier.id }));
      if (a) setAct(a); else setAct((s) => ({ ...s, soldier_id: soldier.id }));
      if (po) setPost(po); else setPost((s) => ({ ...s, soldier_id: soldier.id }));
      setPlans(pls);
    })();
  }, [soldier]);

  function patch<K extends keyof Soldier>(k: K, v: Soldier[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function patchPre<K extends keyof PreDetails>(k: K, v: PreDetails[K]) {
    setPre((s) => ({ ...s, [k]: v }));
  }
  function patchAct<K extends keyof ActiveDetails>(k: K, v: ActiveDetails[K]) {
    setAct((s) => ({ ...s, [k]: v }));
  }
  function patchPost<K extends keyof PostDetails>(k: K, v: PostDetails[K]) {
    setPost((s) => ({ ...s, [k]: v }));
  }

  async function save() {
    if (!form.name.trim()) { alert("이름은 필수입니다."); return; }
    setSaving(true);
    try {
      const payload: Partial<Soldier> = { ...form };
      if (isNew) delete (payload as any).id;
      if (form.is_career) payload.discharge_date = null;
      const saved = await upsertSoldier(payload);
      const sid = saved.id;
      if (form.stage === "pre") {
        await upsertPreDetails({ ...pre, soldier_id: sid });
      } else if (form.stage === "active") {
        await upsertActiveDetails({ ...act, soldier_id: sid });
      } else if (form.stage === "post") {
        await upsertPostDetails({ ...post, soldier_id: sid });
      }
      await qc.invalidateQueries({ queryKey: ["soldiers"] });
      onClose();
    } catch (e: any) {
      alert("저장 실패: " + (e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!soldier) return;
    if (!confirm(`${soldier.name} 인원을 삭제하시겠습니까? 관련 상세/계획도 모두 삭제됩니다.`)) return;
    await deleteSoldier(soldier.id);
    await qc.invalidateQueries({ queryKey: ["soldiers"] });
    onClose();
  }

  async function addPlan(planMonth: string) {
    if (!soldier) return;
    if (plans.some((p) => p.plan_month === planMonth)) {
      alert(`${planMonth} 계획이 이미 있습니다. 아래에서 수정해주세요.`);
      return;
    }
    const created = await upsertMonthlyPlan({
      soldier_id: soldier.id,
      plan_month: planMonth,
      stage_at_plan: form.stage,
      plan: "",
    });
    setPlans((ps) => [created, ...ps].sort((a, b) => b.plan_month.localeCompare(a.plan_month)));
  }

  async function savePlan(p: MonthlyPlan) {
    const saved = await upsertMonthlyPlan(p);
    setPlans((ps) => ps.map((x) => (x.id === saved.id ? saved : x)));
  }

  async function removePlan(id: string) {
    if (!confirm("이 월 계획을 삭제하시겠습니까?")) return;
    await deleteMonthlyPlan(id);
    setPlans((ps) => ps.filter((p) => p.id !== id));
  }

  const d100 = d100Date(form.discharge_date);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{isNew ? "신규 등록" : `수정: ${form.name}`}</h2>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* 공통 정보 */}
          <Section title="공통 정보">
            <Grid>
              <Field label="번호">
                <input type="number" value={form.serial_no ?? ""}
                  onChange={(e) => patch("serial_no", e.target.value ? Number(e.target.value) : null)} />
              </Field>
              <Field label="단계">
                <select value={form.stage} onChange={(e) => patch("stage", e.target.value as Stage)}>
                  {STAGE_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="지역">
                <select value={form.region_code ?? ""}
                  onChange={(e) => patch("region_code", e.target.value || null)}>
                  <option value="">-</option>
                  {regions.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
                </select>
              </Field>
              <Field label="팀-구역">
                <input value={form.team ?? ""} onChange={(e) => patch("team", e.target.value || null)}
                  placeholder="예: 1팀 A구역" />
              </Field>
              <Field label="이름 *">
                <input value={form.name} onChange={(e) => patch("name", e.target.value)} />
              </Field>
              <Field label="생년월일">
                <input type="date" value={form.birth ?? ""}
                  onChange={(e) => patch("birth", e.target.value || null)} />
              </Field>
              <Field label="고유번호">
                <input value={form.uid ?? ""} onChange={(e) => patch("uid", e.target.value || null)} />
              </Field>
              <Field label="등록구분/상태">
                <select value={form.reg_state ?? "정회원"}
                  onChange={(e) => patch("reg_state", e.target.value)}>
                  {REG_OPTS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="입대날짜">
                <input type="date" value={form.enlist_date ?? ""}
                  onChange={(e) => patch("enlist_date", e.target.value || null)} />
              </Field>
              <Field label="전역날짜">
                <input type="date" value={form.discharge_date ?? ""}
                  onChange={(e) => patch("discharge_date", e.target.value || null)}
                  disabled={form.is_career} />
              </Field>
              <Field label="직업군인">
                <label className="chk">
                  <input type="checkbox" checked={form.is_career}
                    onChange={(e) => {
                      patch("is_career", e.target.checked);
                      patch("service_type", e.target.checked ? "직업군인" : "일반");
                      if (e.target.checked) patch("discharge_date", null);
                    }} />
                  전역날짜 자리에 "직업군인"으로 표시
                </label>
              </Field>
              <Field label="출결제외 상황">
                <input value={form.attend_excluded ?? ""}
                  onChange={(e) => patch("attend_excluded", e.target.value || null)}
                  placeholder="제외신청 / 제외 / 공란" />
              </Field>
              <Field label="연락여부">
                <select value={form.contact_ok ?? ""}
                  onChange={(e) => patch("contact_ok", e.target.value || null)}>
                  <option value="">-</option><option value="o">o</option><option value="x">x</option>
                </select>
              </Field>
              <Field label="연락상태">
                <select value={form.reach ?? ""}
                  onChange={(e) => patch("reach", (e.target.value || null) as Reach | null)}>
                  <option value="">-</option>
                  {REACH_OPTS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="훈련소 위치 (base)">
                <input value={form.base ?? ""} onChange={(e) => patch("base", e.target.value || null)} />
              </Field>
              <Field label="군대위치 (location)">
                <input value={form.location ?? ""}
                  onChange={(e) => patch("location", e.target.value || null)} />
              </Field>
            </Grid>

            <SubTitle>연락가능자</SubTitle>
            <Grid>
              <Field label="이름"><input value={form.contact_name ?? ""}
                onChange={(e) => patch("contact_name", e.target.value || null)} /></Field>
              <Field label="관계"><input value={form.contact_relation ?? ""}
                onChange={(e) => patch("contact_relation", e.target.value || null)} /></Field>
              <Field label="전화번호"><input value={form.contact_tel ?? ""}
                onChange={(e) => patch("contact_tel", e.target.value || null)} /></Field>
            </Grid>

            <SubTitle>관리담당자</SubTitle>
            <Grid>
              <Field label="이름"><input value={form.manager_name ?? ""}
                onChange={(e) => patch("manager_name", e.target.value || null)} /></Field>
              <Field label="관계"><input value={form.manager_relation ?? ""}
                onChange={(e) => patch("manager_relation", e.target.value || null)} /></Field>
              <Field label="전화번호"><input value={form.manager_tel ?? ""}
                onChange={(e) => patch("manager_tel", e.target.value || null)} /></Field>
            </Grid>

            <Field label="비고">
              <textarea rows={2} value={form.notes ?? ""}
                onChange={(e) => patch("notes", e.target.value || null)} />
            </Field>
          </Section>

          {/* 단계별 상세 */}
          {form.stage === "pre" && (
            <Section title="입대 1개월 전 상세">
              <Grid>
                <Field label="입대예정 시기"><input value={pre.enlist_period ?? ""}
                  onChange={(e) => patchPre("enlist_period", e.target.value || null)}
                  placeholder="예: 2025.08월" /></Field>
                <Field label="입대 전 예배"><input value={pre.worship_type ?? ""}
                  onChange={(e) => patchPre("worship_type", e.target.value || null)}
                  placeholder="본예배 등" /></Field>
                <Field label="예배 상태">
                  <select value={pre.worship_status ?? ""}
                    onChange={(e) => patchPre("worship_status", e.target.value || null)}>
                    <option value="">-</option><option value="o">o</option><option value="x">x</option>
                  </select>
                </Field>
                <Field label="입대 전 십일조 (원)">
                  <input type="number" value={pre.tithe ?? ""}
                    onChange={(e) => patchPre("tithe", e.target.value ? Number(e.target.value) : null)} />
                </Field>
              </Grid>

              <SubTitle>총무님 면담</SubTitle>
              <Grid>
                <Field label="면담일"><input type="date" value={pre.head_date ?? ""}
                  onChange={(e) => patchPre("head_date", e.target.value || null)} /></Field>
                <Field label="반응 / 결과" wide>
                  <textarea rows={2} value={pre.head_react ?? ""}
                    onChange={(e) => patchPre("head_react", e.target.value || null)} />
                </Field>
                <Field label="미진행 사유" wide>
                  <input value={pre.head_reason ?? ""}
                    onChange={(e) => patchPre("head_reason", e.target.value || null)} />
                </Field>
              </Grid>

              <SubTitle>상위 사명자 면담</SubTitle>
              <Grid>
                <Field label="면담일"><input type="date" value={pre.upper_date ?? ""}
                  onChange={(e) => patchPre("upper_date", e.target.value || null)} /></Field>
                <Field label="면담자"><input value={pre.upper_who ?? ""}
                  onChange={(e) => patchPre("upper_who", e.target.value || null)} /></Field>
                <Field label="반응 / 결과" wide>
                  <textarea rows={2} value={pre.upper_react ?? ""}
                    onChange={(e) => patchPre("upper_react", e.target.value || null)} />
                </Field>
              </Grid>
            </Section>
          )}

          {form.stage === "active" && (
            <Section title="복무중 상세">
              <Grid>
                <Field label="피드백 진행여부">
                  <select value={act.feedback ?? ""}
                    onChange={(e) => patchAct("feedback", e.target.value || null)}>
                    <option value="">-</option><option value="o">o</option><option value="x">x</option>
                  </select>
                </Field>
                <Field label="면회예정일">
                  <input type="date" value={act.visit_date ?? ""}
                    onChange={(e) => patchAct("visit_date", e.target.value || null)} />
                </Field>
                <Field label="전역 100일 전 날짜 (자동)">
                  <input value={d100 ?? "전역일 입력 후 자동계산"} disabled />
                </Field>
                <Field label="100일 축하 메시지 발송">
                  <label className="chk">
                    <input type="checkbox" checked={act.d100_done}
                      onChange={(e) => patchAct("d100_done", e.target.checked)} />
                    발송 완료
                  </label>
                </Field>
              </Grid>

              <SubTitle>제대 예정자 총무님 면담</SubTitle>
              <Grid>
                <Field label="면담대상 여부">
                  <select value={act.counsel_target ?? ""}
                    onChange={(e) => patchAct("counsel_target", e.target.value || null)}>
                    <option value="">-</option>
                    <option value="면담대상">면담대상</option>
                    <option value="해당없음(직업군인)">해당없음(직업군인)</option>
                  </select>
                </Field>
                <Field label="면담일">
                  <input type="date" value={act.counsel_date ?? ""}
                    onChange={(e) => patchAct("counsel_date", e.target.value || null)} />
                </Field>
                <Field label="대상자 반응" wide>
                  <textarea rows={2} value={act.counsel_react ?? ""}
                    onChange={(e) => patchAct("counsel_react", e.target.value || null)} />
                </Field>
                <Field label="미진행 사유" wide>
                  <input value={act.counsel_reason ?? ""}
                    onChange={(e) => patchAct("counsel_reason", e.target.value || null)} />
                </Field>
              </Grid>
            </Section>
          )}

          {form.stage === "post" && (
            <Section title="제대 후 면담예정 상세">
              <Grid>
                <Field label="면담완료">
                  <label className="chk">
                    <input type="checkbox" checked={post.interview_done}
                      onChange={(e) => patchPost("interview_done", e.target.checked)} />
                    완료
                  </label>
                </Field>
                <Field label="해제요청">
                  <label className="chk">
                    <input type="checkbox" checked={post.release_requested}
                      onChange={(e) => patchPost("release_requested", e.target.checked)} />
                    출결제외 해제 요청
                  </label>
                </Field>
                <Field label="제대 후 예배 여부">
                  <select value={post.worship_kind ?? ""}
                    onChange={(e) => patchPost("worship_kind", (e.target.value || null) as WorshipKind | null)}>
                    <option value="">-</option>
                    {WORSHIP_OPTS.map((w) => <option key={w}>{w}</option>)}
                  </select>
                </Field>
                <Field label="예배 결석 시 사유" wide>
                  <input value={post.absence_reason ?? ""}
                    onChange={(e) => patchPost("absence_reason", e.target.value || null)} />
                </Field>
              </Grid>
            </Section>
          )}

          {/* 월별 단계향상 계획 */}
          {!isNew && (
            <Section title="월별 단계향상 계획">
              <div className="row-actions">
                <button className="btn" onClick={() => addPlan(ym())}>+ 당월({ym()}) 추가</button>
                <button className="btn" onClick={() => addPlan(prevYm())}>+ 전월({prevYm()}) 추가</button>
              </div>
              {plans.length === 0 ? (
                <div className="empty">아직 등록된 계획이 없습니다.</div>
              ) : (
                <div className="plans">
                  {plans.map((p) => (
                    <PlanEditor
                      key={p.id}
                      plan={p}
                      onChange={(np) => savePlan(np)}
                      onRemove={() => removePlan(p.id)}
                    />
                  ))}
                </div>
              )}
            </Section>
          )}
        </div>

        <div className="modal-foot">
          {!isNew && <button className="btn btn-danger" onClick={remove}>삭제</button>}
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 내부 컴포넌트
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="m-section">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
function SubTitle({ children }: { children: React.ReactNode }) {
  return <div className="m-sub">{children}</div>;
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="m-grid">{children}</div>;
}
function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={"m-field" + (wide ? " wide" : "")}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function PlanEditor({
  plan, onChange, onRemove,
}: { plan: MonthlyPlan; onChange: (p: MonthlyPlan) => void; onRemove: () => void }) {
  const [local, setLocal] = useState<MonthlyPlan>(plan);
  useEffect(() => setLocal(plan), [plan.id]);
  function set<K extends keyof MonthlyPlan>(k: K, v: MonthlyPlan[K]) {
    setLocal((l) => ({ ...l, [k]: v }));
  }
  function commit() { onChange(local); }
  return (
    <div className="plan-card">
      <div className="plan-head">
        <strong>{local.plan_month}</strong>
        <span className="muted">단계: {local.stage_at_plan}</span>
        <div style={{ flex: 1 }} />
        <button className="btn btn-sm btn-danger" onClick={onRemove}>삭제</button>
      </div>
      <Grid>
        <Field label="계획 내용" wide>
          <textarea rows={2} value={local.plan ?? ""}
            onChange={(e) => set("plan", e.target.value || null)} onBlur={commit} />
        </Field>
        <Field label="시행 날짜">
          <input type="date" value={local.execution_date ?? ""}
            onChange={(e) => set("execution_date", e.target.value || null)} onBlur={commit} />
        </Field>
        <Field label="심방 방법">
          <select value={local.method ?? ""}
            onChange={(e) => { set("method", (e.target.value || null) as Method | null); }} onBlur={commit}>
            <option value="">-</option>
            {METHOD_OPTS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="달성 여부">
          <select
            value={local.achieved == null ? "" : local.achieved ? "true" : "false"}
            onChange={(e) => {
              const v = e.target.value;
              set("achieved", v === "" ? null : v === "true");
            }}
            onBlur={commit}>
            <option value="">미작성</option>
            <option value="true">이행</option>
            <option value="false">미이행</option>
          </select>
        </Field>
        <Field label="대상자 반응" wide>
          <textarea rows={2} value={local.reaction ?? ""}
            onChange={(e) => set("reaction", e.target.value || null)} onBlur={commit} />
        </Field>
      </Grid>
    </div>
  );
}
