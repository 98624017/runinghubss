import { Link } from 'react-router-dom';

import { AcrylicCard } from '../../components/AcrylicCard';
import type { AppDefinition } from '../../types';

type AppLaunchGridProps = {
  apps: AppDefinition[];
  title?: string;
  eyebrow?: string;
};

export function AppLaunchGrid({
  apps,
  title = '应用矩阵',
  eyebrow = 'Launchpad',
}: AppLaunchGridProps) {
  return (
    <section className="page-section">
      <div className="page-section-header">
        <p className="hero-kicker">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="lead-text">按设计前期沟通、方案表达和效果图生成的顺序组织公开应用。</p>
      </div>

      <div className="dashboard-app-grid">
        {apps.map((app) => (
          <AcrylicCard key={app.slug} eyebrow="AI App" title={app.title} className="dashboard-app-card">
            <p className="lead-text">{app.description}</p>
            <div className="chip-row">
              {app.chips.map((chip) => (
                <span key={chip} className="glass-chip">
                  {chip}
                </span>
              ))}
            </div>
            <ul className="meta-list">
              {app.notes.slice(0, 2).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <div className="dashboard-card-footer">
              <span className="muted-text">{`默认入口：${app.shortTitle}`}</span>
              <Link to={`/workspace/${app.slug}`} className="inline-link">
                进入工作台
              </Link>
            </div>
          </AcrylicCard>
        ))}
      </div>
    </section>
  );
}
