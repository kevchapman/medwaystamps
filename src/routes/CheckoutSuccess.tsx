import { useEffect } from "react";
import { useCart } from "../context/CartContext";
import CheckoutStatusPanel from "../components/CheckoutStatusPanel";

export default function CheckoutSuccess() {
  const { clear } = useCart();

  // The webhook is the source of truth for marking the order paid; this
  // just clears the local cart now that Stripe has redirected back.
  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <CheckoutStatusPanel
      eyebrow="Order confirmed"
      title="Thank you"
      message={
        <>Your order was placed successfully (test mode). It's now yours &mdash; one of one.</>
      }
      actionTo="/catalog"
      actionLabel="Continue Browsing"
    />
  );
}
