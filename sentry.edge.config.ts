import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  tracesSampleRate: 0.05,
  enabled: Boolean(process.env.SENTRY_DSN),
});
