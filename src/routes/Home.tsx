import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listStamps } from "../lib/api";
import { formatPrice } from "../lib/format";
import type { Stamp } from "../types";

export default function Home() {
  const [featured, setFeatured] = useState<Stamp[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listStamps({ sort: "newest", limit: 6 })
      .then((res) => setFeatured(res.items))
      .catch((err: unknown) => setError(String(err)));
  }, []);

  return (
    <section>
      <h1>Medway Stamps</h1>
      <p>Rare and collectible British stamps.</p>
      <Link to="/catalog">Browse the full catalog &rarr;</Link>

      <h2>Recently added</h2>
      {error && <p role="alert">Couldn't load stamps: {error}</p>}
      <ul className="stamp-grid">
        {featured.map((stamp) => (
          <li key={stamp.id}>
            <Link to={`/stamps/${stamp.id}`}>
              <strong>{stamp.title}</strong>
              <span>{formatPrice(stamp.pricePence)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
