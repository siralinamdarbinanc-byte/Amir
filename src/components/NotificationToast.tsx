import React, { useEffect } from 'react';
import { Bell, CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-16 left-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl flex items-start gap-3 backdrop-blur-md transition-all animate-bounce-short ${
            toast.type === 'success'
              ? 'bg-zinc-900/95 border-emerald-500/50 text-emerald-300'
              : toast.type === 'error'
              ? 'bg-zinc-900/95 border-red-500/50 text-red-300'
              : toast.type === 'warning'
              ? 'bg-zinc-900/95 border-amber-500/50 text-amber-300'
              : 'bg-zinc-900/95 border-amber-500/30 text-zinc-200'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {toast.type === 'info' && <Bell className="w-5 h-5 text-amber-400" />}
          </div>

          <div className="flex-1 text-right">
            <h4 className="font-bold text-xs mb-0.5 text-zinc-100">{toast.title}</h4>
            <p className="text-xs opacity-90 leading-relaxed">{toast.message}</p>
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-zinc-500 hover:text-zinc-200 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
