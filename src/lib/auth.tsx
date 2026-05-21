import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { AppRole } from "./database.types";
import { DEMO_MODE, DEMO_PROFILE } from "./demo";

interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: AppRole;
  region_code: string | null;
  team: string | null;
}

interface AuthCtx {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

const DEMO_FLAG_KEY = "military_demo_signed_in";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      const signed = localStorage.getItem(DEMO_FLAG_KEY) === "1";
      if (signed) {
        setSession({ user: { id: DEMO_PROFILE.id } } as unknown as Session);
        setProfile(DEMO_PROFILE);
      }
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (DEMO_MODE) return;
    if (!session) { setProfile(null); return; }
    supabase.from("profiles").select("*").eq("id", session.user.id).single()
      .then(({ data }) => setProfile(data as Profile | null));
  }, [session]);

  const value: AuthCtx = {
    session, profile, loading,
    signIn: async (email, _password) => {
      if (DEMO_MODE) {
        localStorage.setItem(DEMO_FLAG_KEY, "1");
        setSession({ user: { id: DEMO_PROFILE.id } } as unknown as Session);
        setProfile({ ...DEMO_PROFILE, email: email || DEMO_PROFILE.email });
        return { error: null };
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password: _password });
      return { error: error?.message ?? null };
    },
    signOut: async () => {
      if (DEMO_MODE) {
        localStorage.removeItem(DEMO_FLAG_KEY);
        setSession(null); setProfile(null);
        return;
      }
      await supabase.auth.signOut();
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be inside AuthProvider");
  return v;
}
