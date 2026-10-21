import * as Sentry from '@sentry/react';

// Reads VITE_SENTRY_DSN at build time. If the variable is empty or unset
// (the default in dev), Sentry is disabled and no network calls are made.
const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const env = import.meta.env.MODE;

Sentry.init({
  dsn: dsn,
  enabled: Boolean(dsn),
  environment: env,
  tracesSampleRate: env === 'production' ? 0.1 : 0,
  debug: env === 'development' && Boolean(dsn),
  sendDefaultPii: false,
  // Session replay for error diagnosis — captured only when an error fires.
  integrations: [Sentry.replayIntegration()],
});

export { Sentry };
