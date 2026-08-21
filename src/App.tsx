import { Link, Route, Routes } from "react-router-dom";
import Home from "./routes/Home";
import Catalog from "./routes/Catalog";
import StampDetail from "./routes/StampDetail";
import Cart from "./routes/Cart";
import CheckoutSuccess from "./routes/CheckoutSuccess";
import CheckoutCancel from "./routes/CheckoutCancel";
import { useCart } from "./context/CartContext";

export default function App() {
  const { lines } = useCart();

  return (
    <div className="app">
      <nav>
        <Link to="/">Medway Stamps</Link>
        <Link to="/catalog">Catalog</Link>
        <Link to="/cart">Cart ({lines.length})</Link>
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
    </div>
  );
}
