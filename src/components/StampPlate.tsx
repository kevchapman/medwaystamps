// Illustrated "specimen plate" placeholder for a stamp's photograph.
// Used wherever a stamp has no real image uploaded yet (stamp.images is
// empty for all seeded data today — see SPEC.md's admin/image-upload
// phase). Deterministic per stamp so the same item always renders the
// same plate color.

const PLATE_COLORS = ["#1c1a17", "#1e3a5f", "#26372c", "#3a2a3a", "#332a1c"];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const SIZES = {
  sm: { plate: 140, svg: 60, corner: 9, label: 8 },
  md: { plate: 160, svg: 66, corner: 10, label: 9 },
  lg: { plate: 280, svg: 140, corner: 14, label: 12 },
} as const;

interface StampPlateProps {
  sgNumber: string;
  countryCode: string;
  issueYear: number | null;
  size?: keyof typeof SIZES;
}

export default function StampPlate({ sgNumber, countryCode, issueYear, size = "md" }: StampPlateProps) {
  const color = PLATE_COLORS[hashString(sgNumber) % PLATE_COLORS.length];
  const { plate, svg, corner, label } = SIZES[size];

  return (
    <div
      style={{
        width: plate,
        height: plate * (size === "lg" ? 1.29 : 1.25),
        background: color,
        padding: plate * 0.09,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-serif)",
          fontSize: corner,
          color: "#e8e2d6",
        }}
      >
        <span>{issueYear ?? ""}</span>
        <span>{countryCode}</span>
      </div>
      <svg viewBox="0 0 100 100" width={svg} height={svg} style={{ alignSelf: "center" }}>
        <path
          d="M50,10 C41,10 34,17 32,26 C30,32 25,34 22,38 C26,41 30,39 32,43 C30,50 32,58 38,62 L38,84 L68,84 L68,58 C68,48 63,40 58,34 C62,28 60,17 52,12 C51,11 50,10 50,10 Z"
          fill="#e8e2d6"
        />
      </svg>
      <div
        style={{
          textAlign: "center",
          fontFamily: "var(--font-serif)",
          letterSpacing: "0.06em",
          fontSize: label,
          color: "#e8e2d6",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {sgNumber}
      </div>
    </div>
  );
}
