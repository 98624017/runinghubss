import { Outlet } from 'react-router-dom';

import { ConsoleShell } from '../features/console/ConsoleShell';
import type { PublicLayoutContextValue } from '../router';
import type { SiteConfig } from '../types';

type PublicLayoutProps = {
  context: PublicLayoutContextValue;
  site: SiteConfig;
};

export function PublicLayout({ context, site }: PublicLayoutProps) {
  return (
    <ConsoleShell site={site} apps={context.apps} apiKey={context.apiKey} account={context.account}>
      <div className="page-shell">
        <Outlet context={context} />
      </div>
    </ConsoleShell>
  );
}
