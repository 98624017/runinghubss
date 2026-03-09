import { useEffect, useState } from 'react';

import { fetchHistory } from './historyApi';
import type { HistoryTaskItem } from '../../types';

type UseHistoryFeedInput = {
  apiKey: string;
  appSlug?: string;
  status?: string;
};

export function useHistoryFeed({ apiKey, appSlug = '', status = '' }: UseHistoryFeedInput) {
  const [tasks, setTasks] = useState<HistoryTaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey.trim()) {
      setTasks([]);
      setLoading(false);
      setErrorMessage(null);
      return;
    }

    let active = true;
    setLoading(true);
    setErrorMessage(null);

    void fetchHistory({
      apiKey: apiKey.trim(),
      ...(appSlug ? { appSlug } : {}),
      ...(status ? { status } : {}),
    })
      .then((nextTasks) => {
        if (!active) {
          return;
        }

        setTasks(nextTasks);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setTasks([]);
        setErrorMessage(error instanceof Error ? error.message : '读取任务记录失败');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [apiKey, appSlug, status]);

  return {
    tasks,
    loading,
    errorMessage,
  };
}
