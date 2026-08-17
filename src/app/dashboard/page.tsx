'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardRedirect() {
  const router = useRouter();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!profile) {
      // Not authenticated, redirect to login
      router.push('/');
      return;
    }

    // Redirect to role-specific dashboard
    // For now, redirect to demo dashboard based on role
    // In future, this will be the real production dashboard
    router.push(`/demo/${profile.role}`);
  }, [profile, loading, router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-center">
        <div className="w-12 h-12 bg-brand-red rounded-lg flex items-center justify-center font-logo font-black text-white text-2xl mx-auto mb-4 animate-pulse">
          D
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">
          Loading dashboard...
        </p>
      </div>
    </div>
  );
}
