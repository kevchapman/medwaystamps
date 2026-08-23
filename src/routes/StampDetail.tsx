import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getStamp } from "../lib/api";
import { formatPrice } from "../lib/format";
import { useCart } from "../context/CartContext";
import StampPlate from "../components/StampPlate";
import ConditionTag from "../components/ConditionTag";
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

  if (error)
    return (
      <p role="alert" style={{ padding: "24px 64px" }}>
        Couldn't load this stamp: {error}
      </p>
    );
  if (!stamp) return <p style={{ padding: "24px 64px" }}>Loading…</p>;

  const available = stamp.status === "available";

  return (
    <section>
      <div style={{ padding: "24px 64px 0", fontSize: 12, color: "var(--ink-soft)" }}>
        <Link to="/catalog">Catalogue</Link> / {stamp.era} / <span style={{ color: "var(--ink)" }}>{stamp.title}</span>
      </div>

      <div style={{ display: "flex", gap: 80, padding: "48px 64px 100px", alignItems: "flex-start" }}>
        <div style={{ flex: "0 0 420px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ background: "var(--paper-alt)", border: "1px solid var(--line)", padding: 40, display: "flex", justifyContent: "center" }}>
            <StampPlate sgNumber={stamp.sgNumber} era={stamp.era} issueYear={stamp.issueYear} size="lg" />
          </div>
          <div className="serif" style={{ fontSize: 13, fontStyle: "italic", color: "var(--ink-soft)", textAlign: "center" }}>
            {stamp.sgNumber} &middot; shown enlarged
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 28, maxWidth: 480 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="eyebrow">
              {stamp.era} era &middot; issued {stamp.issueYear}
            </div>
            <h1 className="serif" style={{ fontSize: 40, fontWeight: 500, margin: 0 }}>
              {stamp.title}
            </h1>
          </div>

          <p className="serif" style={{ fontStyle: "italic", fontSize: 15, lineHeight: 1.7, color: "var(--ink-soft)", margin: 0 }}>
            {stamp.description}
          </p>

          <div className="spec-list">
            <div className="spec-row">
              <span className="eyebrow">SG Number</span>
              <span style={{ fontSize: 14 }}>{stamp.sgNumber}</span>
            </div>
            <div className="spec-row">
              <span className="eyebrow">Country</span>
              <span style={{ fontSize: 14 }}>{stamp.country}</span>
            </div>
            <div className="spec-row">
              <span className="eyebrow">Condition</span>
              <ConditionTag condition={stamp.condition} />
            </div>
            {stamp.grade && (
              <div className="spec-row">
                <span className="eyebrow">Grade</span>
                <span style={{ fontSize: 14 }}>{stamp.grade}</span>
              </div>
            )}
          </div>

          <div className="serif" style={{ fontSize: 34, fontWeight: 600, color: "var(--oxblood)" }}>
            {formatPrice(stamp.pricePence)}
          </div>

          <button
            className="btn"
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
            {available ? "Add to Collection" : "Sold"}
          </button>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", textAlign: "center" }}>
            One of one &mdash; once it's gone, it's gone.
          </div>
        </div>
      </div>
    </section>
  );
}
