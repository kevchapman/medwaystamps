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
    <section>
      <h1>Thank you!</h1>
      <p>Your order was placed successfully (test mode).</p>
      <Link to="/catalog">Continue browsing</Link>
    </section>
  );
}
