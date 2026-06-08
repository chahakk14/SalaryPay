import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastProps = {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
};

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const colorMap: Record<string, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-slate-900 text-white',
};

export default function Toast({ type, message, onClose }: ToastProps) {
  const Icon = iconMap[type] || Info;

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-2xl px-4 py-3 shadow-2xl ${colorMap[type]}`}>
      <Icon className="w-5 h-5 mt-0.5" />
      <div className="flex-1 text-sm leading-5">{message}</div>
      {onClose && (
        <button onClick={onClose} className="rounded-full p-1.5 text-white/80 hover:bg-white/10">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
