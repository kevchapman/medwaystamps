import { Link } from "react-router";
import { formatPrice } from "../lib/format";
import { apiFetch } from "../lib/apiFetch.server";
import StampPlate from "../components/StampPlate";
import ConditionTag from "../components/ConditionTag";
import AddToCartControl from "../components/AddToCartControl";
import type { Stamp } from "../types";
import type { Route } from "./+types/StampDetail";
import styles from "./StampDetail.module.scss";

// SSR'd and cached (see app/lib/pageCache.server.ts) — this is one of the
// two page types this migration exists for, so its HTML needs to contain
// the real title/description/price for crawlers. `status` is deliberately
// NOT read anywhere in this component; see AddToCartControl.
export async function loader({ params, context }: Route.LoaderArgs) {
  const res = await apiFetch(`/api/stamps/${params.id}`, context.cloudflare.env, context.cloudflare.ctx);
  if (res.status === 404) throw new Response("Stamp not found", { status: 404 });
  if (!res.ok) throw new Response("Failed to load stamp", { status: 502 });
  return (await res.json()) as Stamp;
}

export function meta({ data }: Route.MetaArgs) {
  if (!data) return [{ title: "Stamp not found — Medway Stamps" }];
  return [
    { title: `${data.title} (${data.sgNumber}) — Medway Stamps` },
    { name: "description", content: data.description.slice(0, 155) },
  ];
}

export default function StampDetail({ loaderData }: Route.ComponentProps) {
  const stamp = loaderData;

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

          <AddToCartControl stampId={stamp.id} title={stamp.title} pricePence={stamp.pricePence} />
          <div className={styles.footnote}>One of one &mdash; once it's gone, it's gone.</div>
        </div>
      </div>
    </section>
  );
}
