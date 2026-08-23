import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listStamps } from "../lib/api";
import { countryCode, formatPrice } from "../lib/format";
import StampPlate from "../components/StampPlate";
import ConditionTag from "../components/ConditionTag";
import type { Stamp } from "../types";

export default function Home() {
  const [featured, setFeatured] = useState<Stamp[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listStamps({ sort: "newest", limit: 6 })
      .then((res) => setFeatured(res.items))
      .catch((err: unknown) => setError(String(err)));
  }, []);

  const hero = featured[0];

  return (
    <section>
      <div style={{ display: "flex", gap: 80, padding: "96px 64px 88px", alignItems: "center" }}>
        <div style={{ flex: "0 0 460px", display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="eyebrow">Est. for the serious collector</div>
          <h1 className="serif" style={{ fontSize: 52, lineHeight: 1.1, fontWeight: 500, margin: 0 }}>
            Rare British stamps, authenticated and ready to own.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink-soft)", margin: 0, maxWidth: 420 }}>
            Each piece in the collection is a single, verified original &mdash; catalogued, graded and
            sold once. No reprints, no duplicates.
          </p>
          <div>
            <Link to="/catalog" className="btn">
              Browse the Catalogue
            </Link>
          </div>
        </div>

        {hero && (
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div
              style={{
                transform: "rotate(-3deg)",
                background: "var(--paper-alt)",
                border: "1px solid var(--line)",
                padding: 28,
                boxShadow: "0 32px 56px -28px oklch(22% 0.02 50 / 0.35)",
              }}
            >
              <StampPlate
                sgNumber={hero.sgNumber}
                countryCode={countryCode(hero.country)}
                issueYear={hero.issueYear}
                size="lg"
              />
              <div
                className="serif"
                style={{ marginTop: 16, fontSize: 13, fontStyle: "italic", color: "var(--ink-soft)", textAlign: "center" }}
              >
                {hero.sgNumber}
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          padding: "48px 64px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          borderTop: "1px solid var(--line)",
        }}
      >
        <div className="eyebrow">Recently acquired</div>
        <h2 className="serif" style={{ fontSize: 30, fontWeight: 500, margin: 0 }}>
          New to the collection
        </h2>
      </div>

      {error && (
        <p role="alert" style={{ padding: "0 64px" }}>
          Couldn't load stamps: {error}
        </p>
      )}

      <ul className="stamp-grid" style={{ padding: "24px 64px 100px" }}>
        {featured.map((stamp) => (
          <li key={stamp.id}>
            <Link to={`/stamps/${stamp.id}`} className="stamp-card">
              <div className="plate-frame">
                <StampPlate sgNumber={stamp.sgNumber} countryCode={countryCode(stamp.country)} issueYear={stamp.issueYear} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="eyebrow">
                  {stamp.era} &middot; {stamp.issueYear}
                </div>
                <div className="serif" style={{ fontSize: 18, fontWeight: 500 }}>
                  {stamp.title}
                </div>
                <div className="meta-row">
                  <span>{stamp.sgNumber}</span>
                  <ConditionTag condition={stamp.condition} />
                  {stamp.grade && <span>{stamp.grade}</span>}
                </div>
                <p className="desc">{stamp.description}</p>
                <div className="price-row">
                  <span className="price">{formatPrice(stamp.pricePence)}</span>
                  <span className="view-link">View &rarr;</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
