import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useCart } from "../context/CartContext";
import type { StampStatus } from "../types";

interface AddToCartControlProps {
  stampId: string;
  title: string;
  pricePence: number;
}

// Deliberately never told the stamp's status by its caller — this is the
// piece that keeps StampDetail's SSR'd/cached HTML correct even though
// status can change from a checkout (not just an admin edit): it always
// starts "loading" (identical output regardless of real status, so it's
// safe to cache) and fetches the live value itself, after hydration. See
// app/lib/pageCache.server.ts for the other half of this invariant.
export default function AddToCartControl({ stampId, title, pricePence }: AddToCartControlProps) {
  const [status, setStatus] = useState<StampStatus | "loading">("loading");
  const { addLine } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/stamps/${stampId}`)
      .then((r) => r.json() as Promise<{ status: StampStatus }>)
      .then((d) => {
        if (!cancelled) setStatus(d.status);
      })
      .catch(() => {
        // Fail open — matches the pre-SSR behavior, where a failed fetch
        // just left the button in whatever state local data last had.
        if (!cancelled) setStatus("available");
      });
    return () => {
      cancelled = true;
    };
  }, [stampId]);

  const available = status === "available";

  return (
    <button
      className="btn"
      disabled={!available}
      onClick={() => {
        addLine({ stampId, title, pricePence, quantity: 1 });
        navigate("/cart");
      }}
    >
      {status === "loading" ? "Checking availability…" : available ? "Add to Collection" : "Sold"}
    </button>
  );
}
