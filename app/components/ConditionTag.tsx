import type { StampCondition } from "../types";

const LABELS: Record<StampCondition, string> = {
  mint: "Mint",
  mounted_mint: "Mint",
  used: "Used",
  fine_used: "Used",
};

const VARIANTS: Record<StampCondition, "used" | "mint"> = {
  mint: "mint",
  mounted_mint: "mint",
  used: "used",
  fine_used: "used",
};

export default function ConditionTag({ condition }: { condition: StampCondition }) {
  return <span className={`tag tag--${VARIANTS[condition]}`}>{LABELS[condition]}</span>;
}
