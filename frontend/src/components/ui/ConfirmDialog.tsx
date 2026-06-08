import { X, CheckCircle, AlertTriangle } from 'lucide-react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          </div>
          <button onClick={onCancel} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 text-sm text-gray-600">
          {description}
        </div>
        <div className="flex items-center gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
            {cancelText}
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600">
            <span className="inline-flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {confirmText}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
