import { NavLink } from 'react-router-dom';

import { AcrylicCard } from '../../components/AcrylicCard';
import type { AppDefinition } from '../../types';

type WorkspaceAppSwitcherProps = {
  apps: AppDefinition[];
};

export function WorkspaceAppSwitcher({ apps }: WorkspaceAppSwitcherProps) {
  return (
    <AcrylicCard eyebrow="App Switcher" title="应用切换">
      <div className="workspace-switcher-list">
        {apps.map((app) => (
          <NavLink
            key={app.slug}
            to={`/workspace/${app.slug}`}
            className={({ isActive }) => `workspace-switcher-item${isActive ? ' is-active' : ''}`}
          >
            <strong>{app.shortTitle}</strong>
            <span>{app.description}</span>
          </NavLink>
        ))}
      </div>
    </AcrylicCard>
  );
}
