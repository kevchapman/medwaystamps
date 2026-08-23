import { Link, Route, Routes } from "react-router-dom";
import Home from "./routes/Home";
import Catalog from "./routes/Catalog";
import StampDetail from "./routes/StampDetail";
import Cart from "./routes/Cart";
import CheckoutSuccess from "./routes/CheckoutSuccess";
import CheckoutCancel from "./routes/CheckoutCancel";
import { useCart } from "./context/CartContext";
import Logo from "./components/Logo";

export default function App() {
  const { lines } = useCart();

  return (
    <div className="app">
      <nav className="site-nav">
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
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/stamps/:id" element={<StampDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
        </Routes>
      </main>

      <footer className="site-footer">Medway Stamps &mdash; Rare &amp; Collectible British Philately</footer>
    </div>
  );
}
