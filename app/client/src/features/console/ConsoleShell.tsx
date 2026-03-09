import type { PropsWithChildren } from 'react';

import type { AccountCheckResponse, AppDefinition, SiteConfig } from '../../types';
import { ConsoleSidebar } from './ConsoleSidebar';
import { ConsoleTopbar } from './ConsoleTopbar';

type ConsoleShellProps = PropsWithChildren<{
  site: SiteConfig;
  apps: AppDefinition[];
  apiKey: string;
  account: AccountCheckResponse | null;
}>;

export function ConsoleShell({ site, apps, apiKey, account, children }: ConsoleShellProps) {
  return (
    <div className="console-shell" data-testid="public-layout">
      <ConsoleSidebar site={site} apps={apps} apiKey={apiKey} />
      <div className="console-main">
        <ConsoleTopbar site={site} apiKey={apiKey} account={account} />
        <main className="console-content">{children}</main>
      </div>
    </div>
  );
}
