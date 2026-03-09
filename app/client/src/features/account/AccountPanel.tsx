import type { ChangeEvent } from 'react';

import { AcrylicCard } from '../../components/AcrylicCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { StatusBadge } from '../../components/StatusBadge';
import type { AccountCheckResponse } from '../../types';

type AccountPanelProps = {
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  onCheck: () => void;
  isChecking: boolean;
  account: AccountCheckResponse | null;
  errorMessage: string | null;
};

export function AccountPanel({
  apiKey,
  onApiKeyChange,
  onCheck,
  isChecking,
  account,
  errorMessage,
}: AccountPanelProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onApiKeyChange(event.target.value);
  };

  return (
    <AcrylicCard
      eyebrow="Connection"
      title="服务密钥连接"
      actions={
        account?.state === 'ready' ? (
          <StatusBadge tone="success" label="连接可用" />
        ) : (
          <StatusBadge tone="neutral" label="等待校验" />
        )
      }
    >
      <div className="account-panel">
        <label className="field-stack" htmlFor="api-key-input">
          <span>服务密钥</span>
          <input
            id="api-key-input"
            className="fluent-input"
            type="password"
            value={apiKey}
            placeholder="请输入你自己的服务密钥"
            onChange={handleChange}
          />
        </label>
        <p className="field-note">仅本次调用使用，不保存，不在页面中回显完整密钥。</p>
        <div className="button-row">
          <PrimaryButton type="button" onClick={onCheck} disabled={!apiKey || isChecking}>
            {isChecking ? '正在校验额度...' : '校验额度'}
          </PrimaryButton>
        </div>
        {account?.account ? (
          <div className="account-metrics">
            <div>
              <span>原始余额</span>
              <strong>{account.account.remainCoins}</strong>
            </div>
            <div>
              <span>当前任务数</span>
              <strong>{account.account.currentTaskCounts}</strong>
            </div>
            <div>
              <span>服务类型</span>
              <strong>{account.account.apiType ?? '未知'}</strong>
            </div>
          </div>
        ) : null}
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      </div>
    </AcrylicCard>
  );
}
