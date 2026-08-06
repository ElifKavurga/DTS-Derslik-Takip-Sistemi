import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
}

export const SecondaryButton = ({
  children,
  icon,
  className,
  ...props
}: SecondaryButtonProps) => {
  return (
    <button
      className={cn(
        'dts-btn-secondary gap-2 select-none disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};
