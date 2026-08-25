import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import styles from "./CheckoutSuccess.module.scss";

export default function CheckoutSuccess() {
  const { clear } = useCart();

  // The webhook is the source of truth for marking the order paid; this
  // just clears the local cart now that Stripe has redirected back.
  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <section className={styles.panel}>
      <div className="eyebrow">Order confirmed</div>
      <h1 className={`serif ${styles.title}`}>Thank you</h1>
      <p className={styles.lede}>
        Your order was placed successfully (test mode). It's now yours &mdash; one of one.
      </p>
      <Link to="/catalog" className="btn">
        Continue Browsing
      </Link>
    </section>
  );
}
