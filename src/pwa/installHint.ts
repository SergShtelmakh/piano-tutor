export interface InstallHintInput {
  /** The browser offered installation (`beforeinstallprompt` fired and is still usable). */
  canPrompt: boolean;
  /** The learner chose "Not now" earlier, or in this session. */
  dismissed: boolean;
  /** The app already runs as an installed app. */
  standalone: boolean;
  /** The install card only belongs on Home. */
  screen: 'home' | 'free' | 'lesson';
}

/** Whether the install card is shown. Pure: the browser APIs stay in the adapters. */
export function shouldShowInstallHint(input: InstallHintInput): boolean {
  return input.canPrompt && !input.dismissed && !input.standalone && input.screen === 'home';
}
