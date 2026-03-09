import { AcrylicCard } from '../../components/AcrylicCard';
import type { AppDefinition } from '../../types';

type AppDetailsCardProps = {
  app: AppDefinition;
};

export function AppDetailsCard({ app }: AppDetailsCardProps) {
  return (
    <AcrylicCard eyebrow="Application" title={app.title}>
      <div className="details-stack">
        <p className="lead-text">{app.description}</p>
        <div className="chip-row">
          {app.chips.map((chip) => (
            <span key={chip} className="glass-chip">
              {chip}
            </span>
          ))}
        </div>
        <div className="details-grid">
          <div>
            <h3>节点摘要</h3>
            <ul>
              {app.nodeSummary.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>使用建议</h3>
            <ul>
              {app.notes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AcrylicCard>
  );
}
