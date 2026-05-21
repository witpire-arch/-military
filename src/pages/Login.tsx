import { useState } from "react";
import { useAuth } from "../lib/auth";
import { DEMO_MODE } from "../lib/demo";

export function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(DEMO_MODE ? "demo@example.com" : "");
  const [password, setPassword] = useState(DEMO_MODE ? "demo" : "");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) setErr(error);
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h1><i className="ti ti-military-award" /> 군입대자 관리 시스템</h1>
        {DEMO_MODE && (
          <div style={{
            background: "#fffbeb", border: "0.5px solid #fcd34d", color: "#92400e",
            padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 16,
          }}>
            🧪 <strong>데모 모드</strong> · Supabase 미연결 상태입니다. 아무 값으로 로그인하세요.
          </div>
        )}
        <label>이메일</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>비밀번호</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div className="err">{err ?? ""}</div>
        <button className="btn btn-primary" style={{ width: "100%", marginTop: 8 }} disabled={busy}>
          {busy ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}
