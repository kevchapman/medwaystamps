import { useEffect, useState, type FormEvent } from "react";
import { createStamp, updateStamp, uploadStampImage } from "../lib/api";
import type { Stamp, StampCondition, StampInput, StampStatus } from "../types";
import styles from "./StampForm.module.scss";

const CONDITIONS: StampCondition[] = ["mint", "mounted_mint", "used", "fine_used"];
const CONDITION_LABELS: Record<StampCondition, string> = {
  mint: "Mint",
  mounted_mint: "Mounted mint",
  used: "Used",
  fine_used: "Fine used",
};
const STATUSES: StampStatus[] = ["available", "reserved", "sold"];
const ERAS = ["Victoria", "Edward VII", "George V", "George VI", "Elizabeth II"];

interface StampFormProps {
  mode: "create" | "edit";
  initial?: Stamp;
  onSaved: (stamp: Stamp) => void;
}

// Shared controlled form for both /admin/stamps/new and
// /admin/stamps/:id/edit. On submit: create-or-update the stamp's fields via
// JSON, then (if a photo was chosen) upload it as a separate multipart call
// — see src/lib/api.ts for why those are two requests rather than one.
export default function StampForm({ mode, initial, onSaved }: StampFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [country, setCountry] = useState(initial?.country ?? "Great Britain");
  const [era, setEra] = useState(initial?.era ?? ERAS[0]);
  const [issueYear, setIssueYear] = useState(initial?.issueYear?.toString() ?? "");
  const [issueYearEnd, setIssueYearEnd] = useState(initial?.issueYearEnd?.toString() ?? "");
  const [sgNumber, setSgNumber] = useState(initial?.sgNumber ?? "");
  const [condition, setCondition] = useState<StampCondition>(initial?.condition ?? "mint");
  const [grade, setGrade] = useState(initial?.grade ?? "");
  const [price, setPrice] = useState(initial ? (initial.pricePence / 100).toFixed(2) : "");
  const [quantity, setQuantity] = useState(initial?.quantity?.toString() ?? "1");
  const [status, setStatus] = useState<StampStatus>(initial?.status ?? "available");
  const [tags, setTags] = useState(initial?.tags?.join(", ") ?? "");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial?.images[0]?.url ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revoke the previous object URL whenever a new file is chosen or the
  // component unmounts, so we don't leak blob URLs.
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const input: StampInput = {
      title,
      description,
      country,
      era,
      issueYear: issueYear === "" ? null : Number(issueYear),
      issueYearEnd: issueYearEnd === "" ? null : Number(issueYearEnd),
      sgNumber,
      condition,
      grade: grade === "" ? null : grade,
      pricePence: Math.round(Number(price || "0") * 100),
      quantity: Number(quantity || "1"),
      status,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      const stamp = mode === "create" ? await createStamp(input) : await updateStamp(initial!.id, input);
      if (file) {
        await uploadStampImage(stamp.id, file);
      }
      onSaved(stamp);
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span className="eyebrow">Title</span>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <label className={`${styles.field} ${styles.span2}`}>
          <span className="eyebrow">Description</span>
          <textarea
            className="field"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>

        <label className={styles.field}>
          <span className="eyebrow">Country</span>
          <input className="field" value={country} onChange={(e) => setCountry(e.target.value)} required />
        </label>

        <label className={styles.field}>
          <span className="eyebrow">Era</span>
          <select className="field" value={era} onChange={(e) => setEra(e.target.value)}>
            {ERAS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className="eyebrow">Issue year</span>
          <input
            className="field"
            type="number"
            value={issueYear}
            onChange={(e) => setIssueYear(e.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className="eyebrow">Issue year (end, if a range)</span>
          <input
            className="field"
            type="number"
            value={issueYearEnd}
            onChange={(e) => setIssueYearEnd(e.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className="eyebrow">SG number</span>
          <input className="field" value={sgNumber} onChange={(e) => setSgNumber(e.target.value)} required />
        </label>

        <label className={styles.field}>
          <span className="eyebrow">Condition</span>
          <select
            className="field"
            value={condition}
            onChange={(e) => setCondition(e.target.value as StampCondition)}
          >
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {CONDITION_LABELS[c]}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className="eyebrow">Grade</span>
          <input className="field" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. very fine" />
        </label>

        <label className={styles.field}>
          <span className="eyebrow">Price (&pound;)</span>
          <input
            className="field"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </label>

        <label className={styles.field}>
          <span className="eyebrow">Quantity</span>
          <input
            className="field"
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className="eyebrow">Status</span>
          <select className="field" value={status} onChange={(e) => setStatus(e.target.value as StampStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className={`${styles.field} ${styles.span2}`}>
          <span className="eyebrow">Tags (comma separated)</span>
          <input className="field" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="penny black, error" />
        </label>

        <div className={`${styles.field} ${styles.span2}`}>
          <span className="eyebrow">Photo</span>
          <div className={styles.imageRow}>
            {preview && (
              <div className={`plate-frame ${styles.previewFrame}`}>
                <img src={preview} alt="" className={styles.previewImg} />
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          Couldn't save: {error}
        </p>
      )}

      <button className="btn" type="submit" disabled={submitting}>
        {submitting ? "Saving…" : mode === "create" ? "Add stamp" : "Save changes"}
      </button>
    </form>
  );
}
