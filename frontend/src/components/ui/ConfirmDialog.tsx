import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Sil',
  cancelText = 'İtal',
  confirmLoading = false,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Content Dialog */}
      <div className="relative w-full max-w-md rounded-[24px] border border-slate-200/40 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100">
            <AlertTriangle className="h-5.5 w-5.5" />
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 leading-none">{title}</h3>
            <p className="text-xs leading-relaxed text-slate-500">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-1">
          <SecondaryButton onClick={onClose} disabled={confirmLoading}>
            {cancelText}
          </SecondaryButton>
          <PrimaryButton
            onClick={onConfirm}
            loading={confirmLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600/10"
          >
            {confirmText}
          </PrimaryButton>
        </div>
      </div>
    </div>,
    document.body
  );
};
