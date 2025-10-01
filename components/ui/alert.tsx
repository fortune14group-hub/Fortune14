'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'info';
}

const variantStyles: Record<NonNullable<AlertProps['variant']>, string> = {
  default: 'border-brand-500/40 bg-brand-500/10 text-brand-100',
  destructive: 'border-red-500/40 bg-red-500/10 text-red-100',
  info: 'border-slate-500/40 bg-slate-500/10 text-slate-100',
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'flex w-full items-start space-x-3 rounded-lg border px-4 py-3 text-sm',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
);
Alert.displayName = 'Alert';

export { Alert };
