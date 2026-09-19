import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import { deleteStampImage, getStamp } from "../lib/api";
import StampForm from "../components/StampForm";
import type { Stamp } from "../types";
import styles from "./AdminStampForm.module.scss";

export default function AdminStampEdit() {
  const { id } = useParams<{ id: string }>();
  const [stamp, setStamp] = useState<Stamp | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!id) return;
    getStamp(id)
      .then(setStamp)
      .catch((err: unknown) => setError(String(err)));
  }, [id]);

  useEffect(reload, [reload]);

  async function handleDeleteImage(imageId: string) {
    await deleteStampImage(imageId);
    reload();
  }

  if (error)
    return (
      <p role="alert" className={styles.error}>
        Couldn't load this stamp: {error}
      </p>
    );
  if (!stamp) return <p>Loading…</p>;

  return (
    <section className={styles.page}>
      <div className="eyebrow">Admin</div>
      <h1 className={`serif page-title ${styles.title}`}>Edit stamp</h1>

      {stamp.images.length > 0 && (
        <div className={styles.images}>
          {stamp.images.map((img) => (
            <div key={img.id} className={styles.imageItem}>
              <div className="plate-frame">
                <img src={img.url} alt={img.altText ?? stamp.title} className={styles.imageThumb} />
              </div>
              <button type="button" className={styles.removeBtn} onClick={() => handleDeleteImage(img.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <StampForm mode="edit" initial={stamp} onSaved={reload} />
    </section>
  );
}
