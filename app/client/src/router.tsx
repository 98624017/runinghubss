import {
  BrowserRouter,
  MemoryRouter,
  Navigate,
  Route,
  Routes,
  useOutletContext,
} from 'react-router-dom';

import { AdminLayout } from './layouts/AdminLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { AssetsPage } from './pages/AssetsPage';
import { AppsPage } from './pages/AppsPage';
import { HomePage } from './pages/HomePage';
import { HistoryPage } from './pages/HistoryPage';
import { KeyCenterPage } from './pages/KeyCenterPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { AdminAppsPage } from './pages/admin/AdminAppsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminMultipliersPage } from './pages/admin/AdminMultipliersPage';
import { AdminSecurityPage } from './pages/admin/AdminSecurityPage';
import { AdminSitePage } from './pages/admin/AdminSitePage';
import { AdminTasksPage } from './pages/admin/AdminTasksPage';
import type { AccountCheckResponse, AppDefinition, SiteConfig } from './types';

export type PublicAppState = {
  site: SiteConfig;
  apps: AppDefinition[];
  apiKey: string;
  account: AccountCheckResponse | null;
  accountError: string | null;
  isCheckingAccount: boolean;
};

export type PublicAppActions = {
  onApiKeyChange: (value: string) => void;
  onCheckAccount: () => Promise<void>;
  onClearApiKey: () => void;
};

export type PublicLayoutContextValue = PublicAppState & PublicAppActions;

export type AppRoutesProps = {
  publicState: PublicAppState;
  publicActions: PublicAppActions;
};

type PublicRouteShellProps = AppRoutesProps;

function PublicRouteShell({ publicState, publicActions }: PublicRouteShellProps) {
  const context: PublicLayoutContextValue = {
    ...publicState,
    ...publicActions,
  };

  return <PublicLayout context={context} site={publicState.site} />;
}

export function usePublicAppContext() {
  return useOutletContext<PublicLayoutContextValue>();
}

export function AppRoutes({ publicState, publicActions }: AppRoutesProps) {
  return (
    <Routes>
      <Route
        path="/"
        element={<PublicRouteShell publicState={publicState} publicActions={publicActions} />}
      >
        <Route index element={<HomePage />} />
        <Route path="apps" element={<AppsPage />} />
        <Route path="tasks" element={<HistoryPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="key-center" element={<KeyCenterPage />} />
        <Route path="workspace/:slug" element={<WorkspacePage />} />
        <Route path="history" element={<Navigate to="/tasks" replace />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="login" element={<AdminLoginPage />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="site" element={<AdminSitePage />} />
        <Route path="multipliers" element={<AdminMultipliersPage />} />
        <Route path="security" element={<AdminSecurityPage />} />
        <Route path="apps" element={<AdminAppsPage />} />
        <Route path="tasks" element={<AdminTasksPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function AppRouter(props: AppRoutesProps) {
  return (
    <BrowserRouter>
      <AppRoutes {...props} />
    </BrowserRouter>
  );
}

export function TestAppRouter(props: AppRoutesProps & { initialPath?: string }) {
  return (
    <MemoryRouter initialEntries={[props.initialPath ?? '/']}>
      <AppRoutes publicState={props.publicState} publicActions={props.publicActions} />
    </MemoryRouter>
  );
}
