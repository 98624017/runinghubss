type JsonPanelProps = {
  title: string;
  payload: unknown;
  emptyLabel?: string;
};

export function JsonPanel({ title, payload, emptyLabel = '暂无数据' }: JsonPanelProps) {
  return (
    <section className="json-panel">
      <h3>{title}</h3>
      <pre>{payload ? JSON.stringify(payload, null, 2) : emptyLabel}</pre>
    </section>
  );
}
