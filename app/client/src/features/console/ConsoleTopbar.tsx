import { useLocation } from 'react-router-dom';

import { StatusBadge } from '../../components/StatusBadge';
import type { AccountCheckResponse, SiteConfig } from '../../types';

type ConsoleTopbarProps = {
  site: SiteConfig;
  apiKey: string;
  account: AccountCheckResponse | null;
};

function resolveTopbarMeta(pathname: string) {
  if (pathname.startsWith('/workspace/')) {
    return {
      kicker: 'Workspace',
      title: '统一工作台',
      description: '在一个界面里完成素材配置、提交任务与结果回看。',
    };
  }

  if (pathname.startsWith('/tasks') || pathname.startsWith('/history')) {
    return {
      kicker: 'Task Archive',
      title: '任务记录',
      description: '按应用与状态筛选任务，快速定位已完成结果。',
    };
  }

  if (pathname.startsWith('/assets')) {
    return {
      kicker: 'Asset Hub',
      title: '我的资产',
      description: '统一浏览最近生成成果，便于下载、预览与转交客户。',
    };
  }

  if (pathname.startsWith('/key-center')) {
    return {
      kicker: 'Key Center',
      title: '密钥管理',
      description: '本地管理服务密钥与服务校验反馈，不在前台暴露上游品牌。',
    };
  }

  if (pathname.startsWith('/apps')) {
    return {
      kicker: 'App Matrix',
      title: '应用矩阵',
      description: '查看公开应用能力，并进入对应工作台。',
    };
  }

  return {
    kicker: 'Dashboard',
    title: '控制台总览',
    description: '围绕设计工作室的真实流程组织应用、任务、资产与交付。',
  };
}

export function ConsoleTopbar({ site, apiKey }: ConsoleTopbarProps) {
  const location = useLocation();
  const meta = resolveTopbarMeta(location.pathname);

  return (
    <header className="console-topbar">
      <div className="console-topbar-copy">
        <p className="console-topbar-kicker">{meta.kicker}</p>
        <h1>{meta.title}</h1>
        <p>{meta.description}</p>
      </div>

      <div className="console-topbar-actions">
        <div className="console-topbar-pills">
          <span className="console-info-pill">品牌：{site.brandName}</span>
        </div>

        <div className="console-topbar-status">
          <StatusBadge
            tone={apiKey.trim() ? 'success' : 'warning'}
            label={apiKey.trim() ? '密钥已就绪' : '等待配置密钥'}
          />
        </div>
      </div>
    </header>
  );
}
