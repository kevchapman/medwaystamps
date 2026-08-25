import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listStamps } from "../lib/api";
import { formatPrice } from "../lib/format";
import StampPlate from "../components/StampPlate";
import ConditionTag from "../components/ConditionTag";
import type { Stamp } from "../types";
import styles from "./Home.module.scss";

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

      {error && (
        <p role="alert" className={styles.error}>
          Couldn't load stamps: {error}
        </p>
      )}

      <ul className={`stamp-grid ${styles.grid}`}>
        {featured.map((stamp) => (
          <li key={stamp.id}>
            <Link to={`/stamps/${stamp.id}`} className="stamp-card">
              <div className="plate-frame">
                <StampPlate sgNumber={stamp.sgNumber} era={stamp.era} issueYear={stamp.issueYear} />
              </div>
              <div className={styles.cardBody}>
                <div className="eyebrow">
                  {stamp.era} &middot; {stamp.issueYear}
                </div>
                <div className={`serif ${styles.cardTitle}`}>{stamp.title}</div>
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
