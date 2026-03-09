import { Link } from 'react-router-dom';

import type { AccountCheckResponse, AppDefinition, SiteConfig } from '../../types';

type DashboardHeroProps = {
  site: SiteConfig;
  apps: AppDefinition[];
  apiKey: string;
  account: AccountCheckResponse | null;
};

export function DashboardHero({ site, apps, apiKey, account }: DashboardHeroProps) {
  const hasCheckedService = Boolean(account?.serviceKey || account?.balance?.checkedAt);

  return (
    <section className="dashboard-hero">
      <div className="dashboard-hero-copy">
        <p className="hero-kicker">Design Ops Console</p>
        <h2>{site.heroTitle}</h2>
        <p className="lead-text">{site.heroSubtitle}</p>
        <div className="button-row">
          <Link to="/workspace/color-plan" className="button-link button-link-primary">
            进入默认工作台
          </Link>
          <Link to="/tasks" className="button-link button-link-secondary">
            查看任务记录
          </Link>
        </div>
      </div>

      <div className="dashboard-metrics">
        <article className="dashboard-metric-card">
          <span>公开应用</span>
          <strong>{apps.length}</strong>
        </article>
        <article className="dashboard-metric-card">
          <span>密钥状态</span>
          <strong>{apiKey.trim() ? '已配置' : '待配置'}</strong>
        </article>
        <article className="dashboard-metric-card">
          <span>默认工作台</span>
          <strong>一键彩平</strong>
        </article>
        <article className="dashboard-metric-card">
          <span>服务校验</span>
          <strong>{hasCheckedService ? '已完成' : '暂未校验'}</strong>
        </article>
      </div>
    </section>
  );
}
