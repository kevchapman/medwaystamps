import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listStamps } from "../lib/api";
import { countryCode, formatPrice } from "../lib/format";
import StampPlate from "../components/StampPlate";
import ConditionTag from "../components/ConditionTag";
import type { Stamp, StampCondition } from "../types";

const CONDITIONS: StampCondition[] = ["mint", "mounted_mint", "used", "fine_used"];
const CONDITION_LABELS: Record<StampCondition, string> = {
  mint: "Mint",
  mounted_mint: "Mounted mint",
  used: "Used",
  fine_used: "Fine used",
};

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<Stamp[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = params.get("q") ?? "";
  const era = params.get("era") ?? "";
  const condition = (params.get("condition") as StampCondition) || undefined;

  useEffect(() => {
    setLoading(true);
    setError(null);
    listStamps({ q, era: era || undefined, condition })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [q, era, condition]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  return (
    <section>
      <div style={{ padding: "56px 64px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="eyebrow">The catalogue</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <h1 className="serif" style={{ fontSize: 36, fontWeight: 500, margin: 0 }}>
            All stamps
          </h1>
          <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            {loading ? "Searching…" : `${total} stamp${total === 1 ? "" : "s"} found`}
          </div>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="filters">
          <input
            type="search"
            className="field"
            placeholder="Search by title, SG number..."
            value={q}
            onChange={(e) => updateParam("q", e.target.value)}
            style={{ flex: 1, minWidth: 240 }}
          />
          <select className="field" value={era} onChange={(e) => updateParam("era", e.target.value)}>
            <option value="">Any era</option>
            <option value="Victoria">Victoria</option>
            <option value="Edward VII">Edward VII</option>
            <option value="George V">George V</option>
            <option value="George VI">George VI</option>
            <option value="Elizabeth II">Elizabeth II</option>
          </select>
          <select
            className="field"
            value={condition ?? ""}
            onChange={(e) => updateParam("condition", e.target.value)}
          >
            <option value="">Any condition</option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {CONDITION_LABELS[c]}
              </option>
            ))}
          </select>
        </form>
      </div>

      {error && (
        <p role="alert" style={{ padding: "0 64px" }}>
          Couldn't load stamps: {error}
        </p>
      )}

      <ul className="stamp-grid" style={{ padding: "24px 64px 100px" }}>
        {items.map((stamp) => (
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
