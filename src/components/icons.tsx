import type { ReactNode } from 'react';

// Inline stroke icons (24 × 24, `currentColor`). Decorative: the control around them has the name.
function icon(paths: ReactNode, extra: { fill?: boolean } = {}) {
  return function Icon({ size = 24, className }: { size?: number; className?: string }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={extra.fill ? 'currentColor' : 'none'}
        stroke={extra.fill ? 'none' : 'currentColor'}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
      >
        {paths}
      </svg>
    );
  };
}

export const HomeIcon = icon(<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />);
export const NoteIcon = icon(
  <>
    <path d="M9 18V5l11-2v13" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="17.5" cy="16" r="2.5" />
  </>,
);
export const LibraryIcon = icon(
  <>
    <rect x="3.5" y="4" width="5" height="16" rx="1" />
    <rect x="10" y="4" width="5" height="16" rx="1" />
    <path d="M17 6.5l3.5 13" />
  </>,
);
export const KeysIcon = icon(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M9 5v14M15 5v14" />
    <path d="M7.5 5v7M13.5 5v7" strokeWidth={3} />
  </>,
);
export const SlidersIcon = icon(
  <>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </>,
);
export const BackIcon = icon(<path d="M15 6l-6 6 6 6" />);
export const ChevronRightIcon = icon(<path d="M9 6l6 6-6 6" />);
export const PlayIcon = icon(<path d="M8 5l11 7-11 7z" />, { fill: true });
export const CheckIcon = icon(<path d="M5 12.5l4.5 4.5L19 7.5" />);
export const VolumeIcon = icon(
  <>
    <path d="M4 10v4h4l5 4V6l-5 4z" />
    <path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11" />
  </>,
);
export const MuteIcon = icon(
  <>
    <path d="M4 10v4h4l5 4V6l-5 4z" />
    <path d="M17 9.5l4 5M21 9.5l-4 5" />
  </>,
);
export const PlusIcon = icon(<path d="M12 5v14M5 12h14" />);
export const CloseIcon = icon(<path d="M6 6l12 12M18 6L6 18" />);
export const FileIcon = icon(
  <>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M12 17v-5M9.5 14.5L12 12l2.5 2.5" />
  </>,
);
export const TrashIcon = icon(
  <>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" />
  </>,
);
export const SearchIcon = icon(
  <>
    <circle cx="11" cy="11" r="6" />
    <path d="M20 20l-4.2-4.2" />
  </>,
);
export const PauseIcon = icon(
  <>
    <rect x="6" y="5" width="4" height="14" rx="1.2" />
    <rect x="14" y="5" width="4" height="14" rx="1.2" />
  </>,
  { fill: true },
);
export const StopIcon = icon(<rect x="6" y="6" width="12" height="12" rx="2" />, { fill: true });
export const MetronomeIcon = icon(
  <>
    <path d="M8.5 21l2-17h3l2 17z" />
    <path d="M12 16L16 7M6 21h12" />
  </>,
);
export const BulbIcon = icon(
  <>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
  </>,
);
