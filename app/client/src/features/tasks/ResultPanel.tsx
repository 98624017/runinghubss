import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { AcrylicCard } from '../../components/AcrylicCard';
import type { TaskResultResponse } from '../../types';

type ResultPanelProps = {
  result: TaskResultResponse | null;
  emptyLabel?: string;
  notice?: string;
  historyHref?: string;
  rerunHref?: string;
};

export function ResultPanel({
  result,
  emptyLabel = '运行完成后，这里会展示输出图像与消耗信息。',
  notice,
  historyHref,
  rerunHref,
}: ResultPanelProps) {
  const outputs = result?.outputs ?? [];
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  async function handleCopy(fileUrl: string) {
    setCopiedUrl(fileUrl);
    try {
      await navigator.clipboard.writeText(fileUrl);
    } catch {}
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setCopiedUrl((currentValue) => (currentValue === fileUrl ? null : currentValue));
    }, 1800);
  }

  return (
    <AcrylicCard eyebrow="Output" title="结果预览" className="result-panel-card">
      {outputs.length > 0 ? (
        <div className="result-grid">
          {outputs.map((item) => (
            <article key={item.fileUrl} className="result-card">
              <img src={item.fileUrl} alt="AI 输出结果" />
              <div className="result-meta">
                <span>耗时：{item.taskCostTime ?? '--'}</span>
                <span>消耗点数：{item.consumeCoins ?? '--'}</span>
                <div className="result-actions">
                  <a href={item.fileUrl} download className="result-action-link">
                    下载结果
                  </a>
                  <button
                    type="button"
                    className="result-action-button"
                    onClick={() => void handleCopy(item.fileUrl)}
                  >
                    {copiedUrl === item.fileUrl ? '已复制' : '复制链接'}
                  </button>
                  {historyHref ? (
                    <Link to={historyHref} className="result-action-link">
                      任务记录
                    </Link>
                  ) : null}
                  {rerunHref ? (
                    <Link to={rerunHref} className="result-action-link">
                      再次生成
                    </Link>
                  ) : null}
                </div>
                <a href={item.fileUrl} target="_blank" rel="noreferrer">
                  打开原图
                </a>
                {notice ? <p className="field-note">{notice}</p> : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="form-stack">
          <p className="muted-text">{emptyLabel}</p>
          {notice ? <p className="field-note">{notice}</p> : null}
        </div>
      )}
    </AcrylicCard>
  );
}
