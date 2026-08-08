import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const FormModal = ({ isOpen, onClose, title, children }: FormModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-slate-950/35 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Content Modal */}
      <div className="relative z-[101] w-full max-w-lg rounded-[24px] border border-slate-200/40 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 leading-none">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-4 overflow-y-auto flex-1 pr-1">{children}</div>
      </div>
    </div>
  );
};
