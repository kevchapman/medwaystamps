import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createCheckoutSession } from "../lib/api";
import { formatPrice } from "../lib/format";

export default function Cart() {
  const { lines, removeLine, totalPence } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setSubmitting(true);
    setError(null);
    try {
      const { url } = await createCheckoutSession(
        lines.map((l) => ({ stampId: l.stampId, quantity: l.quantity })),
      );
      window.location.href = url;
    } catch (err) {
      setError(String(err));
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <section style={{ padding: "56px 64px 100px" }}>
        <div className="eyebrow">Your cart</div>
        <h1 className="serif" style={{ fontSize: 36, fontWeight: 500, margin: "8px 0 24px" }}>
          Nothing here yet
        </h1>
        <p style={{ color: "var(--ink-soft)" }}>
          <Link to="/catalog">Browse the catalogue</Link> to find your next piece.
        </p>
      </section>
    );
  }

  return (
    <section style={{ padding: "56px 64px 100px", maxWidth: 640 }}>
      <div className="eyebrow">Your cart</div>
      <h1 className="serif" style={{ fontSize: 36, fontWeight: 500, margin: "8px 0 32px" }}>
        {lines.length} item{lines.length === 1 ? "" : "s"}
      </h1>

      <div className="spec-list">
        {lines.map((line) => (
          <div key={line.stampId} className="spec-row">
            <span className="serif" style={{ fontSize: 16 }}>
              {line.title}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <span className="serif" style={{ fontWeight: 600, color: "var(--oxblood)" }}>
                {formatPrice(line.pricePence * line.quantity)}
              </span>
              <button
                onClick={() => removeLine(line.stampId)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--ink-soft)",
                  fontSize: 12,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          margin: "28px 0",
        }}
      >
        <span className="eyebrow">Total</span>
        <span className="serif" style={{ fontSize: 28, fontWeight: 600, color: "var(--oxblood)" }}>
          {formatPrice(totalPence)}
        </span>
      </div>

      {error && (
        <p role="alert" style={{ color: "var(--oxblood)" }}>
          Checkout failed: {error}
        </p>
      )}

      <button className="btn" onClick={handleCheckout} disabled={submitting} style={{ width: "100%" }}>
        {submitting ? "Redirecting to Stripe…" : "Checkout"}
      </button>
    </section>
  );
}
