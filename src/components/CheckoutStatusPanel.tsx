import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./CheckoutStatusPanel.module.scss";

// The centered confirmation panel shown after returning from Stripe
// Checkout, in either its success or cancelled shape.
interface CheckoutStatusPanelProps {
  eyebrow: string;
  title: string;
  message: ReactNode;
  actionTo: string;
  actionLabel: string;
}

export default function CheckoutStatusPanel({
  eyebrow,
  title,
  message,
  actionTo,
  actionLabel,
}: CheckoutStatusPanelProps) {
  return (
    <section className={styles.panel}>
      <div className="eyebrow">{eyebrow}</div>
      <h1 className={`serif page-title ${styles.title}`}>{title}</h1>
      <p className={styles.lede}>{message}</p>
      <Link to={actionTo} className="btn">
        {actionLabel}
      </Link>
    </section>
  );
}
