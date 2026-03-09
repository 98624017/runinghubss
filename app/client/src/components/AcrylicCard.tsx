import type { PropsWithChildren, ReactNode } from 'react';

type AcrylicCardProps = PropsWithChildren<{
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}>;

export function AcrylicCard({
  title,
  eyebrow,
  actions,
  className,
  children,
}: AcrylicCardProps) {
  return (
    <section className={`acrylic-card ${className ?? ''}`.trim()}>
      {(title || eyebrow || actions) && (
        <header className="card-header">
          <div>
            {eyebrow ? <p className="card-eyebrow">{eyebrow}</p> : null}
            {title ? <h2>{title}</h2> : null}
          </div>
          {actions ? <div className="card-actions">{actions}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}
