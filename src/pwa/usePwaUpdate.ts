import { useRegisterSW } from 'virtual:pwa-register/react';

/** Service worker state for the offline note and the update banner. */
export function usePwaUpdate() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  return {
    offlineReady,
    needRefresh,
    /** Activates the waiting version and reloads the page. */
    reload: () => updateServiceWorker(true),
    dismissOfflineReady: () => setOfflineReady(false),
    /** "Later": hides the banner until the next app start. */
    dismissUpdate: () => setNeedRefresh(false),
  };
}
