'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isDemoMode } from '@/lib/supabase/client';
import Link from 'next/link';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Check if running in demo mode - don't make any Supabase calls
      if (isDemoMode()) {
        // Check if user exists in localStorage
        const demoUserStr = localStorage.getItem('demo_user');

        if (demoUserStr) {
          try {
            const demoUser = JSON.parse(demoUserStr);

            // Validate email matches (password can be anything in demo mode)
            if (demoUser.email === email) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
              // Redirect to user's actual role dashboard
              router.push(`/demo/${demoUser.role}`);
              return;
            } else {
              // Email doesn't match - show error
              setError('Invalid email or password');
              setLoading(false);
              return;
            }
          } catch (e) {
            // Invalid JSON in localStorage
            console.error('Invalid demo user data in localStorage');
          }
        }

        // No existing user - prompt to sign up
        setError('No account found with this email. Please sign up first.');
        setLoading(false);
        return;
      }

      // Production mode: Real Supabase Auth login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Get user profile to determine redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        // Redirect to role-specific dashboard
        router.push(`/demo/${profile?.role || 'owner'}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-brand-red rounded-lg flex items-center justify-center font-logo font-black text-white text-2xl">
              D
            </div>
          </div>
          <h1 className="font-logo font-black text-3xl tracking-tight uppercase">
            Decision<span className="text-brand-red">OS</span>
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            Your Company Brain
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-8">
          <h2 className="font-heading font-bold text-2xl text-zinc-900 dark:text-white mb-6">
            Sign in to your account
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Google Sign-In */}
          <GoogleSignInButton mode="signin" onError={setError} />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-300 dark:border-zinc-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 min-h-[48px] text-base border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand-red focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 min-h-[48px] text-base border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand-red focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red hover:bg-red-700 active:bg-red-800 text-white font-bold py-3 px-4 min-h-[48px] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:shadow-none active:translate-y-0.5"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Don't have an account?{' '}
              <Link href="/signup" className="text-brand-red hover:text-red-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Demo accounts hint */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Demo Mode:</strong> Sign up to create a new account or use existing demo credentials
          </p>
        </div>
      </div>
    </div>
  );
}
