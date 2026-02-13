import type { Metadata } from 'next';
import {
    AlertTriangle,
    BookOpen,
    Brain,
    Check,
    FolderOpen,
    Layers,
    LineChart,
    Shield,
    Sparkles,
    Target,
    Users,
    Workflow,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import FadeIn from '@/components/marketing/FadeIn';
import HeroBackground from '@/components/marketing/HeroBackground';
import MarketingDivider from '@/components/marketing/MarketingDivider';
import HomeCtaButtons from '@/components/marketing/landing/HomeCtaButtons';

export const metadata: Metadata = {
    title: 'Decision Velocity Narrative -- EnhancedHR.ai',
    description:
        'A challenger-style narrative for HR leaders: why AI is table stakes, where the context gap breaks execution, and how to build decision velocity.',
};

const oldPlaybook = [
    {
        title: 'AI Becomes Commodity Fast',
        body: 'Most competitors can replicate AI capabilities quickly. Tool access alone is not a durable moat.',
        icon: <Sparkles size={18} className="text-[#FF9300]" />,
    },
    {
        title: 'Knowledge Stays Fragmented',
        body: 'Policies, docs, learning, and conversations live in separate systems, slowing decisions and execution.',
        icon: <Layers size={18} className="text-[#4B8BB3]" />,
    },
    {
        title: 'Unscoped AI Adds Noise',
        body: 'Without clear context boundaries, answers drift, trust erodes, and teams hesitate at the moment of need.',
        icon: <AlertTriangle size={18} className="text-[#FF2600]" />,
    },
];

const compositeNarrative = [
    {
        title: '1. Reframe the Objective',
        body: 'Stop optimizing for AI adoption metrics. Optimize for organizational decision velocity and quality.',
    },
    {
        title: '2. Convert Content into Context',
        body: 'Transform files and courses into scoped repositories that are queryable, reusable, and role-relevant.',
    },
    {
        title: '3. Operationalize Application',
        body: 'Pair learning with assistants and tutors so teams can apply knowledge in live workflows, not after the fact.',
    },
    {
        title: '4. Compound Insight Over Time',
        body: 'Capture and retain useful insights so every team interaction improves future decision speed and alignment.',
    },
];

const systemComponents = [
    {
        title: 'Scoped Collections',
        body: 'Personal, team, and org workspaces that keep AI context grounded to the right source set.',
        icon: <FolderOpen size={18} className="text-[#FF9300]" />,
    },
    {
        title: 'Assigned Learning Paths',
        body: 'Use groups and required learning to deploy capability deliberately across managers and employees.',
        icon: <Users size={18} className="text-[#4B8BB3]" />,
    },
    {
        title: 'Application Agents',
        body: 'Course Assistant, Tutor, Prometheus, Collection Assistant, and Analytics Assistant each solve distinct jobs.',
        icon: <Brain size={18} className="text-[#78C0F0]" />,
    },
    {
        title: 'Measured Feedback Loop',
        body: 'Track engagement and usage patterns, then adjust content, workflows, and rollout priorities.',
        icon: <LineChart size={18} className="text-[#4B8BB3]" />,
    },
];

const pilotPlan = [
    'Pick two teams with high knowledge friction (example: HRBP + managers).',
    'Create three scoped repositories (onboarding, policy, team enablement).',
    'Load 20-50 critical artifacts and assign one focused learning path.',
    'Measure time-to-answer, repeat-question volume, and ramp confidence over 14 days.',
];

export default async function ChallengerNarrativeLandingPage() {
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
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-6">
                            <Workflow size={12} /> CHALLENGER NARRATIVE
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-8">
                            AI Is Table Stakes.
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9300] via-[#FF5F1F] to-[#78C0F0]">
                                Decision Velocity Is the Advantage.
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 leading-relaxed mb-10 max-w-3xl mx-auto">
                            For HR leaders in 100-1000 employee organizations, the real challenge is not adding another AI tool. It is building a reliable system that turns knowledge into decisions faster, with less variance.
                        </p>
                        <HomeCtaButtons ctaHref={ctaHref} ctaLabel={ctaLabel} />
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            <section className="py-24 bg-[#0B1120]/40">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center max-w-3xl mx-auto mb-14">
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5">
                            Why the Old Playbook Breaks
                        </h2>
                        <p className="text-lg text-slate-400">
                            Most organizations are not failing from lack of information. They are failing from fragmented context and unstructured AI adoption.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {oldPlaybook.map((item, index) => (
                            <FadeIn key={item.title} delay={index * 90}>
                                <div className="h-full rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
                                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-4">
                                        {item.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{item.body}</p>
                                </div>
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
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#FF9300] mb-3">
                                    Composite Challenger Choreography
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5">
                                    The Unified Narrative
                                </h2>
                                <p className="text-base text-slate-400 leading-relaxed">
                                    Synthesized from all narrative options in `docs/marketing/narrative`: your durable moat is human capability expressed as faster, higher-quality decisions.
                                </p>
                            </FadeIn>
                        </div>
                        <div className="lg:col-span-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {compositeNarrative.map((item, index) => (
                                    <FadeIn key={item.title} delay={index * 80}>
                                        <div className="h-full rounded-2xl border border-white/[0.07] bg-black/20 p-6">
                                            <h3 className="text-white font-semibold mb-3">{item.title}</h3>
                                            <p className="text-sm text-slate-400 leading-relaxed">{item.body}</p>
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
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-6">
                            <BookOpen size={12} /> THE NEW SYSTEM
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5">
                            From Content Storage to Capability Operations
                        </h2>
                        <p className="text-lg text-slate-400">
                            EnhancedHR operationalizes the narrative through one integrated system purpose-built for HR and leadership execution.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {systemComponents.map((component, index) => (
                            <FadeIn key={component.title} delay={index * 80}>
                                <div className="h-full rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
                                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
                                        {component.icon}
                                    </div>
                                    <h3 className="text-white font-semibold mb-2">{component.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{component.body}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <MarketingDivider />

            <section className="py-24">
                <div className="max-w-5xl mx-auto px-6">
                    <FadeIn className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-6">
                            <Target size={12} /> PILOT STRUCTURE
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5">
                            Prove Decision Velocity in 14 Days
                        </h2>
                        <p className="text-lg text-slate-400 max-w-3xl mx-auto">
                            Run a constrained pilot that is easy to approve, easy to evaluate, and tied directly to execution outcomes.
                        </p>
                    </FadeIn>
                    <FadeIn delay={120}>
                        <div className="rounded-3xl bg-[#0B1120]/70 border border-white/[0.08] p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {pilotPlan.map((line) => (
                                    <div key={line} className="flex items-start gap-2.5 text-sm text-slate-300">
                                        <Check size={14} className="text-[#4B8BB3] mt-0.5 flex-shrink-0" />
                                        {line}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-7 rounded-xl border border-[#4B8BB3]/20 bg-[#4B8BB3]/8 p-4 text-sm text-slate-300">
                                Success criteria: lower time-to-answer, fewer repeated questions, stronger onboarding confidence, and clearer manager guidance.
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            <section className="py-24 bg-[#0B1120]/40">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-slate-400 tracking-wide mb-6">
                            <Shield size={12} /> SPEED WITH TRUST
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            Build a Faster, More Aligned Organization
                        </h2>
                        <p className="text-lg text-slate-400 mb-10 leading-relaxed">
                            Use the same two home-page CTAs to choose your path: start hands-on now, or book a guided rollout conversation for your team.
                        </p>
                        <HomeCtaButtons ctaHref={ctaHref} ctaLabel={ctaLabel} size="section" />
                    </FadeIn>
                </div>
            </section>
        </div>
    );
}
