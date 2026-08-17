'use client';

import Link from 'next/link';
import { ArrowRight, Users, TrendingUp, Package, DollarSign } from 'lucide-react';

/**
 * Landing page with easy access to demo workspaces
 */
export default function HomePage() {
  const demos = [
    {
      role: 'owner',
      title: 'Owner Dashboard',
      description: 'Strategic overview, handoffs, and company-wide decisions',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      role: 'sales',
      title: 'Sales Manager',
      description: 'Customer relationships, orders, and revenue tracking',
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      role: 'finance',
      title: 'Finance Controller',
      description: 'Invoices, payments, and financial operations',
      icon: DollarSign,
      color: 'bg-purple-500',
    },
    {
      role: 'production',
      title: 'Production Chief',
      description: 'Manufacturing, inventory, and quality control',
      icon: Package,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center font-logo font-black text-white text-xl">
                D
              </div>
              <h1 className="font-logo font-black text-2xl tracking-tight uppercase">
                Decision<span className="text-brand-red">OS</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="px-3 sm:px-4 py-2 min-h-[44px] flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-brand-red transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-3 sm:px-4 py-2 min-h-[44px] flex items-center text-sm font-bold bg-brand-red text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm active:shadow-none active:translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-zinc-900 dark:text-white mb-4 sm:mb-6 leading-tight">
            Your Company Brain
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
            Multi-view task management with real-time collaboration, voice input, and smart routing.
            Built for manufacturing teams who need to stay synchronized.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            <span className="font-bold">Demo Mode Active</span>
            <span>•</span>
            <span>No signup required to explore</span>
          </div>
        </div>

        {/* Demo Workspaces Grid */}
        <div className="mb-12">
          <h3 className="font-heading font-bold text-2xl text-zinc-900 dark:text-white text-center mb-8">
            Explore Demo Workspaces
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {demos.map((demo) => {
              const Icon = demo.icon;
              return (
                <Link
                  key={demo.role}
                  href={`/demo/${demo.role}`}
                  className="group relative bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 hover:border-brand-red hover:shadow-xl transition-all duration-300 active:scale-[0.98] min-h-[180px] flex flex-col"
                >
                  <div className={`w-12 h-12 ${demo.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-heading font-bold text-lg text-zinc-900 dark:text-white mb-2">
                    {demo.title}
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    {demo.description}
                  </p>
                  <div className="flex items-center gap-2 text-brand-red font-bold text-sm group-hover:gap-3 transition-all">
                    <span>Explore</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
          <h3 className="font-heading font-bold text-xl text-zinc-900 dark:text-white text-center mb-6">
            What's Inside
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="font-bold text-3xl text-brand-red mb-2">3 Views</div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Feed, Kanban, Timeline</p>
            </div>
            <div>
              <div className="font-bold text-3xl text-brand-red mb-2">2 Voice Modes</div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Web Speech + Whisper API</p>
            </div>
            <div>
              <div className="font-bold text-3xl text-brand-red mb-2">Real-time</div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Live collaboration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>DecisionOS - Built with Next.js 16, React 19, Supabase, and FullCalendar</p>
        </div>
      </footer>
    </div>
  );
}
