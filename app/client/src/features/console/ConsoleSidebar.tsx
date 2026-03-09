import { NavLink } from 'react-router-dom';

import { StatusBadge } from '../../components/StatusBadge';
import type { AppDefinition, SiteConfig } from '../../types';

type ConsoleSidebarProps = {
  site: SiteConfig;
  apps: AppDefinition[];
  apiKey: string;
};

function getNavItemClassName(isActive: boolean) {
  return `console-nav-link${isActive ? ' is-active' : ''}`;
}

export function ConsoleSidebar({ site, apps, apiKey }: ConsoleSidebarProps) {
  const quickApps = apps.slice(0, 4);

  return (
    <aside className="console-sidebar">
      <div className="console-brand-block">
        <NavLink to="/" className="console-brand-link">
          <span className="site-brand-mark">✦</span>
          <div>
            <strong>{site.brandName}</strong>
            <p>专业工具控制台</p>
          </div>
        </NavLink>
        <p className="console-brand-note">白牌空间设计工作台，统一管理出图、任务和资产。</p>
      </div>

      <nav aria-label="主导航" className="console-nav">
        <NavLink
          to="/"
          end
          aria-label="主导航：控制台总览"
          className={({ isActive }) => getNavItemClassName(isActive)}
        >
          <span className="console-nav-title">控制台总览</span>
          <span className="console-nav-desc">查看应用矩阵、最近任务与流程建议。</span>
        </NavLink>
        <NavLink
          to="/tasks"
          aria-label="主导航：任务记录"
          className={({ isActive }) => getNavItemClassName(isActive)}
        >
          <span className="console-nav-title">任务记录</span>
          <span className="console-nav-desc">按应用、状态筛选任务并继续追踪结果。</span>
        </NavLink>
        <NavLink
          to="/assets"
          aria-label="主导航：我的资产"
          className={({ isActive }) => getNavItemClassName(isActive)}
        >
          <span className="console-nav-title">我的资产</span>
          <span className="console-nav-desc">集中查看可下载成果图，便于二次交付。</span>
        </NavLink>
        <NavLink
          to="/key-center"
          aria-label="主导航：密钥管理"
          className={({ isActive }) => getNavItemClassName(isActive)}
        >
          <span className="console-nav-title">密钥管理</span>
          <span className="console-nav-desc">管理本地密钥与服务校验状态。</span>
        </NavLink>
      </nav>

      <section className="console-sidebar-section">
        <div className="console-section-heading">
          <span>应用工作台</span>
          <small>{quickApps.length} 个公开应用</small>
        </div>
        <div className="console-quick-apps">
          {quickApps.map((app) => (
            <NavLink
              key={app.slug}
              to={`/workspace/${app.slug}`}
              className={({ isActive }) => `console-quick-app${isActive ? ' is-active' : ''}`}
            >
              <strong>{`工作台 · ${app.shortTitle}`}</strong>
              <span>{app.description}</span>
            </NavLink>
          ))}
        </div>
      </section>

      <section className="console-sidebar-section console-sidebar-footer">
        <div className="console-section-heading">
          <span>连接状态</span>
        </div>
        <div className="console-status-row">
          <StatusBadge
            tone={apiKey.trim() ? 'success' : 'warning'}
            label={apiKey.trim() ? '已配置服务密钥' : '未配置服务密钥'}
          />
        </div>
        <p className="console-brand-note">
          当前工作台默认不托管长期明文密钥，所有调用均以浏览器本地保存值为准。
        </p>
      </section>
    </aside>
  );
}
