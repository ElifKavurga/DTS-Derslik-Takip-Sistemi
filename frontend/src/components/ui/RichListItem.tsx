import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface RichListItemProps {
  onClick?: () => void;
  actionMenu?: ReactNode;
  children: ReactNode;
}

export const RichListItem = ({ onClick, actionMenu, children }: RichListItemProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'dts-card dts-card-hover group flex items-center justify-between p-5 relative overflow-hidden transition-all duration-300 ease-out select-none border-slate-200/30',
        onClick && 'cursor-pointer hover:border-[#006482]/20'
      )}
    >
      {/* Left accent bar on hover */}
      <div className="absolute inset-y-0 left-0 w-[4.5px] bg-transparent transition-colors duration-300 group-hover:bg-[#006482]" />

      {/* Main Content */}
      <div className="flex-1 min-w-0 pr-4 pl-1">{children}</div>

      {/* Dropdown Action Menu */}
      {actionMenu && <div className="shrink-0">{actionMenu}</div>}
    </div>
  );
};
