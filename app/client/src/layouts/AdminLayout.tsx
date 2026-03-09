import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

function getNavClassName(isActive: boolean) {
  return `admin-nav-link${isActive ? ' is-active' : ''}`;
}

export function AdminLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/admin/login';

  return (
    <div className="admin-shell" data-testid="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="site-brand-mark">◆</span>
          <div>
            <strong>平台后台</strong>
            <small>运营与应用配置</small>
          </div>
        </div>

        {!isLoginPage ? (
          <>
            <Link to="/" className="button-link button-link-secondary admin-return-link">
              返回用户界面
            </Link>
            <nav className="admin-nav" aria-label="后台导航">
              <NavLink to="/admin/dashboard" className={({ isActive }) => getNavClassName(isActive)}>
                概览
              </NavLink>
              <NavLink to="/admin/site" className={({ isActive }) => getNavClassName(isActive)}>
                站点内容
              </NavLink>
              <NavLink to="/admin/multipliers" className={({ isActive }) => getNavClassName(isActive)}>
                倍率管理
              </NavLink>
              <NavLink to="/admin/security" className={({ isActive }) => getNavClassName(isActive)}>
                账号安全
              </NavLink>
              <NavLink to="/admin/apps" className={({ isActive }) => getNavClassName(isActive)}>
                应用管理
              </NavLink>
              <NavLink to="/admin/tasks" className={({ isActive }) => getNavClassName(isActive)}>
                任务检索
              </NavLink>
            </nav>
          </>
        ) : (
          <p className="muted-text">后台登录成功后可管理应用、schema 与超时时间。</p>
        )}
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
