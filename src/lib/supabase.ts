import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // eslint-disable-next-line no-console
  console.error("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 환경변수가 비어있습니다.");
}

export const supabase = createClient<Database>(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});
