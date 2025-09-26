import { init } from '@sentry/nextjs';

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    init({
      dsn: process.env.SENTRY_DSN || '',
      tracesSampleRate: 0.1,
      enabled: Boolean(process.env.SENTRY_DSN),
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    });
  }
}
