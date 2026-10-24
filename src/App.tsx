import LanguageSelector from './components/LanguageSelector.tsx';
import { useT } from './i18n/context.ts';

export default function App() {
  const t = useT();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="flex justify-end px-4 py-3">
        <LanguageSelector />
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 pb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t('appName')}</h1>
        <p className="text-lg text-slate-700">{t('tagline')}</p>
        <p className="rounded-lg bg-white px-4 py-3 text-slate-600 shadow-sm">{t('comingSoon')}</p>
      </main>
    </div>
  );
}
