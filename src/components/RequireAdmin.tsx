import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

// Route guard for /admin/* pages. Redirects to the login page whenever
// there's no valid session — including a stale/expired cookie, which
// GET /api/admin/me will reject with a 401 the same as no cookie at all.
export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { admin, loading } = useAdminAuth();

  if (loading) return <p className="eyebrow">Checking session…</p>;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
