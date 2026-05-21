-- ============================================================
-- 군입대자 관리 시스템 - 초기 스키마
-- ============================================================

-- ── Enums (확장은 ALTER TYPE ... ADD VALUE)
create type stage_kind as enum ('pre', 'active', 'post');
create type reach_kind as enum ('사명자연락가능', '인섬교·가족연락가능', '연락두절');
create type service_kind as enum ('일반', '직업군인');
create type reg_state as enum ('정회원', '준회원', '새신자', '기타');
create type method_kind as enum ('대면', '전화', '문자', '없음');
create type worship_kind as enum ('대면', '줌', '인시센', '통화', '문자', '결석');
create type app_role as enum ('admin', 'team_lead', 'viewer');

-- 지역은 별도 테이블(확장 가능). enum이 아니라 lookup으로 둠.
create table regions (
  code text primary key,
  label text not null,
  sort_order int not null default 0,
  active boolean not null default true
);
insert into regions (code, label, sort_order) values
  ('gangbuk', '강북', 10),
  ('nowon',   '노원', 20),
  ('univ',    '대학', 30),
  ('seongbuk','성북', 40);

-- ── 사용자 프로필 / 역할
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  display_name text,
  role app_role not null default 'viewer',
  region_code text references regions(code),  -- team_lead 권한 범위
  team text,
  created_at timestamptz not null default now()
);

-- ── 인원 본체
create table soldiers (
  id uuid primary key default gen_random_uuid(),
  uid text unique,                             -- '고유번호'
  serial_no int,                               -- 보고서의 '번호'
  name text not null,
  birth date,
  region_code text references regions(code),
  team text,                                   -- '팀-구역'
  reg_state reg_state default '정회원',
  stage stage_kind not null default 'pre',

  enlist_date date,
  discharge_date date,                         -- 직업군인이면 NULL
  is_career boolean not null default false,    -- "전역날짜 자리에 직업군인" 케이스
  service_type service_kind not null default '일반',

  base text,                                   -- 훈련소 위치
  location text,                               -- 군대 위치 (자유 텍스트)
  reach reach_kind,
  attend_excluded text,                        -- 출결제외 상황(제외신청/제외/공란)

  contact_name text,                           -- 연락가능자
  contact_relation text,
  contact_tel text,

  manager_name text,                           -- 관리담당자
  manager_relation text,
  manager_tel text,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users
);
create index soldiers_stage_idx on soldiers(stage);
create index soldiers_region_idx on soldiers(region_code);
create index soldiers_discharge_idx on soldiers(discharge_date);
create index soldiers_enlist_idx on soldiers(enlist_date);

-- ── 단계별 상세
create table pre_details (
  soldier_id uuid primary key references soldiers on delete cascade,
  enlist_period text,                          -- 예: "2025.08월"
  contact_ok text,                             -- 연락여부 o/x
  worship_type text,                           -- 본예배 등
  worship_status text,                         -- o/x
  tithe text,                                  -- o/x
  -- 총무님 면담
  head_date date,
  head_react text,
  head_reason text,
  -- 상위 사명자 면담
  upper_date date,
  upper_who text,
  upper_react text
);

create table active_details (
  soldier_id uuid primary key references soldiers on delete cascade,
  feedback text,                               -- o/x
  visit_date date,
  d100_done boolean not null default false,    -- 100일전 축하 발송여부
  -- 제대 예정자 총무 면담
  counsel_target text,                         -- '면담대상' / '해당없음(직업군인)' / ''
  counsel_date date,
  counsel_react text,
  counsel_reason text
);

create table post_details (
  soldier_id uuid primary key references soldiers on delete cascade,
  interview_done boolean not null default false,
  release_requested boolean not null default false,
  worship_kind worship_kind,                   -- 제대 후 예배 여부
  absence_reason text                          -- 결석 시 사유
);

-- ── 월별 단계향상 계획 (핵심: plan_month 기준 시간 분리)
-- Pre/Active/Post 어디서든 사용 가능 → soldier_id로 묶고 stage_at_plan 보존
create table monthly_plans (
  id uuid primary key default gen_random_uuid(),
  soldier_id uuid not null references soldiers on delete cascade,
  plan_month text not null,                    -- 'YYYY-MM' (계획이 적용되는 달)
  stage_at_plan stage_kind not null,           -- 작성 당시 단계
  plan text,                                   -- 계획 내용
  execution_date date,                         -- 실제 시행 날짜(있으면 이행)
  method method_kind,                          -- 심방방법
  reaction text,                               -- 대상자 반응
  achieved boolean,                            -- NULL=미작성, true/false=이행/미이행
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (soldier_id, plan_month)
);
create index monthly_plans_month_idx on monthly_plans(plan_month);
create index monthly_plans_soldier_idx on monthly_plans(soldier_id);

-- ── 면담 미진행 사유 (통계 탭)
create table interview_reasons (
  id uuid primary key default gen_random_uuid(),
  soldier_id uuid not null references soldiers on delete cascade,
  interview_type text not null,                -- 'pre_head' / 'pre_upper' / 'active_counsel' / 'post_interview'
  reason text not null,
  updated_at timestamptz not null default now(),
  unique (soldier_id, interview_type)
);

-- ── 알림 토픽 매핑 (지역 → 텔레그램 thread)
-- "하나의 텔레그램 그룹 + 지역별 토픽"
create table alert_topics (
  region_code text primary key references regions(code) on delete cascade,
  telegram_chat_id text not null,              -- 그룹 chat_id (모든 region 동일)
  telegram_topic_id int,                       -- thread/topic id (지역별 상이)
  enabled boolean not null default true
);

create table alert_settings (
  id int primary key default 1 check (id = 1), -- 싱글톤
  enabled_monthly_plan boolean not null default true,
  monthly_plan_day int not null default 15,    -- 매월 며칠에 발송
  enabled_d100 boolean not null default true,
  enabled_pre_counsel boolean not null default true,   -- 입대 30일 전
  enabled_post_counsel boolean not null default true,  -- 전역 30일 전
  updated_at timestamptz not null default now()
);
insert into alert_settings (id) values (1) on conflict do nothing;

create table alert_logs (
  id bigserial primary key,
  kind text not null,                          -- 'monthly_plan'/'d100'/'pre_counsel'/'post_counsel'
  region_code text references regions(code),
  soldier_id uuid references soldiers,
  payload jsonb,
  ok boolean not null,
  error text,
  sent_at timestamptz not null default now()
);

-- ── 감사 로그
create table audit_logs (
  id bigserial primary key,
  soldier_id uuid,
  actor uuid references auth.users,
  action text not null,                        -- 'stage_move'/'update'/'delete'/'create'
  before jsonb,
  after jsonb,
  at timestamptz not null default now()
);

-- ── updated_at 자동 갱신
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger trg_soldiers_updated before update on soldiers
  for each row execute function set_updated_at();
create trigger trg_monthly_plans_updated before update on monthly_plans
  for each row execute function set_updated_at();
create trigger trg_interview_reasons_updated before update on interview_reasons
  for each row execute function set_updated_at();

-- ── 헬퍼: 현재 사용자 역할/지역
create or replace function current_role_v() returns app_role
  language sql stable as $$ select role from profiles where id = auth.uid() $$;
create or replace function current_region() returns text
  language sql stable as $$ select region_code from profiles where id = auth.uid() $$;

-- ── RLS
alter table regions enable row level security;
alter table profiles enable row level security;
alter table soldiers enable row level security;
alter table pre_details enable row level security;
alter table active_details enable row level security;
alter table post_details enable row level security;
alter table monthly_plans enable row level security;
alter table interview_reasons enable row level security;
alter table alert_topics enable row level security;
alter table alert_settings enable row level security;
alter table alert_logs enable row level security;
alter table audit_logs enable row level security;

-- regions: 로그인된 사용자 모두 read
create policy regions_read on regions for select to authenticated using (true);
create policy regions_admin on regions for all to authenticated
  using (current_role_v() = 'admin') with check (current_role_v() = 'admin');

-- profiles: 본인 read / admin all
create policy profiles_self_read on profiles for select to authenticated
  using (id = auth.uid() or current_role_v() = 'admin');
create policy profiles_admin_all on profiles for all to authenticated
  using (current_role_v() = 'admin') with check (current_role_v() = 'admin');

-- soldiers: viewer는 select만, team_lead는 자기 지역, admin은 전부
create policy soldiers_select on soldiers for select to authenticated
  using (
    current_role_v() = 'admin'
    or current_role_v() = 'viewer'
    or (current_role_v() = 'team_lead' and region_code = current_region())
  );
create policy soldiers_write on soldiers for all to authenticated
  using (
    current_role_v() = 'admin'
    or (current_role_v() = 'team_lead' and region_code = current_region())
  )
  with check (
    current_role_v() = 'admin'
    or (current_role_v() = 'team_lead' and region_code = current_region())
  );

-- 자식 테이블: 부모 soldiers에 대한 권한을 따라감
create or replace function can_access_soldier(sid uuid) returns boolean
  language sql stable as $$
    select exists (
      select 1 from soldiers s where s.id = sid and (
        current_role_v() = 'admin'
        or current_role_v() = 'viewer'
        or (current_role_v() = 'team_lead' and s.region_code = current_region())
      )
    )
  $$;
create or replace function can_write_soldier(sid uuid) returns boolean
  language sql stable as $$
    select exists (
      select 1 from soldiers s where s.id = sid and (
        current_role_v() = 'admin'
        or (current_role_v() = 'team_lead' and s.region_code = current_region())
      )
    )
  $$;

do $$
declare t text;
begin
  foreach t in array array['pre_details','active_details','post_details','monthly_plans','interview_reasons']
  loop
    execute format($f$
      create policy %1$I_select on %1$I for select to authenticated
        using (can_access_soldier(soldier_id));
      create policy %1$I_write on %1$I for all to authenticated
        using (can_write_soldier(soldier_id))
        with check (can_write_soldier(soldier_id));
    $f$, t);
  end loop;
end $$;

-- 알림 관련은 admin만
create policy alert_topics_admin on alert_topics for all to authenticated
  using (current_role_v() = 'admin') with check (current_role_v() = 'admin');
create policy alert_settings_admin on alert_settings for all to authenticated
  using (current_role_v() = 'admin') with check (current_role_v() = 'admin');
create policy alert_topics_read on alert_topics for select to authenticated using (true);
create policy alert_settings_read on alert_settings for select to authenticated using (true);
create policy alert_logs_read on alert_logs for select to authenticated
  using (current_role_v() in ('admin','team_lead'));

-- audit: read만 (모두), insert는 trigger에서 SECURITY DEFINER
create policy audit_read on audit_logs for select to authenticated
  using (current_role_v() in ('admin','team_lead'));

-- ── 감사 trigger
create or replace function log_soldier_change() returns trigger
  language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    insert into audit_logs(soldier_id, actor, action, after)
      values (new.id, auth.uid(), 'create', to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into audit_logs(soldier_id, actor, action, before, after)
      values (new.id, auth.uid(),
              case when old.stage <> new.stage then 'stage_move' else 'update' end,
              to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into audit_logs(soldier_id, actor, action, before)
      values (old.id, auth.uid(), 'delete', to_jsonb(old));
    return old;
  end if;
end $$;
create trigger trg_soldiers_audit
  after insert or update or delete on soldiers
  for each row execute function log_soldier_change();

-- ── 신규 가입자 profile 자동 생성 (admin이 나중에 role 승격)
create or replace function on_auth_user_created() returns trigger
  language plpgsql security definer as $$
begin
  insert into profiles(id, email, role) values (new.id, new.email, 'viewer')
    on conflict do nothing;
  return new;
end $$;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function on_auth_user_created();

-- ============================================================
-- 통계용 view
-- ============================================================

-- 지역별 reach 분포
create or replace view v_region_reach as
  select r.code as region_code, r.label as region, s.reach, count(*) as n
  from soldiers s join regions r on r.code = s.region_code
  group by r.code, r.label, s.reach;

-- 월별 계획 작성률/이행률 (지역별)
create or replace view v_monthly_plan_rate as
  select
    mp.plan_month,
    s.region_code,
    count(*) filter (where mp.plan is not null and length(mp.plan) > 0) as planned,
    count(*) filter (where mp.achieved is true)  as achieved,
    count(*) filter (where mp.achieved is false) as not_achieved,
    count(*) as total
  from monthly_plans mp join soldiers s on s.id = mp.soldier_id
  group by mp.plan_month, s.region_code;

-- 전역 임박자(100일 이내)
create or replace view v_d100_upcoming as
  select s.*, (s.discharge_date - current_date) as days_left
  from soldiers s
  where s.stage = 'active'
    and s.discharge_date is not null
    and s.is_career = false
    and s.discharge_date >= current_date
    and (s.discharge_date - current_date) <= 100;
