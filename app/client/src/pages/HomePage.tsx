import { AcrylicCard } from '../components/AcrylicCard';
import { AppLaunchGrid } from '../features/dashboard/AppLaunchGrid';
import { CustomerBriefSection } from '../features/dashboard/CustomerBriefSection';
import { DashboardHero } from '../features/dashboard/DashboardHero';
import { RecentTaskPanel } from '../features/dashboard/RecentTaskPanel';
import { usePublicAppContext } from '../router';

export function HomePage() {
  const { site, apps, apiKey, account } = usePublicAppContext();

  return (
    <div className="page-stack dashboard-page">
      <DashboardHero site={site} apps={apps} apiKey={apiKey} account={account} />
      <CustomerBriefSection site={site} />

      <div className="dashboard-layout">
        <div className="dashboard-main-column">
          <AppLaunchGrid apps={apps} />
        </div>

        <div className="dashboard-side-column">
          <RecentTaskPanel apiKey={apiKey} />

          <AcrylicCard eyebrow="Delivery Notice" title="交付提醒">
            <ul className="meta-list">
              <li>{site.resultLinkNotice}</li>
              <li>建议生成完成后立即下载到本地或同步到你的项目资料夹。</li>
              <li>公开前台仅展示白牌文案，不在用户界面暴露真实上游品牌。</li>
            </ul>
          </AcrylicCard>
        </div>
      </div>
    </div>
  );
}
