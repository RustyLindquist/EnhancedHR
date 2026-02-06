import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, Check, Sparkles, User } from 'lucide-react';
import MarketingDivider from '@/components/marketing/MarketingDivider';
import FadeIn from '@/components/marketing/FadeIn';

export const metadata: Metadata = {
    title: 'Pricing — EnhancedHR.ai',
    description:
        'Simple pricing for individuals and organizations. $30/month individual, or $30/employee/month for teams. Built-in AI agents, collections, and tools.',
};

const anchorPills = [
    { label: 'Plans', id: 'plans' },
    { label: 'FAQs', id: 'faqs' },
];

export default function PricingPage() {
    return (
        <div className="overflow-hidden">

            {/* ═══════════════════════════════════════════
                HERO
            ═══════════════════════════════════════════ */}
            <section className="relative">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#4B8BB3]/8 rounded-full blur-[140px]" />
                </div>

                <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
                    <FadeIn>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#4B8BB3]">
                            Pricing
                        </div>
                    </FadeIn>
                    <FadeIn delay={100}>
                        <h1 className="mt-3 text-balance text-5xl font-bold tracking-tight text-white sm:text-6xl">
                            Simple pricing. The AI layer is included.
                        </h1>
                    </FadeIn>
                    <FadeIn delay={200}>
                        <p className="mt-6 max-w-3xl text-pretty text-lg leading-relaxed text-slate-300">
                            Start as an individual, or roll out to your organization. Both plans include collections and AI agents — because that&apos;s what turns learning into leverage.
                        </p>
                    </FadeIn>
                    <FadeIn delay={300}>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Link
                                href="/login?view=signup"
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4B8BB3] px-7 py-3.5 text-base font-bold text-white hover:bg-white hover:text-[#0A0D12] transition-colors shadow-[0_0_28px_rgba(75,139,179,0.3)]"
                            >
                                Get Started <ArrowRight size={18} />
                            </Link>
                            <Link
                                href="/platform"
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-7 py-3.5 text-base font-semibold text-white hover:bg-white/[0.08] transition-colors"
                            >
                                Explore the Platform <ArrowRight size={18} className="opacity-70" />
                            </Link>
                        </div>
                    </FadeIn>

                    {/* Anchor Navigation Pills */}
                    <FadeIn delay={200}>
                        <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto mt-8">
                            {anchorPills.map((pill) => (
                                <a
                                    key={pill.id}
                                    href={`#${pill.id}`}
                                    className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                                >
                                    {pill.label}
                                </a>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                PRICING CARDS
            ═══════════════════════════════════════════ */}
            <section id="plans" className="scroll-mt-28 relative py-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[#4B8BB3]/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="mx-auto max-w-7xl px-6 relative">
                    <FadeIn className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            Simple, Transparent Pricing
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Whether you&apos;re an individual looking to level up or an organization empowering your entire team, we keep it straightforward.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        {/* Individual Plan */}
                        <FadeIn delay={100}>
                            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full flex flex-col">
                                <div className="mb-6">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Individual</div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-bold text-white">$30</span>
                                        <span className="text-slate-500">/month</span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-2">Everything you need to learn, grow, and stay certified.</p>
                                </div>
                                <ul className="space-y-3 flex-1 mb-8">
                                    {[
                                        'Unlimited access to all Academy courses',
                                        'All 5 AI agents (Tutor, Assistant, Prometheus, Collection, Analytics)',
                                        'SHRM & HRCI automatic credit tracking',
                                        'Personal collections & knowledge management',
                                        'AI Tools (RolePlay Dojo, Disruption Forecasting, more)',
                                        'New content added regularly',
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                                            <Check size={14} className="text-[#4B8BB3] mt-0.5 flex-shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/login?view=signup"
                                    className="block w-full py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white font-semibold text-center hover:bg-white/[0.1] transition-all"
                                >
                                    Start Free Trial
                                </Link>
                            </div>
                        </FadeIn>

                        {/* Organization Plan */}
                        <FadeIn delay={200}>
                            <div className="p-8 rounded-2xl bg-[#4B8BB3]/5 border border-[#4B8BB3]/20 h-full flex flex-col relative overflow-hidden">
                                <div className="absolute top-4 right-4">
                                    <span className="px-2.5 py-1 rounded-full bg-[#4B8BB3]/20 text-[#4B8BB3] text-[10px] font-bold uppercase tracking-wider">Popular</span>
                                </div>
                                <div className="mb-6">
                                    <div className="text-xs font-bold text-[#4B8BB3] uppercase tracking-wider mb-2">Organization</div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-bold text-white">$30</span>
                                        <span className="text-slate-500">/user/month</span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-2">Everything in Individual, plus team management and org tools.</p>
                                </div>
                                <ul className="space-y-3 flex-1 mb-8">
                                    {[
                                        'Everything in the Individual plan',
                                        'Custom employee groups and segments',
                                        'Build and host org-specific courses',
                                        'Organizational knowledge collections',
                                        'Required learning assignments',
                                        'Analytics dashboard with AI insights',
                                        'Dynamic groups (auto-segmentation)',
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                                            <Check size={14} className="text-[#4B8BB3] mt-0.5 flex-shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/login?view=signup"
                                    className="block w-full py-3.5 rounded-xl bg-[#4B8BB3] text-white font-semibold text-center hover:bg-[#5a9bc3] transition-all shadow-[0_0_20px_rgba(75,139,179,0.25)]"
                                >
                                    Start Free Trial
                                </Link>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                FAQs
            ═══════════════════════════════════════════ */}
            <section id="faqs" className="scroll-mt-28 relative py-20">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
                        <div className="lg:col-span-5">
                            <FadeIn>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#4B8BB3]">
                                    FAQs
                                </div>
                                <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    Questions we expect at launch.
                                </h2>
                                <p className="mt-5 text-base leading-relaxed text-slate-400">
                                    If you want a rollout plan or help estimating seats, we&apos;ll help you structure it.
                                </p>
                            </FadeIn>
                        </div>

                        <div className="lg:col-span-7">
                            <FadeIn delay={100}>
                                <div className="grid gap-4">
                                    {[
                                        {
                                            q: 'Is the AI included in every plan?',
                                            a: 'Yes. The AI agents and collections are part of the core product, not an add-on.',
                                            icon: <Sparkles size={18} className="text-[#FF9300]" />,
                                        },
                                        {
                                            q: 'Can I start as an individual and later roll out to my org?',
                                            a: 'Yes. Many teams start with one HR leader and expand once the workflow is proven.',
                                            icon: <User size={18} className="text-[#4B8BB3]" />,
                                        },
                                        {
                                            q: 'What makes the team plan different?',
                                            a: 'Org collections, org courses, groups/assignments, and org analytics dashboards.',
                                            icon: <Building2 size={18} className="text-[#4B8BB3]" />,
                                        },
                                        {
                                            q: 'Can we use this as a knowledge base?',
                                            a: 'Yes. Org collections can hold policies, playbooks, docs, and other critical materials — with an assistant that answers based on that content.',
                                            icon: <Sparkles size={18} className="text-[#FF9300]" />,
                                        },
                                    ].map((row) => (
                                        <div key={row.q} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
                                            <div className="flex items-start gap-4">
                                                <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.06] bg-black/20 flex-shrink-0">
                                                    {row.icon}
                                                </div>
                                                <div>
                                                    <div className="text-white font-semibold">{row.q}</div>
                                                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{row.a}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </FadeIn>

                            <FadeIn delay={200}>
                                <div className="mt-8 rounded-2xl border border-white/[0.06] bg-[#0B1120]/55 p-8 backdrop-blur-xl">
                                    <div className="text-white font-bold text-lg">Ready?</div>
                                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                                        Start now, build one collection around a real initiative, and see how quickly your team can turn learning into action.
                                    </p>
                                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                        <Link
                                            href="/login?view=signup"
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4B8BB3] px-5 py-3 text-sm font-bold text-white hover:bg-white hover:text-[#0A0D12] transition-colors shadow-[0_0_20px_rgba(75,139,179,0.25)]"
                                        >
                                            Get Started <ArrowRight size={16} />
                                        </Link>
                                        <Link
                                            href="/demo"
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors"
                                        >
                                            Schedule a Demo <ArrowRight size={16} className="opacity-70" />
                                        </Link>
                                    </div>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
