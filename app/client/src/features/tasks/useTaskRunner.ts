import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  DynamicFormValues,
  ExecuteResponse,
  SupportedAppId,
  TaskResultResponse,
  TaskStatusResponse,
} from '../../types';
import { executeApp, fetchTaskResult, fetchTaskStatus } from './taskApi';

type RunnerPhase = 'idle' | 'submitting' | 'running' | 'succeeded' | 'failed';

type StartPayload = {
  apiKey: string;
  formValues: DynamicFormValues;
};

export function useTaskRunner(selectedAppId: SupportedAppId) {
  const [phase, setPhase] = useState<RunnerPhase>('idle');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [statusPayload, setStatusPayload] = useState<TaskStatusResponse | null>(null);
  const [resultPayload, setResultPayload] = useState<TaskResultResponse | null>(null);
  const [executePayload, setExecutePayload] = useState<ExecuteResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const latestApiKeyRef = useRef<string>('');

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const poll = useCallback(
    async (currentTaskId: string) => {
      try {
        const status = await fetchTaskStatus(currentTaskId, latestApiKeyRef.current);
        setStatusPayload(status);

        if (status.state === 'FAILED') {
          setPhase('failed');
          setErrorMessage(status.message ?? '任务执行失败');
          stopPolling();
          return;
        }

        if (status.state === 'SUCCESS') {
          const result = await fetchTaskResult(currentTaskId, latestApiKeyRef.current);
          setResultPayload(result);
          if (result.state === 'SUCCESS') {
            setPhase('succeeded');
            stopPolling();
            return;
          }
        }

        pollTimerRef.current = window.setTimeout(() => {
          void poll(currentTaskId);
        }, 3500);
      } catch (error) {
        setPhase('failed');
        setErrorMessage(error instanceof Error ? error.message : '任务轮询失败');
        stopPolling();
      }
    },
    [stopPolling],
  );

  const run = useCallback(
    async (payload: StartPayload) => {
      stopPolling();
      setPhase('submitting');
      setTaskId(null);
      setStatusPayload(null);
      setResultPayload(null);
      setExecutePayload(null);
      setErrorMessage(null);
      latestApiKeyRef.current = payload.apiKey;

      try {
        const executeResult = await executeApp(selectedAppId, payload);
        setExecutePayload(executeResult);
        setTaskId(executeResult.taskId);
        setPhase('running');
        void poll(executeResult.taskId);
      } catch (error) {
        setPhase('failed');
        setErrorMessage(error instanceof Error ? error.message : '提交任务失败');
      }
    },
    [poll, selectedAppId, stopPolling],
  );

  useEffect(() => {
    stopPolling();
    setPhase('idle');
    setTaskId(null);
    setStatusPayload(null);
    setResultPayload(null);
    setExecutePayload(null);
    setErrorMessage(null);
  }, [selectedAppId, stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  const debugPayload = useMemo(
    () => ({
      execute: executePayload,
      status: statusPayload,
      result: resultPayload,
    }),
    [executePayload, resultPayload, statusPayload],
  );

  return {
    phase,
    isBusy: phase === 'submitting' || phase === 'running',
    taskId,
    statusPayload,
    resultPayload,
    executePayload,
    errorMessage,
    debugPayload,
    run,
  };
}
