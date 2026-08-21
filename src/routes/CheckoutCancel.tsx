import { Link } from "react-router-dom";

export default function CheckoutCancel() {
  return (
    <section>
      <h1>Checkout cancelled</h1>
      <p>Your cart has been kept as it was.</p>
      <Link to="/cart">Back to cart</Link>
    </section>
  );
}
