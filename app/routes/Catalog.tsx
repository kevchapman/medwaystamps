import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { listStamps } from "../lib/api";
import StampGrid from "../components/StampGrid";
import type { Stamp, StampCondition } from "../types";
import styles from "./Catalog.module.scss";

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
      <div className={styles.header}>
        <div className="eyebrow">The catalogue</div>
        <div className={styles.headerRow}>
          <h1 className={`serif page-title ${styles.headerTitle}`}>All stamps</h1>
          <div className={styles.count}>
            {loading ? "Searching…" : `${total} stamp${total === 1 ? "" : "s"} found`}
          </div>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="filters">
          <input
            type="search"
            className={`field ${styles.searchField}`}
            placeholder="Search by title, SG number..."
            value={q}
            onChange={(e) => updateParam("q", e.target.value)}
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

      {error && <p role="alert">Couldn't load stamps: {error}</p>}

      <StampGrid stamps={items} />
    </section>
  );
}
