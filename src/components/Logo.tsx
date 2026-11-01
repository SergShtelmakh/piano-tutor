import { useId } from 'react';

/** The app mark (three keys, the middle one pressed) on its dark tile. `size` is the tile in px. */
export default function Logo({ size = 40 }: { size?: number }) {
  const id = useId();
  const white = `${id}-w`;
  const mid = `${id}-m`;
  const black = `${id}-b`;

  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center border-[1.5px] border-line bg-surface"
      style={{ width: size, height: size, borderRadius: size * 0.3 }}
    >
      <svg width={size * 0.7} height={size * 0.7} viewBox="10 10 76 76">
        <defs>
          <linearGradient id={white} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#D3D0C7" />
          </linearGradient>
          <linearGradient id={mid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8BECDB" />
            <stop offset="1" stopColor="#5ED6C1" />
          </linearGradient>
          <linearGradient id={black} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#3A4050" />
            <stop offset="0.5" stopColor="#1B1F28" />
            <stop offset="1" stopColor="#0A0C11" />
          </linearGradient>
        </defs>
        <rect x="12" y="12" width="72" height="72" rx="9" fill={`url(#${white})`} />
        <rect x="12" y="74" width="72" height="10" rx="5" fill="#B9B6AE" />
        <rect x="36" y="14" width="24" height="70" fill={`url(#${mid})`} />
        <rect x="36" y="76" width="24" height="8" fill="#3FB8A4" />
        <path d="M36 12V84M60 12V84" stroke="#B9B6AE" strokeWidth="1.5" />
        <rect x="28" y="12" width="16" height="46" rx="5" fill={`url(#${black})`} />
        <rect x="52" y="12" width="16" height="46" rx="5" fill={`url(#${black})`} />
      </svg>
    </span>
  );
}
