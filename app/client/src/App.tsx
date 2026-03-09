import { useEffect, useState } from 'react';

import { checkAccount } from './features/account/accountApi';
import { clearStoredApiKey, loadStoredApiKey, saveStoredApiKey } from './features/account/keyStorage';
import { APPS } from './features/apps/appsConfig';
import { DEFAULT_SITE_CONFIG, loadSiteBootstrap } from './features/site/siteApi';
import { AppRouter } from './router';
import type { AccountCheckResponse, AppDefinition, SiteConfig } from './types';

export default function App() {
  const [site, setSite] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [apps, setApps] = useState<AppDefinition[]>(APPS);
  const [apiKey, setApiKey] = useState(() => loadStoredApiKey());
  const [account, setAccount] = useState<AccountCheckResponse | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function bootstrapSite() {
      try {
        const payload = await loadSiteBootstrap();
        if (!ignore) {
          setSite(payload.site);
          setApps(payload.apps.length > 0 ? payload.apps : APPS);
        }
      } catch {
        if (!ignore) {
          setSite(DEFAULT_SITE_CONFIG);
          setApps(APPS);
        }
      }
    }

    void bootstrapSite();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (apiKey.trim()) {
      saveStoredApiKey(apiKey);
      return;
    }

    clearStoredApiKey();
  }, [apiKey]);

  function handleApiKeyChange(value: string) {
    setApiKey(value);
    if (!value.trim()) {
      setAccount(null);
      setAccountError(null);
    }
  }

  function handleClearApiKey() {
    setApiKey('');
    setAccount(null);
    setAccountError(null);
    clearStoredApiKey();
  }

  async function handleCheckAccount() {
    const normalizedKey = apiKey.trim();
    if (!normalizedKey) {
      setAccount(null);
      setAccountError('请先填写服务密钥');
      return;
    }

    setIsCheckingAccount(true);
    setAccountError(null);

    try {
      const response = await checkAccount(normalizedKey);
      setAccount(response);
    } catch (error) {
      setAccount(null);
      setAccountError(error instanceof Error ? error.message : '服务校验失败');
    } finally {
      setIsCheckingAccount(false);
    }
  }

  return (
    <AppRouter
      publicState={{
        site,
        apps,
        apiKey,
        account,
        accountError,
        isCheckingAccount,
      }}
      publicActions={{
        onApiKeyChange: handleApiKeyChange,
        onCheckAccount: handleCheckAccount,
        onClearApiKey: handleClearApiKey,
      }}
    />
  );
}
