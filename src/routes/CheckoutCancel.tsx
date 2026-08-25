import CheckoutStatusPanel from "../components/CheckoutStatusPanel";

export default function CheckoutCancel() {
  return (
    <CheckoutStatusPanel
      eyebrow="Checkout cancelled"
      title="No charge made"
      message="Your cart has been kept as it was."
      actionTo="/cart"
      actionLabel="Back to Cart"
    />
  );
}
