import { describe, expect, it } from 'vitest';
import { shouldShowInstallHint, type InstallHintInput } from './installHint.ts';

const base: InstallHintInput = {
  canPrompt: true,
  dismissed: false,
  standalone: false,
  screen: 'home',
};

describe('shouldShowInstallHint', () => {
  it('shows the card on Home when the browser offers installation', () => {
    expect(shouldShowInstallHint(base)).toBe(true);
  });

  it('hides it when the browser does not offer installation', () => {
    expect(shouldShowInstallHint({ ...base, canPrompt: false })).toBe(false);
  });

  it('hides it after "Not now"', () => {
    expect(shouldShowInstallHint({ ...base, dismissed: true })).toBe(false);
  });

  it('hides it when the app is already installed', () => {
    expect(shouldShowInstallHint({ ...base, standalone: true })).toBe(false);
  });

  it('hides it outside Home', () => {
    expect(shouldShowInstallHint({ ...base, screen: 'free' })).toBe(false);
    expect(shouldShowInstallHint({ ...base, screen: 'lesson' })).toBe(false);
  });

  it('covers every combination: only the all-clear one shows the card', () => {
    const bools = [true, false];
    const screens: InstallHintInput['screen'][] = ['home', 'free', 'lesson'];
    for (const canPrompt of bools)
      for (const dismissed of bools)
        for (const standalone of bools)
          for (const screen of screens) {
            const expected = canPrompt && !dismissed && !standalone && screen === 'home';
            expect(shouldShowInstallHint({ canPrompt, dismissed, standalone, screen })).toBe(
              expected,
            );
          }
  });
});
