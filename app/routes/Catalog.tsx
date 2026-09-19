import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { listStamps } from "../lib/api";
import { apiFetch } from "../lib/apiFetch.server";
import StampGrid from "../components/StampGrid";
import type { Stamp, StampCondition, StampListResponse } from "../types";
import type { Route } from "./+types/Catalog";
import styles from "./Catalog.module.scss";

const CONDITIONS: StampCondition[] = ["mint", "mounted_mint", "used", "fine_used"];
const CONDITION_LABELS: Record<StampCondition, string> = {
  mint: "Mint",
  mounted_mint: "Mounted mint",
  used: "Used",
  fine_used: "Fine used",
};

// SSR'd but NOT cached (unlike Home/StampDetail) — the search/filter
// query-param space is effectively unbounded, so a KV entry per combination
// doesn't converge. This still gives a real, crawlable first paint for
// whatever URL a crawler or direct link hits, matching the request's own
// querystring; client-side re-filtering after that keeps using the
// existing listStamps() flow unchanged.
export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const res = await apiFetch(`/api/stamps${url.search}`, context.cloudflare.env, context.cloudflare.ctx);
  return (await res.json()) as StampListResponse;
}

export function meta() {
  return [
    { title: "Catalogue — Medway Stamps" },
    { name: "description", content: "Browse the full catalogue of rare and collectible British stamps." },
  ];
}

export default function Catalog({ loaderData }: Route.ComponentProps) {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<Stamp[]>(loaderData.items);
  const [total, setTotal] = useState(loaderData.total);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = params.get("q") ?? "";
  const era = params.get("era") ?? "";
  const condition = (params.get("condition") as StampCondition) || undefined;

  // Skip the fetch on first mount — loaderData already matches the URL as
  // it was server-rendered. Only actual filter changes after that refetch.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
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
