import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";

export default function App() {
  const { session, loading } = useAuth();
  if (loading) return <div className="app">로딩 중...</div>;
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={session ? <Dashboard /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}
