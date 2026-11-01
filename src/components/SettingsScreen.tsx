import type { ReactNode } from 'react';
import { useT } from '../i18n/context.ts';
import type { MessageKey } from '../i18n/locales/en.ts';
import BuildInfo from './BuildInfo.tsx';
import LanguageSelector from './LanguageSelector.tsx';
import MidiStatus from './MidiStatus.tsx';
import { card, sectionLabel } from './ui.ts';
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

/** Language, the MIDI keyboard, sound, and the build line. */
export default function SettingsScreen() {
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
      <Section titleKey="settingsAbout">
        <BuildInfo />
      </Section>
    </div>
  );
}
