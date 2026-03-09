import { AppLaunchGrid } from '../features/dashboard/AppLaunchGrid';
import { usePublicAppContext } from '../router';

export function AppsPage() {
  const { apps } = usePublicAppContext();

  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="hero-kicker">App Matrix</p>
        <h2>应用矩阵</h2>
        <p className="lead-text">这里保留全部公开应用入口，适合作为内部演示或客户讲解时的能力面板。</p>
      </header>

      <AppLaunchGrid apps={apps} title="全部公开应用" eyebrow="Capabilities" />
    </div>
  );
}
