import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AcrylicCard } from '../../components/AcrylicCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { fetchAdminMe, loginAdmin } from '../../features/admin/adminApi';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void fetchAdminMe()
      .then(() => {
        if (active) {
          navigate('/admin/apps', { replace: true });
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleLogin() {
    setLoading(true);
    setErrorMessage(null);
    try {
      await loginAdmin({ username, password });
      navigate('/admin/apps', { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="hero-kicker">Admin</p>
        <h1>后台登录</h1>
        <p className="lead-text">使用管理员账号密码进入后台，登录后可管理应用、Schema 与任务检索。</p>
      </header>

      <AcrylicCard eyebrow="Authentication" title="管理员身份验证" className="admin-auth-card">
        <label className="field-stack" htmlFor="admin-username">
          <span>用户名</span>
          <input
            id="admin-username"
            className="fluent-input"
            type="text"
            placeholder="admin"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label className="field-stack" htmlFor="admin-password">
          <span>密码</span>
          <input
            id="admin-password"
            className="fluent-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {errorMessage ? <p className="field-note">{errorMessage}</p> : null}
        <PrimaryButton type="button" onClick={() => void handleLogin()} disabled={loading}>
          {loading ? '登录中...' : '登录后台'}
        </PrimaryButton>
      </AcrylicCard>
    </div>
  );
}
