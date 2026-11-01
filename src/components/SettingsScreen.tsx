import type { ReactNode } from 'react';
import { useSheetStyle } from '../display/useSheetStyle.ts';
import { setSheetStyle, type SheetStyle } from '../display/sheetStyle.ts';
import { useT } from '../i18n/context.ts';
import type { MessageKey } from '../i18n/locales/en.ts';
import BuildInfo from './BuildInfo.tsx';
import { SlidersIcon } from './icons.tsx';
import { SegmentedControl } from './LayoutControls.tsx';
import LanguageSelector from './LanguageSelector.tsx';
import MidiStatus from './MidiStatus.tsx';
import { buttonOutline, card, sectionLabel } from './ui.ts';
import VolumeControl from './VolumeControl.tsx';

function Section({ titleKey, children }: { titleKey: MessageKey; children: ReactNode }) {
  const t = useT();
  return (
    <section className={`${card} flex flex-col gap-4 p-5 text-left md:p-6`}>
      <h2 className={sectionLabel}>{t(titleKey)}</h2>
      {children}
    </section>
  );
}

/** Language, the MIDI keyboard, sound, the lesson layout, and the build line. */
export default function SettingsScreen({ onEditLayout }: { onEditLayout: () => void }) {
  const t = useT();
  const sheet = useSheetStyle();
  return (
    <div className="flex w-full max-w-3xl flex-col gap-5">
      <Section titleKey="languageLabel">
        <LanguageSelector />
      </Section>
      <Section titleKey="settingsMidi">
        <MidiStatus />
      </Section>
      <Section titleKey="settingsSound">
        <VolumeControl />
      </Section>
      <Section titleKey="sheetSectionTitle">
        <p className="text-ink-muted">{t('sheetSectionText')}</p>
        <SegmentedControl<SheetStyle>
          title={t('sheetSectionTitle')}
          hideTitle
          options={[
            { value: 'paper', text: t('sheetPaper') },
            { value: 'dark', text: t('sheetDark') },
          ]}
          value={sheet}
          onChange={setSheetStyle}
        />
      </Section>
      <Section titleKey="layoutSectionTitle">
        <p className="text-ink-muted">{t('layoutSectionText')}</p>
        <button type="button" onClick={onEditLayout} className={`${buttonOutline} self-start`}>
          <SlidersIcon size={20} />
          {t('layoutEdit')}
        </button>
      </Section>
      <Section titleKey="settingsAbout">
        <BuildInfo />
      </Section>
    </div>
  );
}
