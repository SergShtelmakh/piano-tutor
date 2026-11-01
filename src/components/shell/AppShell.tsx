import type { ReactNode } from 'react';
import Navigation from './Navigation.tsx';
import type { Screen } from './screens.ts';

/** The page frame: navigation on the left when wide, the screen beside it. */
export default function AppShell({
  screen,
  onNavigate,
  children,
}: {
  screen: Screen;
  onNavigate: (screen: Screen) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen overflow-x-clip bg-bg text-ink">
      <Navigation current={screen} onChange={onNavigate} />
      <main className="flex w-full min-w-0 flex-1 flex-col px-5 pb-10 wide:px-8">{children}</main>
    </div>
  );
}
