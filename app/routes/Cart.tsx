import { useState } from "react";
import { Link } from "react-router";
import { useCart } from "../context/CartContext";
import { createCheckoutSession } from "../lib/api";
import { formatPrice } from "../lib/format";
import styles from "./Cart.module.scss";

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
      <section className={styles.empty}>
        <div className="eyebrow">Your cart</div>
        <h1 className={`serif page-title ${styles.emptyTitle}`}>Nothing here yet</h1>
        <p className={styles.emptyText}>
          <Link to="/catalog">Browse the catalogue</Link> to find your next piece.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className="eyebrow">Your cart</div>
      <h1 className={`serif page-title ${styles.pageTitle}`}>
        {lines.length} item{lines.length === 1 ? "" : "s"}
      </h1>

      <div className="spec-list">
        {lines.map((line) => (
          <div key={line.stampId} className="spec-row">
            <span className={`serif ${styles.lineTitle}`}>{line.title}</span>
            <div className={styles.lineRight}>
              <span className={`serif ${styles.linePrice}`}>
                {formatPrice(line.pricePence * line.quantity)}
              </span>
              <button onClick={() => removeLine(line.stampId)} className={styles.removeBtn}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.totalRow}>
        <span className="eyebrow">Total</span>
        <span className={`serif ${styles.totalValue}`}>{formatPrice(totalPence)}</span>
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          Checkout failed: {error}
        </p>
      )}

      <button className={`btn ${styles.checkoutBtn}`} onClick={handleCheckout} disabled={submitting}>
        {submitting ? "Redirecting to Stripe…" : "Checkout"}
      </button>
    </section>
  );
}
