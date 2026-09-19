import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getStamp } from "../lib/api";
import { formatPrice } from "../lib/format";
import { useCart } from "../context/CartContext";
import StampPlate from "../components/StampPlate";
import ConditionTag from "../components/ConditionTag";
import type { Stamp } from "../types";
import styles from "./StampDetail.module.scss";

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
      <p role="alert" className={styles.status}>
        Couldn't load this stamp: {error}
      </p>
    );
  if (!stamp) return <p className={styles.status}>Loading…</p>;

  const available = stamp.status === "available";

  return (
    <section>
      <div className={styles.breadcrumb}>
        <Link to="/catalog">Catalogue</Link> / {stamp.era} / <span className={styles.current}>{stamp.title}</span>
      </div>

      <div className={styles.layout}>
        <div className={styles.plateCol}>
          <div className="plate-frame plate-frame--lg">
            {stamp.images[0] ? (
              <img
                src={stamp.images[0].url}
                alt={stamp.images[0].altText ?? stamp.title}
                className={styles.photo}
              />
            ) : (
              <StampPlate sgNumber={stamp.sgNumber} era={stamp.era} issueYear={stamp.issueYear} size="lg" />
            )}
          </div>
          <div className={`serif ${styles.plateCaption}`}>{stamp.sgNumber} &middot; shown enlarged</div>
        </div>

        <div className={styles.info}>
          <div className={styles.titleBlock}>
            <div className="eyebrow">
              {stamp.era} era &middot; issued {stamp.issueYear}
            </div>
            <h1 className={`serif ${styles.title}`}>{stamp.title}</h1>
          </div>

          <p className={`serif ${styles.description}`}>{stamp.description}</p>

          <div className="spec-list">
            <div className="spec-row">
              <span className="eyebrow">SG Number</span>
              <span className={styles.specValue}>{stamp.sgNumber}</span>
            </div>
            <div className="spec-row">
              <span className="eyebrow">Country</span>
              <span className={styles.specValue}>{stamp.country}</span>
            </div>
            <div className="spec-row">
              <span className="eyebrow">Condition</span>
              <ConditionTag condition={stamp.condition} />
            </div>
            {stamp.grade && (
              <div className="spec-row">
                <span className="eyebrow">Grade</span>
                <span className={styles.specValue}>{stamp.grade}</span>
              </div>
            )}
          </div>

          <div className={`serif ${styles.priceLarge}`}>{formatPrice(stamp.pricePence)}</div>

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
          <div className={styles.footnote}>One of one &mdash; once it's gone, it's gone.</div>
        </div>
      </div>
    </section>
  );
}
