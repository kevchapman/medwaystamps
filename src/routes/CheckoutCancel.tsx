import { Link } from "react-router-dom";

export default function CheckoutCancel() {
  return (
    <section style={{ padding: "96px 64px", textAlign: "center" }}>
      <div className="eyebrow">Checkout cancelled</div>
      <h1 className="serif" style={{ fontSize: 36, fontWeight: 500, margin: "8px 0 16px" }}>
        No charge made
      </h1>
      <p style={{ color: "var(--ink-soft)", maxWidth: 420, margin: "0 auto 32px" }}>
        Your cart has been kept as it was.
      </p>
      <Link to="/cart" className="btn">
        Back to Cart
      </Link>
    </section>
  );
}
