import { useId } from "react";

// The finalized mark from design/LogoOptions.dc.html: two stacked,
// perforated "specimen plates" with a serif monogram on top. Perforation
// circles sit exactly on each corner (shared bite between adjoining
// edges) and repeat at the same spacing along the flat edges.
const PERFORATIONS = [0, 14.29, 28.57, 42.86, 57.14, 71.43, 85.71, 100];

function PerforationMask({ id }: { id: string }) {
  return (
    <mask id={id}>
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
  );
}

export default function Logo({ size = 32 }: { size?: number }) {
  const uid = useId();
  const backMask = `logo-back-${uid}`;
  const frontMask = `logo-front-${uid}`;

  return (
    <svg viewBox="-12 -12 124 124" width={size} height={size} aria-hidden="true">
      <defs>
        <PerforationMask id={backMask} />
        <PerforationMask id={frontMask} />
      </defs>
      <g transform="rotate(-7 50 50) translate(-7,-5)">
        <rect width="100" height="100" fill="#26372c" mask={`url(#${backMask})`} />
      </g>
      <g transform="rotate(6 50 50) translate(5,5)">
        <rect width="100" height="100" fill="#7a3f28" mask={`url(#${frontMask})`} />
        <text
          x="50"
          y="67"
          fontSize="50"
          fontWeight="600"
          fill="#e8e2d6"
          textAnchor="middle"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          M
        </text>
      </g>
    </svg>
  );
}
