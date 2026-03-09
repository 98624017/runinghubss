import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type PrimaryButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost';
  }
>;

export function PrimaryButton({
  variant = 'primary',
  className,
  children,
  ...rest
}: PrimaryButtonProps) {
  return (
    <button
      className={`fluent-button fluent-button-${variant} ${className ?? ''}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
