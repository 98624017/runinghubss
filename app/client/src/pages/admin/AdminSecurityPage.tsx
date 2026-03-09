import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AcrylicCard } from '../../components/AcrylicCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { changeAdminPassword, fetchAdminMe } from '../../features/admin/adminApi';

export function AdminSecurityPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void fetchAdminMe()
      .then((admin) => {
        if (!active) {
          return;
        }
        setUsername(admin.username || 'admin');
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        const message = error instanceof Error ? error.message : '加载管理员信息失败';
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

  async function handleSubmit() {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('请完整填写当前密码、新密码和确认密码');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('两次输入的新密码不一致');
      return;
    }

    setSaving(true);

    try {
      await changeAdminPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('管理员密码已更新');
    } catch (error) {
      const message = error instanceof Error ? error.message : '修改密码失败';
      if (message.includes('未登录') || message.includes('登录已失效')) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="hero-kicker">Admin</p>
        <h1>账号安全</h1>
        <p className="lead-text">当前管理员：{username}。支持登录后修改密码，也支持离线脚本重置管理员密码。</p>
      </header>

      {loading ? <p className="lead-text">正在加载管理员信息...</p> : null}
      {errorMessage ? <p className="lead-text">{errorMessage}</p> : null}

      {!loading ? (
        <>
          <AcrylicCard eyebrow="Security" title="修改管理员密码">
            <div className="admin-form-grid">
              <label className="field-stack" htmlFor="admin-security-currentPassword">
                <span>当前密码</span>
                <input
                  id="admin-security-currentPassword"
                  aria-label="当前密码"
                  className="fluent-input"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </label>
              <label className="field-stack" htmlFor="admin-security-newPassword">
                <span>新密码</span>
                <input
                  id="admin-security-newPassword"
                  aria-label="新密码"
                  className="fluent-input"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </label>
              <label className="field-stack admin-form-grid-full" htmlFor="admin-security-confirmPassword">
                <span>确认新密码</span>
                <input
                  id="admin-security-confirmPassword"
                  aria-label="确认新密码"
                  className="fluent-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </label>
            </div>

            <div className="button-row">
              <PrimaryButton type="button" onClick={() => void handleSubmit()} disabled={saving}>
                {saving ? '更新中...' : '更新管理员密码'}
              </PrimaryButton>
              {successMessage ? <p className="field-note">{successMessage}</p> : null}
            </div>
          </AcrylicCard>

          <AcrylicCard eyebrow="Recovery" title="离线重置命令">
            <p className="lead-text">
              如果已经无法登录后台，可在项目目录执行下面的重置命令。
            </p>
            <code className="inline-code-block">
              cd app && npm run admin:reset-password --workspace server -- --username admin --password 你的新密码
            </code>
          </AcrylicCard>
        </>
      ) : null}
    </div>
  );
}
