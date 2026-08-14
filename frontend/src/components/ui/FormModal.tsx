import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidthClassName?: string;
}

export const FormModal = ({ isOpen, onClose, title, children, maxWidthClassName = 'max-w-lg' }: FormModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1000] bg-slate-950/45 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Content Modal */}
      <div
        className={`relative z-[1001] flex max-h-[90vh] w-full flex-col rounded-[24px] border border-slate-200/40 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${maxWidthClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 id="form-modal-title" className="text-base font-bold text-slate-900 leading-none">{title}</h3>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-800 transition"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-4 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">{children}</div>
      </div>
    </div>,
    document.body,
  );
};
