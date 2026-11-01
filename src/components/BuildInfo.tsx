import { useT } from '../i18n/context.ts';

const HOST_NAMES = {
  'github-pages': 'GitHub Pages',
  cloudflare: 'Cloudflare',
} as const;

export default function BuildInfo() {
  const t = useT();
  const { commit, target } = __BUILD_INFO__;
  const host = target === 'local' ? t('buildLocal') : HOST_NAMES[target];

  return (
    <p className="text-sm text-ink-muted">
      {t('buildLabel')} {commit} · {host}
    </p>
  );
}
