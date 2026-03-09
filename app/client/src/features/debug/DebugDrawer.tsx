import { useState } from 'react';

import { JsonPanel } from '../../components/JsonPanel';

type DebugDrawerProps = {
  accountDebug: unknown;
  executeDebug: unknown;
  statusDebug: unknown;
  resultDebug: unknown;
  developerNotes?: string[];
};

const SENSITIVE_KEY_PATTERN = /(api[-_ ]?key|authorization|x-runninghub-api-key)/i;
const API_KEY_VALUE_PATTERN = /\b[a-f0-9]{32}\b/gi;

function maskString(value: string) {
  return value.replace(API_KEY_VALUE_PATTERN, (match) => `${match.slice(0, 4)}••••${match.slice(-4)}`);
}

function sanitizePayload(payload: unknown, parentKey = ''): unknown {
  if (payload === null || payload === undefined) {
    return payload;
  }

  if (typeof payload === 'string') {
    return SENSITIVE_KEY_PATTERN.test(parentKey) ? '<MASKED>' : maskString(payload);
  }

  if (typeof payload !== 'object') {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item, parentKey));
  }

  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        return [key, '<MASKED>'];
      }
      return [key, sanitizePayload(value, key)];
    }),
  );
}

export function DebugDrawer({
  accountDebug,
  executeDebug,
  statusDebug,
  resultDebug,
  developerNotes = [],
}: DebugDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className={`debug-drawer ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="debug-toggle"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? '收起开发调试信息' : '展开开发调试信息'}
      </button>
      {open ? (
        <div className="debug-grid">
          <JsonPanel title="账户检查" payload={sanitizePayload(accountDebug)} />
          <JsonPanel title="任务提交" payload={sanitizePayload(executeDebug)} />
          <JsonPanel title="任务状态轮询" payload={sanitizePayload(statusDebug)} />
          <JsonPanel title="任务结果" payload={sanitizePayload(resultDebug)} />
          <section className="json-panel debug-notes">
            <h3>开发备注</h3>
            <ul>
              {developerNotes.length > 0 ? (
                developerNotes.map((note) => <li key={note}>{note}</li>)
              ) : (
                <li>暂无额外备注</li>
              )}
            </ul>
          </section>
        </div>
      ) : null}
    </section>
  );
}
