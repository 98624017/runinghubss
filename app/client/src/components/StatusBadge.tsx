type StatusBadgeProps = {
  tone: 'neutral' | 'info' | 'success' | 'error' | 'warning';
  label: string;
};

export function StatusBadge({ tone, label }: StatusBadgeProps) {
  return (
    <span className={`status-badge tone-${tone}`} role="status" aria-live="polite">
      {label}
    </span>
  );
}
