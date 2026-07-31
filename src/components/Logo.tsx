import type { JSX } from "react";

/**
 * App logo — a stylised traditional Mongolian vertical-script column
 * (crown, spine, teeth/shilbe, tail flourish). Strokes use currentColor so the
 * mark inherits the surrounding text colour. Purely decorative → aria-hidden.
 */
export function Logo({ className }: { className?: string }): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {/* spine */}
        <path d="M12 2.5 V21.5" />
        {/* crown / head */}
        <path d="M9 4.5 Q12 2 15 4.5" />
        {/* teeth (shilbe) */}
        <path d="M12 8 Q15 8.5 15.5 11" />
        <path d="M12 12.5 Q15 13 15.5 15.5" />
        {/* tail flourish */}
        <path d="M12 20.5 Q10 22 8 21" />
      </g>
    </svg>
  );
}

export default Logo;
