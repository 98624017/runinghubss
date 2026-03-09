import type { ReactNode } from 'react';

type WorkspaceShellProps = {
  main: ReactNode;
  support: ReactNode;
};

export function WorkspaceShell({ main, support }: WorkspaceShellProps) {
  return (
    <section className="workspace-console-grid">
      <div className="workspace-console-column workspace-console-column-main">{main}</div>
      <div className="workspace-console-column workspace-console-column-support">{support}</div>
    </section>
  );
}
