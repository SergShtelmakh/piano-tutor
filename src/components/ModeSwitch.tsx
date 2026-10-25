import { useT } from '../i18n/context.ts';

export type Mode = 'free' | 'lesson';

const MODES: { mode: Mode; labelKey: 'modeFree' | 'modeLesson' }[] = [
  { mode: 'free', labelKey: 'modeFree' },
  { mode: 'lesson', labelKey: 'modeLesson' },
];

export default function ModeSwitch({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
}) {
  const t = useT();

  return (
    <div
      role="group"
      aria-label={t('modeLabel')}
      className="inline-flex rounded-lg bg-slate-200 p-1"
    >
      {MODES.map((item) => (
        <button
          key={item.mode}
          type="button"
          aria-pressed={mode === item.mode}
          onClick={() => onChange(item.mode)}
          className={`rounded-md px-4 py-1.5 text-sm font-semibold ${
            mode === item.mode
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t(item.labelKey)}
        </button>
      ))}
    </div>
  );
}
