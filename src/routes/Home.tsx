import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listStamps } from "../lib/api";
import StampPlate from "../components/StampPlate";
import StampGrid from "../components/StampGrid";
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

      {error && <p role="alert">Couldn't load stamps: {error}</p>}

      <StampGrid stamps={featured} />
    </section>
  );
}
