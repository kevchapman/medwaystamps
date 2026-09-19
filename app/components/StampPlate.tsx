import { useId } from "react";

// Illustrated "specimen plate" placeholder for a stamp's photograph.
// Used wherever a stamp has no real image uploaded yet (stamp.images is
// empty for all seeded data today — see SPEC.md's admin/image-upload
// phase). Deterministic per stamp so the same item always renders the
// same plate color. Perforation geometry matches the site's logo mark
// (app/components/Logo.tsx) — corner-anchored bites, same rhythm along
// each edge — so the two read as one visual system.

const PLATE_COLORS = ["#1c1a17", "#1e3a5f", "#26372c", "#3a2a3a", "#332a1c"];
const PERFORATIONS = [0, 14.29, 28.57, 42.86, 57.14, 71.43, 85.71, 100];

const QUEEN_PATH =
  "M50,10 C41,10 34,17 32,26 C30,32 25,34 22,38 C26,41 30,39 32,43 C30,50 32,58 38,62 L38,84 L68,84 L68,58 C68,48 63,40 58,34 C62,28 60,17 52,12 C51,11 50,10 50,10 Z";
// Same forehead/crown as the queen path, but the jaw is built out into a
// wavy beard silhouette instead of a clean neckline.
const KING_PATH =
  "M50,10 C42,10 35,16 33,25 C31,31 26,33 23,37 C27,40 31,38 33,42 C30,48 30,54 34,58 C30,62 28,68 30,74 C33,80 40,83 46,84 L68,84 L68,58 C68,48 63,40 58,34 C62,28 60,17 52,12 C51,11 50,10 50,10 Z";

const ERA_INFO: Record<string, { cypher: string; silhouette: string; ornate: boolean }> = {
  Victoria: { cypher: "VR", silhouette: QUEEN_PATH, ornate: true },
  "Edward VII": { cypher: "ER", silhouette: KING_PATH, ornate: true },
  "George V": { cypher: "GR", silhouette: KING_PATH, ornate: true },
  "George VI": { cypher: "GVIR", silhouette: KING_PATH, ornate: true },
  "Elizabeth II": { cypher: "EIIR", silhouette: QUEEN_PATH, ornate: false },
};
const DEFAULT_ERA_INFO = { cypher: "", silhouette: QUEEN_PATH, ornate: true };

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
  era: string;
  issueYear: number | null;
  size?: keyof typeof SIZES;
}

export default function StampPlate({ sgNumber, era, issueYear, size = "md" }: StampPlateProps) {
  const uid = useId();
  const maskId = `plate-perf-${uid}`;
  const color = PLATE_COLORS[hashString(sgNumber) % PLATE_COLORS.length];
  const { plate, svg, corner, label } = SIZES[size];
  const { cypher, silhouette, ornate } = ERA_INFO[era] ?? DEFAULT_ERA_INFO;

  return (
    <div
      style={{
        width: plate,
        height: plate * (size === "lg" ? 1.29 : 1.25),
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: plate * 0.09,
        position: "relative",
      }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <mask id={maskId}>
            <rect width="100" height="100" fill="white" />
            {PERFORATIONS.map((p) => (
              <circle key={`t-${p}`} cx={p} cy={0} r={4.5} fill="black" />
            ))}
            {PERFORATIONS.map((p) => (
              <circle key={`b-${p}`} cx={p} cy={100} r={4.5} fill="black" />
            ))}
            {PERFORATIONS.map((p) => (
              <circle key={`l-${p}`} cx={0} cy={p} r={4.5} fill="black" />
            ))}
            {PERFORATIONS.map((p) => (
              <circle key={`r-${p}`} cx={100} cy={p} r={4.5} fill="black" />
            ))}
          </mask>
        </defs>
        <rect width="100" height="100" fill={color} mask={`url(#${maskId})`} />
      </svg>

      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-serif)",
          fontSize: corner,
          color: "#e8e2d6",
        }}
      >
        <span>{issueYear ?? ""}</span>
        <span>{cypher}</span>
      </div>

      <svg viewBox="0 0 100 100" width={svg} height={svg} style={{ position: "relative", alignSelf: "center" }}>
        {ornate && <ellipse cx="50" cy="45" rx="33" ry="41" fill="none" stroke="#e8e2d6" strokeWidth="1.2" opacity="0.55" />}
        <path d={silhouette} fill="#e8e2d6" />
        {/* A few fine engraving-style strokes suggesting a collar/shoulder fold */}
        <path d="M40,78 Q44,80 41,83" stroke="#e8e2d6" strokeWidth="0.8" fill="none" opacity="0.45" />
        <path d="M58,78 Q54,80 57,83" stroke="#e8e2d6" strokeWidth="0.8" fill="none" opacity="0.45" />
      </svg>

      <div
        style={{
          position: "relative",
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
