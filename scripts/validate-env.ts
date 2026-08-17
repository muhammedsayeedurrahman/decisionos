#!/usr/bin/env node
/**
 * Environment Validation Script
 *
 * Run this script to validate environment variables before deployment
 * Usage: npm run validate-env
 */

import { config } from 'dotenv';
import { validateEnv } from '../src/lib/env';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Set NODE_ENV to production for build validation if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

console.log('🔍 Validating environment variables...\n');

try {
  const env = validateEnv();

  console.log('\n📋 Environment Summary:');
  console.log(`  • Node Environment: ${env.NODE_ENV}`);
  console.log(`  • Demo Mode: ${env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log(`  • Supabase: ${env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  • OpenAI: ${env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  • Redis: ${env.UPSTASH_REDIS_REST_URL ? '✅ Configured' : '⚠️  In-memory fallback'}`);
  console.log(`  • Sentry: ${env.NEXT_PUBLIC_SENTRY_DSN ? '✅ Configured' : '⚠️  Disabled'}`);

  console.log('\n✅ All environment variables are valid!\n');
  process.exit(0);
} catch (error) {
  // Error details are already logged by validateEnv()
  // Just exit with error code
  process.exit(1);
}
