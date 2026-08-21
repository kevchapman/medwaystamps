import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listStamps } from "../lib/api";
import { formatPrice } from "../lib/format";
import type { Stamp, StampCondition } from "../types";

const CONDITIONS: StampCondition[] = ["mint", "mounted_mint", "used", "fine_used"];

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
      <h1>Catalog</h1>

      <form onSubmit={(e) => e.preventDefault()} className="filters">
        <input
          type="search"
          placeholder="Search title, description, SG number..."
          value={q}
          onChange={(e) => updateParam("q", e.target.value)}
        />
        <input
          type="text"
          placeholder="Era (e.g. Victoria)"
          value={era}
          onChange={(e) => updateParam("era", e.target.value)}
        />
        <select
          value={condition ?? ""}
          onChange={(e) => updateParam("condition", e.target.value)}
        >
          <option value="">Any condition</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {c.replace("_", " ")}
            </option>
          ))}
        </select>
      </form>

      {loading && <p>Loading…</p>}
      {error && <p role="alert">Couldn't load stamps: {error}</p>}
      {!loading && !error && <p>{total} stamp(s) found</p>}

      <ul className="stamp-grid">
        {items.map((stamp) => (
          <li key={stamp.id}>
            <Link to={`/stamps/${stamp.id}`}>
              <strong>{stamp.title}</strong>
              <span>{stamp.sgNumber}</span>
              <span>{formatPrice(stamp.pricePence)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
