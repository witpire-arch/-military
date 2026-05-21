import { useState } from "react";
import { useAuth } from "../lib/auth";
import { DEMO_MODE } from "../lib/demo";
import { PreTab } from "../features/pre/PreTab";
import { ActiveTab } from "../features/active/ActiveTab";
import { PostTab } from "../features/post/PostTab";
import { AlertsTab } from "../features/alerts/AlertsTab";
import { StatsTab } from "../features/stats/StatsTab";

type TabKey = "pre" | "active" | "post" | "alerts" | "stats";

export function Dashboard() {
  const { profile, signOut } = useAuth();
  const [tab, setTab] = useState<TabKey>("pre");

  return (
    <div className="app">
      <div className="top-bar">
        <h1>
          <i className="ti ti-military-award" /> 군입대자 관리 시스템
          {DEMO_MODE && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12,
              background: "#fef3c7", color: "#92400e", marginLeft: 8,
            }}>DEMO</span>
          )}
        </h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#666" }}>
            {profile?.email} · {profile?.role ?? "viewer"}
          </span>
          <button className="btn" onClick={signOut}>로그아웃</button>
        </div>
      </div>

      <div className="tabs">
        <Tab id="pre" tab={tab} setTab={setTab}>입대 1개월 전</Tab>
        <Tab id="active" tab={tab} setTab={setTab}>복무중 관리</Tab>
        <Tab id="post" tab={tab} setTab={setTab}>제대 후 면담</Tab>
        <Tab id="alerts" tab={tab} setTab={setTab}>알림 설정</Tab>
        <Tab id="stats" tab={tab} setTab={setTab}>통계</Tab>
      </div>

      {tab === "pre" && <PreTab />}
      {tab === "active" && <ActiveTab />}
      {tab === "post" && <PostTab />}
      {tab === "alerts" && <AlertsTab />}
      {tab === "stats" && <StatsTab />}
    </div>
  );
}

function Tab({ id, tab, setTab, children }: {
  id: TabKey; tab: TabKey; setTab: (t: TabKey) => void; children: React.ReactNode;
}) {
  return (
    <button className={"tab-btn" + (tab === id ? " active" : "")} onClick={() => setTab(id)}>
      {children}
    </button>
  );
}
