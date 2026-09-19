import { Link, Route, Routes } from "react-router-dom";
import Home from "./routes/Home";
import Catalog from "./routes/Catalog";
import StampDetail from "./routes/StampDetail";
import Cart from "./routes/Cart";
import CheckoutSuccess from "./routes/CheckoutSuccess";
import CheckoutCancel from "./routes/CheckoutCancel";
import AdminLogin from "./routes/AdminLogin";
import AdminDashboard from "./routes/AdminDashboard";
import AdminStampNew from "./routes/AdminStampNew";
import AdminStampEdit from "./routes/AdminStampEdit";
import RequireAdmin from "./components/RequireAdmin";
import { useCart } from "./context/CartContext";
import { useAdminAuth } from "./context/AdminAuthContext";
import Logo from "./components/Logo";

export default function App() {
  const { lines } = useCart();
  const { admin } = useAdminAuth();

  return (
    <div className="app">
      <nav className="site-nav">
        <div className="site-nav__inner">
          <Link to="/" className="wordmark">
            <Logo size={32} />
            Medway Stamps
          </Link>
          <div className="links">
            <Link to="/catalog">Catalogue</Link>
            <Link to="/cart" className="cart-link">
              Cart ({lines.length})
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/stamps/:id" element={<StampDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/stamps/new"
            element={
              <RequireAdmin>
                <AdminStampNew />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/stamps/:id/edit"
            element={
              <RequireAdmin>
                <AdminStampEdit />
              </RequireAdmin>
            }
          />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          Medway Stamps &mdash; Rare &amp; Collectible British Philately
          {admin && (
            <>
              {" "}
              &middot; <Link to="/admin">Admin</Link>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
