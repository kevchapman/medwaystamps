import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { useAdminAuth } from "../context/AdminAuthContext";
import styles from "./AdminLogin.module.scss";

export default function AdminLogin() {
  const { admin, login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (admin) return <Navigate to="/admin" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/admin");
    } catch {
      setError("Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.page}>
      <div className="eyebrow">Admin</div>
      <h1 className={`serif page-title ${styles.title}`}>Log in</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.field}>
          <span className="eyebrow">Email</span>
          <input
            className="field"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className={styles.field}>
          <span className="eyebrow">Password</span>
          <input
            className="field"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}

        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
    </section>
  );
}
