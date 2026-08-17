/**
 * Sentry Server Configuration
 *
 * Captures errors in Node.js/Next.js server runtime and sends them to Sentry.
 * Only initializes if NEXT_PUBLIC_SENTRY_DSN is set.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    integrations: [
      Sentry.httpIntegration(),
    ],

    // Note: if you want to override the automatic release value, do not set a
    // `release` value here - use the environment variable `SENTRY_RELEASE`, so
    // that it will also get attached to your source maps

    // Filter out sensitive data before sending to Sentry
    beforeSend(event) {
      // Don't send errors in demo mode
      if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return null;
      }

      // Remove sensitive data from request
      if (event.request?.data) {
        const data = event.request.data as Record<string, unknown>;
        delete data.password;
        delete data.token;
        delete data.apiKey;
        delete data.supabaseKey;
        delete data.openaiKey;
      }

      // Remove sensitive environment variables
      if (event.contexts?.runtime?.env) {
        const env = event.contexts.runtime.env as Record<string, unknown>;
        delete env.OPENAI_API_KEY;
        delete env.SUPABASE_SERVICE_ROLE_KEY;
        delete env.UPSTASH_REDIS_REST_TOKEN;
        delete env.SENTRY_AUTH_TOKEN;
      }

      return event;
    },

    environment: process.env.NODE_ENV,
  });
}
