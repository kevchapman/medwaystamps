import { useNavigate } from "react-router-dom";
import StampForm from "../components/StampForm";
import styles from "./AdminStampForm.module.scss";

export default function AdminStampNew() {
  const navigate = useNavigate();

  return (
    <section className={styles.page}>
      <div className="eyebrow">Admin</div>
      <h1 className={`serif page-title ${styles.title}`}>Add stamp</h1>
      <StampForm mode="create" onSaved={(stamp) => navigate(`/admin/stamps/${stamp.id}/edit`)} />
    </section>
  );
}
