import { AcrylicCard } from '../components/AcrylicCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusBadge } from '../components/StatusBadge';
import { usePublicAppContext } from '../router';

function formatCheckedAt(checkedAt?: string) {
  if (!checkedAt) {
    return '--';
  }

  const value = new Date(checkedAt);
  if (Number.isNaN(value.getTime())) {
    return '--';
  }

  return value.toLocaleString('zh-CN', { hour12: false });
}

export function KeyCenterPage() {
  const {
    apiKey,
    account,
    accountError,
    isCheckingAccount,
    onApiKeyChange,
    onCheckAccount,
    onClearApiKey,
  } = usePublicAppContext();

  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="hero-kicker">Key Center</p>
        <h2>本地密钥配置</h2>
        <p className="lead-text">浏览器本地保存你的服务密钥，仅按需调用，不在前台长期托管明文。</p>
      </header>

      <section className="split-panel">
        <AcrylicCard
          eyebrow="Service Key"
          title="服务密钥"
          actions={
            <StatusBadge
              tone={apiKey ? 'success' : 'warning'}
              label={apiKey ? '已保存到浏览器' : '尚未保存'}
            />
          }
        >
          <label className="field-stack" htmlFor="service-key-input">
            <span>服务密钥</span>
            <input
              id="service-key-input"
              className="fluent-input"
              type="password"
              value={apiKey}
              placeholder="请输入你自己的服务密钥"
              onChange={(event) => onApiKeyChange(event.target.value)}
            />
          </label>
          <p className="field-note">仅保存在当前浏览器本地，用于提交任务和查看任务记录，不在前台长期托管明文。</p>
          <div className="button-row">
            <PrimaryButton
              type="button"
              onClick={() => void onCheckAccount()}
              disabled={!apiKey.trim() || isCheckingAccount}
            >
              {isCheckingAccount ? '校验中...' : '校验额度'}
            </PrimaryButton>
            <PrimaryButton type="button" variant="ghost" onClick={onClearApiKey}>
              清空
            </PrimaryButton>
          </div>
          {accountError ? <p className="error-text">{accountError}</p> : null}
        </AcrylicCard>

        <AcrylicCard eyebrow="Status" title="校验反馈">
          {account?.balance ? (
            <div className="metric-grid">
              <div className="metric-card">
                <span>校验状态</span>
                <strong>额度与倍率展示已暂时隐藏</strong>
              </div>
              <div className="metric-card">
                <span>最近检测</span>
                <strong>{formatCheckedAt(account.balance.checkedAt)}</strong>
              </div>
              <div className="metric-card">
                <span>服务标识</span>
                <strong>{account.serviceKey ?? '--'}</strong>
              </div>
            </div>
          ) : (
            <p className="muted-text">完成一次校验后，这里会展示服务校验反馈与最近检测时间。</p>
          )}
        </AcrylicCard>
      </section>
    </div>
  );
}
