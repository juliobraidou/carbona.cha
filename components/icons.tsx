/**
 * Inline SVGs, no icon library. Every path is decorative — the accessible
 * name always comes from the surrounding button or heading.
 */

type IconProps = { className?: string };

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function CartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...STROKE}>
      <path d="M3 5h2.2l1.8 9.6a1.6 1.6 0 0 0 1.6 1.3h7.9a1.6 1.6 0 0 0 1.6-1.2L20 8H6.4" />
      <circle cx="9.5" cy="19.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="17" cy="19.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ArrowUpIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...STROKE}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}

export function ArrowDownIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...STROKE}>
      <path d="M12 5v14M18 13l-6 6-6-6" />
    </svg>
  );
}

export function ArrowUpRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...STROKE}>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

/** Loose-leaf tea bag — "Chá preto de verdade". */
export function TeaIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...STROKE}>
      <path d="M12 3v5" />
      <rect x="7" y="8" width="10" height="12" rx="1.6" />
      <path d="M10 12h4" />
    </svg>
  );
}

/** Struck-through sugar cube — "Zero açúcar adicionado". */
export function NoSugarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...STROKE}>
      <path d="M5 9.5 12 6l7 3.5-7 3.5-7-3.5Z" />
      <path d="M5 14.5 12 18l7-3.5" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

/** Lightning bolt — "Cafeína natural". */
export function BoltIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...STROKE}>
      <path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" />
    </svg>
  );
}

const FACT_ICONS = {
  tea: TeaIcon,
  "no-sugar": NoSugarIcon,
  bolt: BoltIcon,
} as const;

export type FactIconName = keyof typeof FACT_ICONS;

export function FactIcon({ name, className }: { name: FactIconName; className?: string }) {
  const Icon = FACT_ICONS[name];
  return <Icon className={className} />;
}
