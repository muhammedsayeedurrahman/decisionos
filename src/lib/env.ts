/**
 * Environment Variable Validation
 *
 * This module validates all required environment variables at startup.
 * If any required variables are missing or invalid, the app will crash
 * with a clear error message instead of failing silently later.
 *
 * Usage: Import and call validateEnv() in next.config.ts
 */

import { z } from 'zod';

const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']),

  // Supabase (Required for all environments)
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
    .optional()
    .or(z.literal('')), // Allow empty for demo mode

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY must be at least 20 characters')
    .optional()
    .or(z.literal('')), // Allow empty for demo mode

  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20, 'SUPABASE_SERVICE_ROLE_KEY must be at least 20 characters')
    .optional()
    .or(z.literal('')), // Allow empty for demo mode

  // OpenAI (Required for transcription)
  OPENAI_API_KEY: z
    .string()
    .startsWith('sk-', 'OPENAI_API_KEY must start with sk-')
    .optional()
    .or(z.literal('')), // Allow empty for demo mode

  // Redis/Upstash (Optional, falls back to in-memory)
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal('')),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().or(z.literal('')),

  // Sentry (Optional, for error tracking)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  SENTRY_AUTH_TOKEN: z.string().optional().or(z.literal('')),
  SENTRY_ORG: z.string().optional().or(z.literal('')),
  SENTRY_PROJECT: z.string().optional().or(z.literal('')),

  // Demo Mode
  NEXT_PUBLIC_DEMO_MODE: z
    .enum(['true', 'false'])
    .optional()
    .default('false'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 *
 * @throws {Error} If validation fails
 */
export function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);

    // Additional validation: If not in demo mode, require Supabase and OpenAI
    if (env.NEXT_PUBLIC_DEMO_MODE !== 'true' && env.NODE_ENV !== 'test') {
      if (!env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL === '') {
        throw new Error(
          '❌ NEXT_PUBLIC_SUPABASE_URL is required when DEMO_MODE is disabled\n' +
          'Set NEXT_PUBLIC_DEMO_MODE=true to run in demo mode without Supabase'
        );
      }

      if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY === '') {
        throw new Error(
          '❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is required when DEMO_MODE is disabled\n' +
          'Set NEXT_PUBLIC_DEMO_MODE=true to run in demo mode without Supabase'
        );
      }

      if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === '') {
        throw new Error(
          '❌ OPENAI_API_KEY is required when DEMO_MODE is disabled\n' +
          'Set NEXT_PUBLIC_DEMO_MODE=true to run in demo mode without OpenAI'
        );
      }
    }

    // Warn about missing optional services
    if (!env.UPSTASH_REDIS_REST_URL) {
      console.warn(
        '⚠️  UPSTASH_REDIS_REST_URL not set - using in-memory rate limiting\n' +
        '   This will not work in multi-instance deployments!'
      );
    }

    if (!env.NEXT_PUBLIC_SENTRY_DSN && env.NODE_ENV === 'production') {
      console.warn(
        '⚠️  NEXT_PUBLIC_SENTRY_DSN not set - error tracking disabled\n' +
        '   Highly recommended for production!'
      );
    }

    console.log('✅ Environment validation passed');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('\n❌ Environment validation failed:\n');

      error.issues.forEach((err) => {
        const path = err.path.join('.');
        console.error(`  • ${path}: ${err.message}`);
      });

      console.error('\n💡 Check your .env.local file and ensure all required variables are set.\n');
    }

    // Re-throw the error so caller can handle it
    throw error;
  }
}

/**
 * Get a validated environment variable
 * Safe to use after validateEnv() has been called
 */
export function getEnv(key: keyof Env): string | undefined {
  return process.env[key];
}

/**
 * Check if app is running in demo mode
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/**
 * Check if app is running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if app is running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}
