import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getStamp } from "../lib/api";
import { formatPrice } from "../lib/format";
import { useCart } from "../context/CartContext";
import type { Stamp } from "../types";

export default function StampDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addLine } = useCart();
  const [stamp, setStamp] = useState<Stamp | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getStamp(id)
      .then(setStamp)
      .catch((err: unknown) => setError(String(err)));
  }, [id]);

  if (error) return <p role="alert">Couldn't load this stamp: {error}</p>;
  if (!stamp) return <p>Loading…</p>;

  const available = stamp.status === "available";

  return (
    <section>
      <div className="stamp-images">
        {stamp.images.map((img) => (
          <img key={img.id} src={img.url} alt={img.altText ?? stamp.title} />
        ))}
      </div>

      <h1>{stamp.title}</h1>
      <p>{stamp.description}</p>
      <dl>
        <dt>SG number</dt>
        <dd>{stamp.sgNumber}</dd>
        <dt>Era</dt>
        <dd>{stamp.era}</dd>
        <dt>Condition</dt>
        <dd>{stamp.condition.replace("_", " ")}</dd>
        {stamp.grade && (
          <>
            <dt>Grade</dt>
            <dd>{stamp.grade}</dd>
          </>
        )}
      </dl>

      <p className="price">{formatPrice(stamp.pricePence)}</p>

      <button
        disabled={!available}
        onClick={() => {
          addLine({
            stampId: stamp.id,
            title: stamp.title,
            pricePence: stamp.pricePence,
            quantity: 1,
          });
          navigate("/cart");
        }}
      >
        {available ? "Add to cart" : "Sold"}
      </button>
    </section>
  );
}
