import { Link } from "react-router-dom";
import styles from "./CheckoutCancel.module.scss";

export default function CheckoutCancel() {
  return (
    <section className={styles.panel}>
      <div className="eyebrow">Checkout cancelled</div>
      <h1 className={`serif ${styles.title}`}>No charge made</h1>
      <p className={styles.lede}>Your cart has been kept as it was.</p>
      <Link to="/cart" className="btn">
        Back to Cart
      </Link>
    </section>
  );
}
