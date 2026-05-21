# 군입대자 관리 시스템

Supabase(Postgres + Auth + Edge Functions) + React/Vite/TypeScript 기반 재구축.
기존 단일 HTML 대시보드(`legacy/dashboard.html`)에서 마이그레이션.

## 빠른 시작

```bash
npm install
cp .env.example .env   # VITE_SUPABASE_URL / ANON_KEY 채우기
npm run dev
```

## Supabase 설정

1. 새 프로젝트 생성 → `Project URL` / `anon key` / `service_role key` 확보
2. 마이그레이션 적용
   ```bash
   supabase link --project-ref <ref>
   supabase db push   # 또는 SQL Editor에서 supabase/migrations/*.sql 순서대로 실행
   ```
3. 첫 사용자 가입 후 SQL Editor에서 admin으로 승격
   ```sql
   update profiles set role = 'admin' where email = 'me@example.com';
   ```
4. Edge Functions 배포 + Secrets
   ```bash
   supabase secrets set TELEGRAM_BOT_TOKEN=xxxxx
   supabase functions deploy auto-move
   supabase functions deploy monthly-plan-alert
   supabase functions deploy d100-alert
   supabase functions deploy counsel-alert
   ```
5. Scheduled triggers (Supabase Dashboard → Edge Functions → Cron)
   - `auto-move`: 매일 00:10 KST  (`10 15 * * *` UTC)
   - `d100-alert`: 매일 09:00 KST (`0 0 * * *` UTC)
   - `counsel-alert`: 매일 09:00 KST
   - `monthly-plan-alert`: 매월 15일 09:00 KST (`0 0 15 * *` UTC)

## 핵심 데이터 모델

| 테이블 | 역할 |
|---|---|
| `regions` | 지역 lookup (강북/노원/대학/성북, 확장 가능) |
| `soldiers` | 인원 본체. `stage`(pre/active/post), `is_career`로 직업군인 분기 |
| `pre_details / active_details / post_details` | 단계별 상세 sparse |
| **`monthly_plans`** | `plan_month`(YYYY-MM)로 시간 분리된 단계향상 계획. `achieved IS NULL`이면 이행여부 미작성 |
| `interview_reasons` | 면담 미진행 사유 |
| `alert_topics` | 지역 → 텔레그램 chat_id + topic(thread) id |
| `alert_settings` | 알림 전역 on/off + 월 발송일 |
| `alert_logs` | 발송 이력 |
| `audit_logs` | 인원 변경/자동 이동 이력 (trigger 자동 기록) |

### Stage 자동 이동
RPC `fn_auto_move_stages()` — `auto-move` Edge Function에서 매일 실행.
- `pre` → `active`: 입대일이 오늘 이전
- `active` → `post`: 직업군인 제외, 전역일이 오늘 이전

### 알림 종류 → 함수 매핑
| 알림 | 함수 | 트리거 |
|---|---|---|
| 월 계획 작성/이행 | `monthly-plan-alert` | 월 1회 (alert_settings.monthly_plan_day) |
| 전역 D-100 | `d100-alert` | 매일 |
| 입대/전역 30일 전 총무 면담 | `counsel-alert` | 매일 |

## RLS 역할

- `admin`: 전 권한
- `team_lead`: `profiles.region_code` 일치 인원만 읽기/쓰기
- `viewer`: 읽기만

## 디렉토리

```
supabase/
  migrations/0001_init.sql, 0002_rpc.sql
  functions/auto-move, monthly-plan-alert, d100-alert, counsel-alert
src/
  lib/      supabase, auth, api, format, types
  pages/    Login, Dashboard
  features/ pre, active, post, alerts, stats
legacy/dashboard.html   # 기존 단일파일 대시보드 (참고용)
```
