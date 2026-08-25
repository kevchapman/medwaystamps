import StampCard from "./StampCard";
import type { Stamp } from "../types";
import styles from "./StampGrid.module.scss";

// The tiled list of StampCards used by both Home (featured items) and
// Catalog (search results).
export default function StampGrid({ stamps }: { stamps: Stamp[] }) {
  return (
    <ul className={`stamp-grid ${styles.grid}`}>
      {stamps.map((stamp) => (
        <li key={stamp.id}>
          <StampCard stamp={stamp} />
        </li>
      ))}
    </ul>
  );
}
