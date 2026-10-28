import { useState } from 'react';
import { initials, portraitUrl } from '../core/library.ts';
import type { LibraryComposer } from '../core/libraryCatalog.ts';
import { useT } from '../i18n/context.ts';

const SIZES = {
  small: { px: 40, box: 'h-10 w-10 text-sm' },
  large: { px: 72, box: 'h-[72px] w-[72px] text-xl' },
} as const;

/**
 * A composer's portrait as a round picture. It is decorative: the name is always written next to
 * it, so it has no alt text. If the picture does not load, the composer's initials take its place.
 */
export default function Portrait({
  composer,
  size,
}: {
  composer: LibraryComposer;
  size: keyof typeof SIZES;
}) {
  const t = useT();
  const [failed, setFailed] = useState(false);
  const { px, box } = SIZES[size];

  if (failed) {
    return (
      <span
        aria-hidden="true"
        className={`${box} inline-flex shrink-0 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700`}
      >
        {initials(t(composer.nameKey))}
      </span>
    );
  }
  return (
    <img
      src={portraitUrl(import.meta.env.BASE_URL, composer.portrait)}
      alt=""
      width={px}
      height={px}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`${box} shrink-0 rounded-full bg-slate-200 object-cover`}
    />
  );
}
