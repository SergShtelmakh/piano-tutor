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
    <footer className="px-4 pb-4 text-center text-xs text-slate-500">
      {t('buildLabel')} {commit} · {host}
    </footer>
  );
}
