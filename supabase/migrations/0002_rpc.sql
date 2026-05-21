-- ============================================================
-- RPC: 자동 stage 이동 / 알림 후보 추출
-- ============================================================

-- pre → active (입대일 도래), active → post (전역일 도래, 직업군인 제외)
create or replace function fn_auto_move_stages() returns table(moved_to text, soldier_id uuid)
  language plpgsql security definer as $$
begin
  return query
    with pre_to_active as (
      update soldiers set stage = 'active'
       where stage = 'pre'
         and enlist_date is not null
         and enlist_date <= current_date
       returning id
    )
    select 'active'::text, id from pre_to_active;

  return query
    with active_to_post as (
      update soldiers set stage = 'post'
       where stage = 'active'
         and is_career = false
         and discharge_date is not null
         and discharge_date <= current_date
       returning id
    )
    select 'post'::text, id from active_to_post;
end $$;

-- 이번 달 계획 미작성자 (해당 지역, stage=active, 직업군인 제외)
create or replace function fn_unplanned_this_month(target_month text)
  returns table(region_code text, soldier_id uuid, name text)
  language sql stable as $$
    select s.region_code, s.id, s.name
      from soldiers s
      left join monthly_plans mp
        on mp.soldier_id = s.id and mp.plan_month = target_month
     where s.stage = 'active' and s.is_career = false
       and (mp.id is null or mp.plan is null or length(mp.plan) = 0);
  $$;

-- 전월 계획 이행여부 미작성 (achieved is null)
create or replace function fn_unmarked_prev_month(prev_month text)
  returns table(region_code text, soldier_id uuid, name text, plan text)
  language sql stable as $$
    select s.region_code, s.id, s.name, mp.plan
      from monthly_plans mp
      join soldiers s on s.id = mp.soldier_id
     where mp.plan_month = prev_month
       and mp.plan is not null and length(mp.plan) > 0
       and mp.achieved is null;
  $$;

-- 오늘이 전역 100일 전인 인원
create or replace function fn_d100_today()
  returns table(region_code text, soldier_id uuid, name text, discharge_date date)
  language sql stable as $$
    select s.region_code, s.id, s.name, s.discharge_date
      from soldiers s
     where s.stage = 'active' and s.is_career = false
       and s.discharge_date is not null
       and s.discharge_date - current_date = 100;
  $$;

-- 입대 30일 전 (총무 면담 알림)
create or replace function fn_pre_counsel_due()
  returns table(region_code text, soldier_id uuid, name text, enlist_date date)
  language sql stable as $$
    select s.region_code, s.id, s.name, s.enlist_date
      from soldiers s
     where s.stage = 'pre'
       and s.enlist_date is not null
       and s.enlist_date - current_date = 30;
  $$;

-- 전역 30일 전 (총무 면담 알림)
create or replace function fn_post_counsel_due()
  returns table(region_code text, soldier_id uuid, name text, discharge_date date)
  language sql stable as $$
    select s.region_code, s.id, s.name, s.discharge_date
      from soldiers s
     where s.stage = 'active' and s.is_career = false
       and s.discharge_date is not null
       and s.discharge_date - current_date = 30;
  $$;
