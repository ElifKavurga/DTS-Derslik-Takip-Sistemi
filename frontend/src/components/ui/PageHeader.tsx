import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  badge?: ReactNode;
  backAction?: ReactNode;
}

export const PageHeader = ({ title, description, action, badge, backAction }: PageHeaderProps) => {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] p-3 sm:p-3.5 shadow-xs">
      {/* Top Turquoise -> Yellow gradient line */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#007d9e] via-[#00acc1] to-[#fabc07]" />
      
      {backAction && <div className="mb-2.5">{backAction}</div>}
      
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base font-extrabold uppercase tracking-wider text-slate-700 truncate">{title}</h1>
            {badge}
          </div>
          {description && <p className="mt-1 text-xs font-medium text-slate-500">{description}</p>}
        </div>
        {action && <div className="shrink-0 flex items-center">{action}</div>}
      </div>
    </div>
  );
};
