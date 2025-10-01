'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

type ToastVariant = 'default' | 'success' | 'destructive';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastInstance extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
  dismiss: (id: number) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastInstance[]>([]);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = React.useCallback(
    ({ duration = 3500, ...options }: ToastOptions) => {
      setToasts((prev) => {
        const id = Date.now() + Math.random();
        const next: ToastInstance = { id, ...options };
        window.setTimeout(() => dismiss(id), duration);
        return [...prev, next];
      });
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col space-y-2">
        {toasts.map(({ id, title, description, variant = 'default' }) => (
          <div
            key={id}
            className={cn(
              'pointer-events-auto overflow-hidden rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur',
              variant === 'destructive'
                ? 'border-red-600 bg-red-600/10 text-red-100'
                : variant === 'success'
                ? 'border-emerald-500/70 bg-emerald-500/10 text-emerald-100'
                : 'border-slate-700 bg-slate-900/90 text-slate-100'
            )}
          >
            {title ? <p className="font-semibold">{title}</p> : null}
            {description ? <p className="mt-1 text-sm opacity-90">{description}</p> : null}
            <button
              type="button"
              aria-label="Stäng"
              onClick={() => dismiss(id)}
              className="mt-2 inline-flex text-xs font-medium text-slate-300 underline-offset-2 hover:underline"
            >
              Stäng
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast måste användas inom en ToastProvider');
  }
  return context;
}
