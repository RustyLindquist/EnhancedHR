import type { Metadata } from 'next';
import Link from 'next/link';
import {
    ArrowRight,
    Award,
    BarChart3,
    BookOpen,
    Brain,
    Building2,
    Check,
    FolderOpen,
    Layers,
    Shield,
    Target,
    Users,
    Wrench,
    Zap,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import FadeIn from '@/components/marketing/FadeIn';
import HeroBackground from '@/components/marketing/HeroBackground';
import MarketingDivider from '@/components/marketing/MarketingDivider';
import HomeCtaButtons from '@/components/marketing/landing/HomeCtaButtons';

export const metadata: Metadata = {
    title: 'Features & Value -- EnhancedHR.ai',
    description:
        'A complete view of the EnhancedHR platform for HR teams: Academy, AI agents, collections, org tools, analytics, and recertification in one system.',
};

const featureCards = [
    {
        icon: <BookOpen size={20} className="text-[#4B8BB3]" />,
        title: 'Academy',
        body: 'Expert-led HR courses built for modern organizational reality, not generic LMS content.',
        href: '/academy',
    },
    {
        icon: <Brain size={20} className="text-[#78C0F0]" />,
        title: 'Five Specialized AI Agents',
        body: 'Course Assistant, Course Tutor, Prometheus, Collection Assistant, and Analytics Assistant.',
        href: '/platform',
    },
    {
        icon: <FolderOpen size={20} className="text-[#FF9300]" />,
        title: 'Collections',
        body: 'Turn scattered documents, notes, and learning assets into scoped AI-ready knowledge workspaces.',
        href: '/collections',
    },
    {
        icon: <Building2 size={20} className="text-[#4B8BB3]" />,
        title: 'Organization Layer',
        body: 'Custom groups, org courses, required learning, and centralized knowledge for teams.',
        href: '/organizations',
    },
    {
        icon: <Wrench size={20} className="text-[#FF2600]" />,
        title: 'AI Tools',
        body: 'Role disruption forecasting, roleplay practice, and specialized workflows for HR execution.',
        href: '/ai-tools',
    },
    {
        icon: <Award size={20} className="text-[#FF9300]" />,
        title: 'Recertification',
        body: 'SHRM/HRCI credit tracking and verifiable certificates embedded directly into the learning flow.',
        href: '/academy#recertification',
    },
];

const valueOutcomes = [
    {
        title: 'Faster Decision Cycles',
        body: 'Give leaders and HR teams immediate, context-grounded answers instead of document scavenger hunts.',
        icon: <Zap size={18} className="text-[#FF9300]" />,
    },
    {
        title: 'Higher Learning Transfer',
        body: 'Move from passive course watching to role-specific application through integrated AI tutoring and coaching.',
        icon: <Target size={18} className="text-[#4B8BB3]" />,
    },
    {
        title: 'Operational Consistency',
        body: 'Scale onboarding, policies, and playbooks with scoped AI so answers stay aligned with org reality.',
        icon: <Shield size={18} className="text-[#78C0F0]" />,
    },
    {
        title: 'Team Visibility',
        body: 'Use org analytics and required learning to understand engagement, progress, and where support is needed.',
        icon: <BarChart3 size={18} className="text-[#4B8BB3]" />,
    },
];

const rolloutSteps = [
    {
        step: '01',
        title: 'Activate Your Core Learning Stack',
        body: 'Launch Academy access and AI-assisted learning for leaders, managers, and critical functions.',
    },
    {
        step: '02',
        title: 'Load Your Organizational Context',
        body: 'Build collections for onboarding, policies, benefits, and operating playbooks your team needs daily.',
    },
    {
        step: '03',
        title: 'Assign, Measure, and Iterate',
        body: 'Use groups, required learning, and analytics to continuously improve adoption and capability lift.',
    },
];

const fitSignals = [
    '100-1000 employee organizations modernizing people operations',
    'HR and leadership teams navigating AI-driven change across roles',
    'Companies that need speed without compromising consistency and trust',
    'Teams that want one platform instead of fragmented LMS + docs + chat tools',
];

export default async function FeaturesValueLandingPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const ctaHref = user ? '/dashboard' : '/login?view=signup';
    const ctaLabel = user ? 'Go to Dashboard' : 'Start Free Trial';

    return (
        <div className="overflow-hidden">
            <section className="relative bg-[#0A0D12]">
                <HeroBackground />
                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-[200px] pb-[160px]">
                    <FadeIn className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-6">
                            <Layers size={12} /> FEATURES &amp; VALUE
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-8">
                            One Platform for
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">
                                Learning, Knowledge, and Execution
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 leading-relaxed mb-10 max-w-3xl mx-auto">
                            EnhancedHR combines expert learning, scoped AI, organizational knowledge systems, and analytics into a single operating surface for HR leaders and people teams.
                        </p>
                        <HomeCtaButtons ctaHref={ctaHref} ctaLabel={ctaLabel} />
                    </FadeIn>

                    <FadeIn delay={200}>
                        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
                            {[
                                '5 Specialized AI Agents',
                                'SHRM + HRCI Credits',
                                '$30 / user / month',
                                'Built for 100-1000 Employees',
                            ].map((item) => (
                                <div key={item} className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07] text-center text-xs font-medium text-slate-300">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            <section className="py-24 bg-[#0B1120]/40">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center max-w-3xl mx-auto mb-14">
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5">
                            What You Get in One System
                        </h2>
                        <p className="text-lg text-slate-400">
                            Every major capability you need to build workforce readiness and decision quality is already integrated.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {featureCards.map((card, index) => (
                            <FadeIn key={card.title} delay={index * 70}>
                                <Link
                                    href={card.href}
                                    className="group block h-full rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-4">
                                        {card.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                        {card.title}
                                        <ArrowRight size={15} className="text-slate-600 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all" />
                                    </h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{card.body}</p>
                                </Link>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <MarketingDivider />

            <section className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                        <div className="lg:col-span-4">
                            <FadeIn>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#4B8BB3] mb-3">
                                    Value Outcomes
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5">
                                    Why Teams Switch
                                </h2>
                                <p className="text-base text-slate-400 leading-relaxed">
                                    Most stacks split learning, knowledge, and execution across separate tools. EnhancedHR compresses that stack so teams can move with more speed and less friction.
                                </p>
                            </FadeIn>
                        </div>
                        <div className="lg:col-span-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {valueOutcomes.map((outcome, index) => (
                                    <FadeIn key={outcome.title} delay={index * 80}>
                                        <div className="h-full rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
                                            <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
                                                {outcome.icon}
                                            </div>
                                            <h3 className="text-white font-semibold mb-2">{outcome.title}</h3>
                                            <p className="text-sm text-slate-400 leading-relaxed">{outcome.body}</p>
                                        </div>
                                    </FadeIn>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            <section className="py-24 bg-[#0B1120]/40">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center max-w-3xl mx-auto mb-14">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-6">
                            <Target size={12} /> IMPLEMENTATION FLOW
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5">
                            Launch in Three Clear Moves
                        </h2>
                        <p className="text-lg text-slate-400">
                            Start with high-friction workflows first, then scale across teams as usage compounds.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {rolloutSteps.map((step, index) => (
                            <FadeIn key={step.step} delay={index * 90}>
                                <div className="h-full rounded-2xl border border-white/[0.07] bg-black/20 p-6">
                                    <div className="text-[#FF9300] text-xs font-bold tracking-[0.16em] mb-4">STEP {step.step}</div>
                                    <h3 className="text-white font-semibold mb-3 text-lg">{step.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{step.body}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <MarketingDivider />

            <section className="py-24">
                <div className="max-w-5xl mx-auto px-6">
                    <FadeIn className="text-center mb-10">
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5">
                            Best Fit for Teams in Active Change
                        </h2>
                        <p className="text-lg text-slate-400 max-w-3xl mx-auto">
                            This page is designed for HR leaders at organizations with 100-1000 employees who need faster capability-building across onboarding, policy, and manager enablement.
                        </p>
                    </FadeIn>
                    <FadeIn delay={120}>
                        <div className="rounded-3xl bg-[#0B1120]/70 border border-white/[0.08] p-8">
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {fitSignals.map((signal) => (
                                    <li key={signal} className="flex items-start gap-2.5 text-sm text-slate-300">
                                        <Check size={14} className="text-[#4B8BB3] mt-0.5 flex-shrink-0" />
                                        {signal}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            <section className="py-24 bg-[#0B1120]/40">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-slate-400 tracking-wide mb-6">
                            <Users size={12} /> READY TO DEPLOY
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            Build Capability. Not Tool Sprawl.
                        </h2>
                        <p className="text-lg text-slate-400 mb-10 leading-relaxed">
                            Use the same two paths from our home page: launch a free trial for hands-on evaluation, or schedule a demo for team rollout planning.
                        </p>
                        <HomeCtaButtons ctaHref={ctaHref} ctaLabel={ctaLabel} size="section" />
                    </FadeIn>
                </div>
            </section>
        </div>
    );
}
