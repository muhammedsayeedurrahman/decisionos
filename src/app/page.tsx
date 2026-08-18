'use client';

import Link from 'next/link';
import { 
  ArrowRight, 
  Users, 
  LineChart, 
  Package, 
  Tag, 
  Settings, 
  Brain, 
  AlertCircle, 
  Zap, 
  Sparkles, 
  CheckCircle, 
  Mic, 
  GitBranch,
  TrendingUp,
  DollarSign
} from 'lucide-react';

/**
 * High-fidelity DecisionOS Logo component
 */
const Logo = ({ size = "md" }: { size?: "sm" | "md" }) => {
  const boxSize = "sm" === size ? "w-8 h-8" : "w-9 h-9";
  const boxText = "sm" === size ? "text-lg" : "text-xl";
  const brandText = "sm" === size ? "text-xl" : "text-2xl";
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className={`${boxSize} bg-brand-red rounded-lg flex items-center justify-center shrink-0`}>
        <span className={`font-logo font-black text-white ${boxText} leading-none`}>
          D
        </span>
      </div>
      <span className={`font-logo font-black ${brandText} tracking-tight uppercase leading-none`}>
        <span className="text-white">Decision</span>
        <span className="text-brand-red">OS</span>
      </span>
    </div>
  );
};

/**
 * Eyebrow typography element used on sections
 */
const SectionEyebrow = ({ children, big = false }: { children: React.ReactNode; big?: boolean }) => {
  return (
    <div className={`font-mono uppercase tracking-[0.25em] mb-4 text-brand-red ${big ? "text-sm sm:text-base" : "text-xs"}`}>
      {children}
    </div>
  );
};

/**
 * Standard brutalist card for AI Departments
 */
const DepartmentCard = ({ icon: Icon, tag, title, children }: { icon: any; tag: string; title: string; children: React.ReactNode }) => {
  return (
    <div className="border-2 border-black bg-white p-6 hover:shadow-brutal transition-all duration-200">
      <div className="flex items-center gap-2 text-brand-red mb-2">
        <Icon size={18} />
        <span className="font-mono text-[11px] uppercase tracking-widest">{tag}</span>
      </div>
      <h3 className="font-heading font-extrabold uppercase tracking-tight text-lg text-[#16161a]">{title}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-600 mt-1 leading-relaxed">{children}</p>
    </div>
  );
};

/**
 * The high-fidelity homepage replicated from https://decisionos.biz/
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
    <div className="bg-white text-[#16161a] min-h-screen" data-testid="landing-page">
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#16161a]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="#demos" className="text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider px-2 py-1 transition-colors">
              Demos
            </Link>
            <Link href="/login" data-testid="landing-login-btn" className="text-white/90 hover:text-white text-sm font-semibold uppercase tracking-wider px-3 sm:px-4 py-2 transition-colors">
              Log in
            </Link>
            <Link href="/signup" data-testid="landing-signup-btn" className="bg-brand-red text-white text-sm font-semibold uppercase tracking-wider px-4 sm:px-5 py-2 border border-brand-red hover:bg-white hover:text-brand-red transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section (Dark BG) */}
      <section className="bg-[#16161a] text-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-24 sm:py-32">
          <SectionEyebrow big={true}>The Operating Brain for Founder-Led Businesses</SectionEyebrow>
          <h1 className="font-heading font-black tracking-tight text-5xl sm:text-6xl lg:text-7xl leading-[1.02] uppercase">
            Speak the decision.<br />
            <span className="text-brand-red">We run</span> the company.
          </h1>
          <div className="h-1.5 w-20 bg-brand-red my-8"></div>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl leading-relaxed">
            The AI operating system that remembers every decision, organises every task, and executes the way your business actually runs — from voice notes and WhatsApp to paper bills.
          </p>
          <div className="flex flex-wrap gap-3 mt-10">
            <Link href="/signup" data-testid="hero-signup-btn" className="flex items-center gap-2 bg-brand-red text-white text-sm font-semibold uppercase tracking-wider px-6 py-3 border border-brand-red hover:bg-white hover:text-brand-red transition-colors">
              Get started free <ArrowRight size={16} />
            </Link>
            <Link href="#how" className="flex items-center gap-2 border border-white/40 text-white text-sm font-semibold uppercase tracking-wider px-6 py-3 hover:bg-white hover:text-[#16161a] transition-colors">
              See how it works
            </Link>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-white/40 mt-8">
            Voice · Text · WhatsApp · Documents — captured once, executed forever
          </p>
        </div>
      </section>

      {/* Demo Workspaces Banner/Section */}
      <section id="demos" className="bg-[#f7f5f2] border-b-2 border-black/10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
          <div className="bg-brand-red/5 border-2 border-[#16161a] p-6 sm:p-8 hover:shadow-brutal transition-all duration-200">
            <div className="flex items-center gap-2 text-brand-red mb-3">
              <Sparkles size={18} className="fill-brand-red/20" />
              <span className="font-mono text-[11px] uppercase tracking-widest font-semibold">Demo mode active</span>
            </div>
            <h3 className="font-heading font-black text-2xl uppercase tracking-tight text-[#16161a]">
              Explore the dashboards without signing up
            </h3>
            <p className="text-sm text-zinc-600 mt-1 max-w-xl">
              Jump straight into one of our interactive role-based demo workspaces to see how the company brain operates in real-time.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              {demos.map((demo) => {
                const Icon = demo.icon;
                return (
                  <Link
                    key={demo.role}
                    href={`/demo/${demo.role}`}
                    className="border-2 border-[#16161a] bg-white p-5 hover:shadow-brutal hover:border-brand-red transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className={`w-10 h-10 ${demo.color} rounded flex items-center justify-center mb-4 text-white shadow-sm`}>
                        <Icon size={20} />
                      </div>
                      <h4 className="font-heading font-extrabold uppercase tracking-tight text-sm text-[#16161a]">
                        {demo.title}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-1.5 mb-5 leading-normal">
                        {demo.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-brand-red font-bold text-xs">
                      <span>Launch Dashboard</span>
                      <ArrowRight size={14} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* The Founder Problem Section */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
          <SectionEyebrow>The Founder Problem</SectionEyebrow>
          <h2 className="font-heading font-black tracking-tight text-3xl sm:text-4xl leading-tight max-w-2xl text-[#16161a] uppercase">
            Your business lives inside your head. That's the risk.
          </h2>
          <div className="grid sm:grid-cols-2 gap-5 mt-10">
            <div className="border-2 border-[#16161a] bg-[#16161a] text-white p-6">
              <div className="font-mono text-xs uppercase tracking-widest text-white/50 mb-2">The old way</div>
              <p className="text-white/90 text-sm leading-relaxed">
                Founder remembers → tells someone → hopes it happens → chases → repeats. Decisions evaporate, work scatters, nothing is provable, and you become the bottleneck.
              </p>
            </div>
            <div className="border-2 border-[#16161a] bg-white text-[#16161a] p-6">
              <div className="font-mono text-xs uppercase tracking-widest text-brand-red mb-2">The DecisionOS way</div>
              <p className="text-sm leading-relaxed">
                Founder speaks → AI captures, routes, assigns, tracks, chases, and remembers it forever. One place where nothing is lost, ignored, or left undone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* One sentence. A company-wide rule, enforced Section (Dark BG) */}
      <section className="bg-[#16161a] text-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
          <SectionEyebrow>The 10-Second Wow</SectionEyebrow>
          <h2 className="font-heading font-black tracking-tight text-3xl sm:text-4xl leading-tight max-w-3xl uppercase">
            One sentence. A company-wide rule, <span className="text-brand-red">enforced.</span>
          </h2>
          <div className="mt-10 space-y-4 max-w-3xl">
            <div className="border-l-4 border-brand-red pl-5 py-2">
              <div className="font-mono text-[11px] uppercase tracking-widest text-brand-red/90">
                Second 0 — the owner speaks
              </div>
              <p className="font-heading font-black text-xl sm:text-2xl mt-1 leading-snug">
                "From today, stop any dispatch that doesn't have payment approval."
              </p>
            </div>
            <div className="border-l-4 border-brand-red pl-5 py-2">
              <div className="font-mono text-[11px] uppercase tracking-widest text-brand-red/90">
                Second 3 — the AI understands
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Operating Rule", "Trigger: Dispatch", "Condition: Payment approved", "Scope: Company-wide"].map((rule, idx) => (
                  <span 
                    key={rule} 
                    className={`text-xs font-semibold rounded-full px-3 py-1 ${idx === 0 ? "bg-brand-red text-white" : "bg-white/10 text-white border border-white/20"}`}
                  >
                    {rule}
                  </span>
                ))}
              </div>
            </div>
            <div className="border-l-4 border-brand-red pl-5 py-2">
              <div className="font-mono text-[11px] uppercase tracking-widest text-brand-red/90">
                Second 10 — the business changes
              </div>
              <div className="mt-2 border border-white/15 bg-white/5 p-4 rounded">
                <p className="text-white/90 text-sm">
                  <CheckCircle size={16} className="inline text-brand-red mr-1.5 fill-brand-red/20" />
                  Rule live across the dispatch workflow · teams notified · exceptions escalate to the owner · filed to the Company Brain.
                </p>
              </div>
            </div>
          </div>
          <p className="text-lg mt-8 max-w-2xl leading-relaxed">
            Not a to-do — <span className="text-brand-red font-semibold">an operational change, running itself.</span>
          </p>
        </div>
      </section>

      {/* Capture -> Execute -> Remember Section */}
      <section id="how" className="bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
          <SectionEyebrow>Decision Flow</SectionEyebrow>
          <h2 className="font-heading font-black tracking-tight text-3xl sm:text-4xl leading-tight text-[#16161a] uppercase">
            Capture → Execute → Remember.
          </h2>
          <div className="grid md:grid-cols-3 gap-5 mt-10">
            {[
              { 
                icon: Mic, 
                t: "Capture", 
                d: "Speak it, type it, forward it, or upload it. Voice, text, WhatsApp, PDFs and photos — the channels your team already uses." 
              },
              { 
                icon: GitBranch, 
                t: "Execute", 
                d: "AI classifies, extracts and routes to the right department. On approval it creates tasks, invoices, payments, contacts and finance entries — with owners and due dates." 
              },
              { 
                icon: Brain, 
                t: "Remember", 
                d: "Every decision, approval and rupee is filed into the Company Brain — searchable in plain English, forever." 
              }
            ].map((flow, index) => {
              const Icon = flow.icon;
              return (
                <div key={flow.t} className="border-2 border-black p-6 relative hover:shadow-brutal transition-all duration-200 bg-white">
                  <div className="font-heading font-black text-5xl text-black/10 absolute top-4 right-5 select-none">
                    {index + 1}
                  </div>
                  <Icon size={26} className="text-brand-red" />
                  <h3 className="font-heading font-extrabold uppercase tracking-tight text-xl mt-3 text-[#16161a]">{flow.t}</h3>
                  <p className="text-sm text-zinc-600 mt-2 leading-relaxed">{flow.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Proactive Intelligence Section */}
      <section className="bg-[#f7f5f2]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
          <SectionEyebrow>Proactive Intelligence</SectionEyebrow>
          <h2 className="font-heading font-black tracking-tight text-3xl sm:text-4xl leading-tight text-[#16161a] uppercase">
            It doesn't wait to be asked.
          </h2>
          <p className="text-zinc-600 mt-3 max-w-2xl leading-relaxed">
            DecisionOS watches the business and speaks up first — surfacing the risk and the recommended action before it costs you money.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            {[
              { t: "Cash flow", a: "₹45,000 overdue to a vendor — due today.", r: "→ Confirm terms & clear payment." },
              { t: "Inventory", a: "Stock won't cover next week's orders.", r: "→ Raise a purchase order now." },
              { t: "Delayed orders", a: "A dispatch is 2 days past due, no update.", r: "→ Nudge owner & notify customer." },
              { t: "Workload", a: "A teammate has 5 open, 1 overdue.", r: "→ Reassign or extend." }
            ].map((alert) => (
              <div key={alert.t} className="border-2 border-black bg-white p-5 hover:shadow-brutal transition-all duration-200">
                <div className="flex items-center gap-2 text-brand-red mb-2">
                  <AlertCircle size={16} />
                  <span className="font-mono text-[11px] uppercase tracking-widest font-semibold">{alert.t}</span>
                </div>
                <p className="font-semibold text-sm text-[#16161a]">{alert.a}</p>
                <p className="text-sm text-zinc-500 mt-1 font-medium">{alert.r}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-lg text-[#16161a] leading-relaxed">
            Every alert is <span className="text-brand-red font-semibold">one tap from action</span> — turn it into a task, assign it, done.
          </p>
        </div>
      </section>

      {/* AI Departments Section */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
          <SectionEyebrow>AI Departments</SectionEyebrow>
          <h2 className="font-heading font-black tracking-tight text-3xl sm:text-4xl leading-tight text-[#16161a] uppercase">
            Every function, quietly on autopilot.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            <DepartmentCard icon={LineChart} tag="Finance" title="The AI CFO">
              Snap a bill — AI reads & files it. Live spend, outstanding, assets & inventory, plus a ranked action brief.
            </DepartmentCard>
            <DepartmentCard icon={Package} tag="Inventory" title="Stock in the open">
              Track items, quantities & value; purchase bills flow into the ledger and the Brain.
            </DepartmentCard>
            <DepartmentCard icon={Tag} tag="Sales" title="Nothing slips">
              Orders, invoices, follow-ups & dispatch workflows — captured from a message and driven to done.
            </DepartmentCard>
            <DepartmentCard icon={Users} tag="HR & People" title="Team & leave">
              Leave with AI impact-routing, a CRM-lite people hub, and coaching for every member.
            </DepartmentCard>
            <DepartmentCard icon={Settings} tag="Operations" title="The daily heartbeat">
              A morning CEO Brief — done, open, overdue, needs-a-decision — with auto follow-ups & escalations.
            </DepartmentCard>
            <DepartmentCard icon={Brain} tag="Company Brain" title="Total recall">
              Ask your business anything in plain English and get the answer from your real history in seconds.
            </DepartmentCard>
          </div>
        </div>
      </section>

      {/* Why DecisionOS Section (Dark BG) */}
      <section className="bg-[#16161a] text-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
          <SectionEyebrow>Why DecisionOS?</SectionEyebrow>
          <h2 className="font-heading font-black tracking-tight text-3xl sm:text-4xl leading-tight uppercase">
            Not a chatbot. Not a clunky ERP. <span className="text-brand-red">An operating brain.</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-5 mt-10">
            {[
              { 
                t: "Permanent company memory", 
                d: "Every decision & record remembered — not forgotten each chat, not just rows of data." 
              },
              { 
                t: "Turns talk into action", 
                d: "Tasks, records and rules — executed. Not text out, not manual data entry." 
              },
              { 
                t: "Learns how you operate", 
                d: "Your Business DNA compounds over time — the foundation for AI managers." 
              }
            ].map((card) => (
              <div key={card.t} className="border border-white/15 bg-white/5 p-6 hover:border-brand-red transition-all duration-200">
                <Zap size={20} className="text-brand-red fill-brand-red/10" />
                <h3 className="font-heading font-extrabold uppercase tracking-tight text-base mt-3 text-white">{card.t}</h3>
                <p className="text-sm text-white/60 mt-1.5 leading-relaxed">{card.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section (Solid Red BG) */}
      <section className="bg-brand-red text-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 text-center">
          <Sparkles size={30} className="mx-auto mb-5 text-white fill-white/20" />
          <h2 className="font-heading font-black tracking-tight text-3xl sm:text-5xl leading-tight max-w-3xl mx-auto uppercase">
            Every business decision — remembered, organized, and executed.
          </h2>
          <div className="flex flex-wrap gap-3 justify-center mt-10">
            <Link 
              href="/signup" 
              data-testid="cta-signup-btn" 
              className="flex items-center gap-2 bg-white text-brand-red text-sm font-semibold uppercase tracking-wider px-7 py-3 border border-white hover:bg-transparent hover:text-white transition-colors"
            >
              Start free <ArrowRight size={16} />
            </Link>
            <Link 
              href="/login" 
              data-testid="cta-login-btn" 
              className="border border-white/60 text-white text-sm font-semibold uppercase tracking-wider px-7 py-3 hover:bg-white hover:text-brand-red transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer (Dark BG) */}
      <footer className="bg-[#16161a] text-white/50 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size="sm" />
          <div className="flex items-center gap-6 text-sm">
            <a 
              href="/DecisionOS-Vision.pdf" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-white transition-colors"
            >
              Vision doc
            </a>
            <Link href="/login" className="hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-white transition-colors">
              Sign up
            </Link>
          </div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-white/40">
            © 2026 DecisionOS
          </div>
        </div>
      </footer>

    </div>
  );
}
