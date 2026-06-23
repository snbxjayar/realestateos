import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '../../store';

const CONFIG = {
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50 border-green-200',
    icon_color: 'text-green-500',
    text: 'text-green-800',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50 border-red-200',
    icon_color: 'text-red-500',
    text: 'text-red-800',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 border-amber-200',
    icon_color: 'text-amber-500',
    text: 'text-amber-800',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50 border-blue-200',
    icon_color: 'text-blue-500',
    text: 'text-blue-800',
  },
};

export const Toast = () => {
  const { toast, hideToast } = useUIStore();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(hideToast, 4000);
    return () => clearTimeout(t);
  }, [toast, hideToast]);

  if (!toast) return null;

  const { icon: Icon, bg, icon_color, text } = CONFIG[toast.type];

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-2">
      <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm ${bg}`}>
        <Icon size={20} className={`shrink-0 mt-0.5 ${icon_color}`} />
        <p className={`text-sm font-medium flex-1 ${text}`}>{toast.message}</p>
        <button onClick={hideToast} className={`shrink-0 ${icon_color} hover:opacity-70`}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
