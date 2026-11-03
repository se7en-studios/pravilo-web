// Banda curva gruesa, como las de las piezas de Instagram de PRAVILO.
// Se dibuja con el scroll (data-draw lo maneja MotionRoot).
const PATHS = {
  arc: "M -60 560 C 220 40, 780 40, 1060 520",
  swoop: "M -60 120 C 300 620, 700 620, 1060 80",
  wave: "M -60 420 C 200 120, 420 120, 560 320 S 900 560, 1060 220",
};

export default function Band({
  shape = "arc",
  color = "var(--accent)",
  width = 70,
  className = "",
}: {
  shape?: keyof typeof PATHS;
  color?: string;
  width?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 1000 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className={`band pointer-events-none ${className}`}
    >
      <path data-draw d={PATHS[shape]} stroke={color} strokeWidth={width} />
    </svg>
  );
}
