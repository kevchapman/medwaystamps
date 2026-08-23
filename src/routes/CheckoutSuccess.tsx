import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function CheckoutSuccess() {
  const { clear } = useCart();

  // The webhook is the source of truth for marking the order paid; this
  // just clears the local cart now that Stripe has redirected back.
  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <section style={{ padding: "96px 64px", textAlign: "center" }}>
      <div className="eyebrow">Order confirmed</div>
      <h1 className="serif" style={{ fontSize: 36, fontWeight: 500, margin: "8px 0 16px" }}>
        Thank you
      </h1>
      <p style={{ color: "var(--ink-soft)", maxWidth: 420, margin: "0 auto 32px" }}>
        Your order was placed successfully (test mode). It's now yours &mdash; one of one.
      </p>
      <Link to="/catalog" className="btn">
        Continue Browsing
      </Link>
    </section>
  );
}
