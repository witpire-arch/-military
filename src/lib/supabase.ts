import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// env가 비어있으면 데모 모드용 placeholder로 fallback.
// demo.ts가 placeholder URL을 감지해 DEMO_MODE=true로 전환하고
// api.ts에서 실제 네트워크 호출 대신 데모 데이터로 라우팅합니다.
const DEMO_URL = "https://placeholder.supabase.co";
const DEMO_ANON = "placeholder-anon-key";

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

const url = envUrl || DEMO_URL;
const anon = envAnon || DEMO_ANON;

if (!envUrl || !envAnon) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 비어있어 데모 모드로 동작합니다."
  );
}

export const supabase = createClient<Database>(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});
