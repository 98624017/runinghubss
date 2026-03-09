import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AcrylicCard } from '../../components/AcrylicCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import {
  fetchAdminMe,
  fetchAdminSiteConfig,
  listAdminMultipliers,
  updateAdminMultiplier,
} from '../../features/admin/adminApi';
import type { AdminMultiplierRecord } from '../../types';

function formatValue(value: string | null) {
  return value && value.trim() ? value : '--';
}

export function AdminMultipliersPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminMultiplierRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [defaultDisplayMultiplier, setDefaultDisplayMultiplier] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void fetchAdminMe()
      .then(() =>
        Promise.all([fetchAdminSiteConfig(), listAdminMultipliers()] as const),
      )
      .then(([siteConfig, records]) => {
        if (!active) {
          return;
        }

        setDefaultDisplayMultiplier(siteConfig.defaultDisplayMultiplier);
        setItems(records);
        setDrafts(
          Object.fromEntries(
            records.map((record) => [record.id, record.displayMultiplier === null ? '' : String(record.displayMultiplier)]),
          ),
        );
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        const message = error instanceof Error ? error.message : '加载倍率配置失败';
        if (message.includes('未登录') || message.includes('登录已失效')) {
          navigate('/admin/login', { replace: true });
          return;
        }
        setErrorMessage(message);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleSave(record: AdminMultiplierRecord) {
    const rawValue = drafts[record.id] ?? '';
    const nextMultiplier = Number(rawValue);
    if (!Number.isFinite(nextMultiplier) || nextMultiplier <= 0) {
      setErrorMessage('倍率必须大于 0');
      return;
    }

    setSavingId(record.id);
    setErrorMessage(null);
    try {
      const updatedRecord = await updateAdminMultiplier(record.id, nextMultiplier);
      setItems((currentItems) =>
        currentItems.map((item) => (item.id === record.id ? updatedRecord : item)),
      );
      setDrafts((currentDrafts) => ({
        ...currentDrafts,
        [record.id]:
          updatedRecord.displayMultiplier === null ? '' : String(updatedRecord.displayMultiplier),
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '保存倍率失败');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="hero-kicker">Admin</p>
        <h1>倍率管理</h1>
        <p className="lead-text">整体展示倍率继续在站点内容页维护，这里仅管理单独 API Key 覆盖倍率。</p>
      </header>

      <AcrylicCard eyebrow="Guide" title="配置说明">
        <div className="form-stack">
          <p className="muted-text">
            {defaultDisplayMultiplier === null
              ? '整体展示倍率请前往站点内容页配置。'
              : `默认展示倍率 ×${defaultDisplayMultiplier}`}
          </p>
          <Link to="/admin/site" className="button-link button-link-secondary">
            前往站点内容
          </Link>
        </div>
      </AcrylicCard>

      <AcrylicCard eyebrow="Overrides" title="单独 API Key 倍率">
        {loading ? <p className="lead-text">正在加载倍率列表...</p> : null}
        {errorMessage ? <p className="field-note">{errorMessage}</p> : null}
        {!loading && items.length === 0 ? (
          <p className="muted-text">暂无可维护的 API Key 归档记录。</p>
        ) : null}

        <div className="form-stack">
          {items.map((record) => (
            <section key={record.id} className="acrylic-card">
              <div className="details-grid">
                <div className="form-stack">
                  <p className="lead-text">{record.apiKeyMasked}</p>
                  <p className="field-note">API Key Hash：{record.apiKeyHash}</p>
                  <p className="field-note">最近状态：{record.status || '--'}</p>
                  <p className="field-note">最近余额：{formatValue(record.lastCheckedBalance)}</p>
                </div>
                <div className="form-stack">
                  <p className="field-note">
                    最近展示额度：{formatValue(record.lastCheckedDisplayBalance)}
                  </p>
                  <p className="field-note">最近检查时间：{formatValue(record.lastCheckedAt)}</p>
                  <label className="field-stack" htmlFor={`admin-multiplier-${record.id}`}>
                    <span>单独倍率</span>
                    <input
                      id={`admin-multiplier-${record.id}`}
                      aria-label={`单独倍率-${record.apiKeyMasked}`}
                      className="fluent-input"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={drafts[record.id] ?? ''}
                      onChange={(event) =>
                        setDrafts((currentDrafts) => ({
                          ...currentDrafts,
                          [record.id]: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              </div>
              <div className="button-row">
                <PrimaryButton
                  type="button"
                  onClick={() => void handleSave(record)}
                  disabled={savingId === record.id}
                  aria-label={`保存倍率-${record.apiKeyMasked}`}
                >
                  {savingId === record.id ? '保存中...' : '保存倍率'}
                </PrimaryButton>
              </div>
            </section>
          ))}
        </div>
      </AcrylicCard>
    </div>
  );
}
