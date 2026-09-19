import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listStamps } from "../lib/api";
import { formatPrice } from "../lib/format";
import { useAdminAuth } from "../context/AdminAuthContext";
import ConditionTag from "../components/ConditionTag";
import type { Stamp } from "../types";
import styles from "./AdminDashboard.module.scss";

// Reuses the existing public listStamps() — GET /api/stamps already returns
// every status (available/reserved/sold) unfiltered, so there's no need for
// a separate admin-only listing endpoint.
export default function AdminDashboard() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listStamps({ sort: "newest", limit: 100 })
      .then((res) => setItems(res.items))
      .catch((err: unknown) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/admin/login");
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className="eyebrow">Admin &middot; {admin?.email}</div>
          <h1 className={`serif page-title ${styles.title}`}>Stamps</h1>
        </div>
        <div className={styles.headerActions}>
          <Link to="/admin/stamps/new" className="btn">
            + Add stamp
          </Link>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      {loading && <p>Loading…</p>}
      {error && (
        <p role="alert" className={styles.error}>
          Couldn't load stamps: {error}
        </p>
      )}

      <div className="spec-list">
        {items.map((stamp) => (
          <div key={stamp.id} className="spec-row">
            <div className={styles.rowMain}>
              <span className={`serif ${styles.rowTitle}`}>{stamp.title}</span>
              <span className={styles.rowMeta}>
                {stamp.era} &middot; {stamp.sgNumber}
              </span>
            </div>
            <div className={styles.rowRight}>
              <ConditionTag condition={stamp.condition} />
              <span className={styles.rowStatus}>{stamp.status}</span>
              <span className={`serif ${styles.rowPrice}`}>{formatPrice(stamp.pricePence)}</span>
              <Link to={`/admin/stamps/${stamp.id}/edit`}>Edit</Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
