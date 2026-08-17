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
    <div className="dts-hero-card relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#006482]/15 bg-gradient-to-br from-[#eff8ff]/70 via-white to-white px-5 py-4 sm:py-4.5 shadow-xs">
      {/* Top Blue -> Yellow gradient line */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#004b62] via-[#006482] to-[#fabc07]" />
      
      {backAction && <div className="mb-2">{backAction}</div>}
      
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 truncate">{title}</h1>
            {badge}
          </div>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
        {action && <div className="shrink-0 flex items-center">{action}</div>}
      </div>
    </div>
  );
};
