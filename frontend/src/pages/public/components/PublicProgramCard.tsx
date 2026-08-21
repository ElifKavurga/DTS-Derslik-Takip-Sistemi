import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export const PublicProgramCard = ({
  children,
  className,
  contentClassName,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) => (
  <div className={cn('group relative rounded-[24px] p-[1.5px] shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md', className)}>
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-r from-[#006482] via-[#00a896] to-[#fabc07] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
    />
    <div
      className={cn(
        'relative overflow-hidden rounded-[23px] border border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] transition-colors duration-300 group-hover:border-transparent',
        contentClassName,
      )}
    >
      {children}
    </div>
  </div>
);
