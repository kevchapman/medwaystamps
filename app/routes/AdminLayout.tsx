import { Outlet } from "react-router";
import RequireAdmin from "../components/RequireAdmin";

// Layout route wrapping the three protected /admin/* pages (not
// /admin/login, which must stay reachable while logged out). Config-based
// routing has no per-route "element" wrapper the way react-router-dom v6's
// <Route element={...}> did, so the RequireAdmin gate moves here instead.
export default function AdminLayout() {
  return (
    <RequireAdmin>
      <Outlet />
    </RequireAdmin>
  );
}
