import type { AppDefinition, SupportedAppId } from '../types';

type SidebarNavProps = {
  apps: AppDefinition[];
  selectedAppId: SupportedAppId;
  onSelect: (appId: SupportedAppId) => void;
};

export function SidebarNav({ apps, selectedAppId, onSelect }: SidebarNavProps) {
  return (
    <nav aria-label="应用导航" className="sidebar-nav">
      {apps.map((app) => {
        const selected = app.id === selectedAppId;
        return (
          <button
            key={app.id}
            className={`nav-item ${selected ? 'is-selected' : ''}`}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(app.id)}
          >
            <span className="nav-item-title">{app.shortTitle}</span>
            <span className="nav-item-desc">{app.description}</span>
          </button>
        );
      })}
    </nav>
  );
}
