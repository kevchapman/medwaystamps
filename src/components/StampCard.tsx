import { Link } from "react-router-dom";
import { formatPrice } from "../lib/format";
import StampPlate from "./StampPlate";
import ConditionTag from "./ConditionTag";
import type { Stamp } from "../types";
import styles from "./StampCard.module.scss";

// The catalogue-tile presentation of a stamp — used wherever a list of
// stamps is shown (Home's "recently acquired" strip, the Catalog grid).
export default function StampCard({ stamp }: { stamp: Stamp }) {
  return (
    <Link to={`/stamps/${stamp.id}`} className="stamp-card">
      <div className="plate-frame">
        <StampPlate sgNumber={stamp.sgNumber} era={stamp.era} issueYear={stamp.issueYear} />
      </div>
      <div className={styles.body}>
        <div className="eyebrow">
          {stamp.era} &middot; {stamp.issueYear}
        </div>
        <div className={`serif ${styles.title}`}>{stamp.title}</div>
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
  );
}
