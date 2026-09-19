import { Link } from "react-router";
import { apiFetch } from "../lib/apiFetch.server";
import StampPlate from "../components/StampPlate";
import StampGrid from "../components/StampGrid";
import type { Stamp, StampListResponse } from "../types";
import type { Route } from "./+types/Home";
import styles from "./Home.module.scss";

// SSR'd and cached (see app/lib/pageCache.server.ts) — none of this page's
// content depends on stamp `status`, so it's safe to cache as-is.
export async function loader({ context }: Route.LoaderArgs) {
  const res = await apiFetch("/api/stamps?sort=newest&limit=6", context.cloudflare.env, context.cloudflare.ctx);
  const data = (await res.json()) as StampListResponse;
  return data.items;
}

export function meta() {
  return [
    { title: "Medway Stamps — Rare & Collectible British Philately" },
    {
      name: "description",
      content: "Rare British stamps, authenticated and catalogued — each piece a single, verified original.",
    },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const featured: Stamp[] = loaderData;
  const hero = featured[0];

  return (
    <section>
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className="eyebrow">Est. for the serious collector</div>
          <h1 className={`serif ${styles.heroTitle}`}>
            Rare British stamps, authenticated and ready to own.
          </h1>
          <p className={styles.heroLede}>
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
          <div className={styles.heroPlateWrap}>
            <div className={styles.heroPlate}>
              <StampPlate
                sgNumber={hero.sgNumber}
                era={hero.era}
                issueYear={hero.issueYear}
                size="lg"
              />
              <div className={`serif ${styles.heroPlateCaption}`}>{hero.sgNumber}</div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.sectionHeading}>
        <div className="eyebrow">Recently acquired</div>
        <h2 className={`serif ${styles.sectionTitle}`}>New to the collection</h2>
      </div>

      <StampGrid stamps={featured} />
    </section>
  );
}
