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
      <section>
        <h1>Cart</h1>
        <p>
          Your cart is empty. <Link to="/catalog">Browse the catalog</Link>.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h1>Cart</h1>
      <ul>
        {lines.map((line) => (
          <li key={line.stampId}>
            <span>{line.title}</span>
            <span>{formatPrice(line.pricePence * line.quantity)}</span>
            <button onClick={() => removeLine(line.stampId)}>Remove</button>
          </li>
        ))}
      </ul>
      <p>Total: {formatPrice(totalPence)}</p>
      {error && <p role="alert">Checkout failed: {error}</p>}
      <button onClick={handleCheckout} disabled={submitting}>
        {submitting ? "Redirecting to Stripe…" : "Checkout"}
      </button>
    </section>
  );
}
