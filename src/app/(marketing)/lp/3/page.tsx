import type { Metadata } from 'next';
import Link from 'next/link';
import {
    ArrowRight,
    BadgeCheck,
    BookOpen,
    Brain,
    CalendarClock,
    Check,
    Compass,
    Layers,
    Route,
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
    title: 'Human Velocity OS -- EnhancedHR.ai',
    description:
        'An original landing page concept for HR leaders: build a capability operating system that compounds team learning, decisions, and execution speed.',
};

const operatingLoops = [
    {
        title: 'Learn Loop',
        body: 'Expert-led courses plus AI tutoring turn static knowledge into role-specific understanding.',
        icon: <BookOpen size={18} className="text-[#4B8BB3]" />,
    },
    {
        title: 'Decide Loop',
        body: 'Scoped collections and agents deliver decision-grade context in the exact workflow where choices happen.',
        icon: <Compass size={18} className="text-[#FF9300]" />,
    },
    {
        title: 'Compound Loop',
        body: 'Insights captured from real usage improve future responses, onboarding speed, and team consistency.',
        icon: <Sparkles size={18} className="text-[#78C0F0]" />,
    },
];

const missionRooms = [
    {
        title: 'Onboarding Room',
        body: 'Courses, handbook, role expectations, and checklists in one AI-ready context workspace.',
        accent: '#4B8BB3',
    },
    {
        title: 'Manager Room',
        body: 'Coaching frameworks, difficult-conversation roleplays, and team-specific leadership playbooks.',
        accent: '#FF9300',
    },
    {
        title: 'Policy Room',
        body: 'Benefits, compliance, and operational policy guidance with grounded answers for everyday questions.',
        accent: '#78C0F0',
    },
    {
        title: 'AI Change Room',
        body: 'Role disruption forecasts, skills-gap analysis, and scenario planning for workforce evolution.',
        accent: '#FF2600',
    },
];

const launchSequence = [
    {
        label: 'Day 1-10',
        title: 'Install Your Foundation',
        points: ['Stand up core collections', 'Enable target groups', 'Publish first learning path'],
    },
    {
        label: 'Day 11-30',
        title: 'Run Real Workflows',
        points: ['Use roleplay and policy queries', 'Capture team insights', 'Tune context boundaries'],
    },
    {
        label: 'Day 31-60',
        title: 'Scale with Precision',
        points: ['Expand to additional teams', 'Add required learning tracks', 'Review analytics-driven priorities'],
    },
];

const capabilitySignals = [
    'A single system for learning + context + execution',
    'Built for HR leaders driving org-wide capability shifts',
    'Designed to scale across 100-1000 employee teams',
    'Grounded AI patterns that improve trust and adoption',
];

export default async function HumanVelocityLandingPage() {
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
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute top-0 right-[10%] w-[500px] h-[500px] bg-[#FF9300]/8 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-[5%] w-[460px] h-[380px] bg-[#4B8BB3]/10 rounded-full blur-[110px]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-[200px] pb-[160px]">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-7">
                            <FadeIn>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-medium text-slate-300 tracking-wide mb-6">
                                    <Workflow size={12} /> ORIGINAL CONCEPT: HUMAN VELOCITY OS
                                </div>
                                <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.04] mb-7">
                                    Build the Capability
                                    <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9300] via-[#FFD46B] to-[#78C0F0]">
                                        Operating System Your Org Lacks
                                    </span>
                                </h1>
                                <p className="text-lg md:text-xl text-slate-300/90 leading-relaxed mb-9 max-w-3xl">
                                    Most organizations have content. Few have an engine that converts it into aligned action at speed. EnhancedHR is that engine for HR and leadership teams.
                                </p>
                                <HomeCtaButtons ctaHref={ctaHref} ctaLabel={ctaLabel} />
                            </FadeIn>
                        </div>

                        <div className="lg:col-span-5">
                            <FadeIn direction="left" delay={150}>
                                <div className="relative rounded-3xl border border-white/[0.1] bg-black/30 p-6 backdrop-blur-xl">
                                    <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[#FF9300]/10 blur-[70px]" />
                                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF9300] mb-4">
                                        Decision Layer Snapshot
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Question-to-answer cycle', value: 'Compressed' },
                                            { label: 'Team context quality', value: 'Scoped + grounded' },
                                            { label: 'Onboarding readiness', value: 'Operationalized' },
                                            { label: 'Learning to execution gap', value: 'Closed by design' },
                                        ].map((row) => (
                                            <div key={row.label} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                                                <div className="text-sm text-slate-300">{row.label}</div>
                                                <div className="text-xs font-semibold text-white">{row.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            <section className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5">
                            Three Loops, One System
                        </h2>
                        <p className="text-lg text-slate-400">
                            The platform is designed as a closed-loop capability architecture: teams learn, decide, and improve in the same environment.
                        </p>
                    </FadeIn>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {operatingLoops.map((loop, index) => (
                            <FadeIn key={loop.title} delay={index * 90}>
                                <div className="h-full rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
                                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-4">
                                        {loop.icon}
                                    </div>
                                    <h3 className="text-white font-semibold mb-2">{loop.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{loop.body}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <MarketingDivider />

            <section className="py-24 bg-[#0B1120]/40">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                        <div className="lg:col-span-4">
                            <FadeIn>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#4B8BB3] mb-3">Mission Rooms</div>
                                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5">
                                    Build Around Work,
                                    <br />
                                    Not Around Files
                                </h2>
                                <p className="text-base text-slate-400 leading-relaxed">
                                    Each mission room is a scoped collection plus learning path plus assistant behavior model. This is where strategy turns into repeatable execution.
                                </p>
                            </FadeIn>
                        </div>
                        <div className="lg:col-span-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {missionRooms.map((room, index) => (
                                    <FadeIn key={room.title} delay={index * 80}>
                                        <div className="h-full rounded-2xl border border-white/[0.07] bg-black/20 p-6 relative overflow-hidden">
                                            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[55px]" style={{ backgroundColor: `${room.accent}18` }} />
                                            <h3 className="relative text-white font-semibold mb-3">{room.title}</h3>
                                            <p className="relative text-sm text-slate-400 leading-relaxed">{room.body}</p>
                                        </div>
                                    </FadeIn>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            <section className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center max-w-3xl mx-auto mb-14">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-6">
                            <CalendarClock size={12} /> 60-DAY LAUNCH SEQUENCE
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5">
                            A Practical Rollout Rhythm
                        </h2>
                        <p className="text-lg text-slate-400">
                            Structured enough for alignment, flexible enough for real organizational constraints.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {launchSequence.map((phase, index) => (
                            <FadeIn key={phase.label} delay={index * 90}>
                                <div className="h-full rounded-2xl border border-white/[0.07] bg-[#0B1120]/70 p-6">
                                    <div className="text-xs font-bold tracking-[0.16em] text-[#FF9300] mb-4">{phase.label}</div>
                                    <h3 className="text-white font-semibold mb-3">{phase.title}</h3>
                                    <ul className="space-y-2.5">
                                        {phase.points.map((point) => (
                                            <li key={point} className="flex items-start gap-2 text-sm text-slate-300">
                                                <Check size={13} className="text-[#4B8BB3] mt-0.5 flex-shrink-0" />
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <MarketingDivider />

            <section className="py-24 bg-[#0B1120]/40">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        <FadeIn>
                            <div className="rounded-3xl border border-white/[0.08] bg-black/25 p-8">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#78C0F0] mb-4">Capability Signals</div>
                                <ul className="space-y-3">
                                    {capabilitySignals.map((signal) => (
                                        <li key={signal} className="flex items-start gap-2.5 text-sm text-slate-300">
                                            <BadgeCheck size={14} className="text-[#78C0F0] mt-0.5 flex-shrink-0" />
                                            {signal}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-8">
                                    <Link
                                        href="/platform"
                                        className="inline-flex items-center gap-2 text-[#78C0F0] font-semibold text-sm hover:text-white transition-colors"
                                    >
                                        Explore Platform Details <ArrowRight size={15} />
                                    </Link>
                                </div>
                            </div>
                        </FadeIn>
                        <FadeIn delay={150}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { icon: <Layers size={16} className="text-[#4B8BB3]" />, title: 'Context Layer', body: 'Collections and scoped retrieval keep answers relevant.' },
                                    { icon: <Brain size={16} className="text-[#FF9300]" />, title: 'Intelligence Layer', body: 'Specialized agents support distinct decisions and roles.' },
                                    { icon: <Users size={16} className="text-[#78C0F0]" />, title: 'Org Layer', body: 'Groups and assignments distribute capability intentionally.' },
                                    { icon: <Route size={16} className="text-[#FF2600]" />, title: 'Execution Layer', body: 'Tools and roleplay workflows convert plans into action.' },
                                ].map((item) => (
                                    <div key={item.title} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
                                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3">
                                            {item.icon}
                                        </div>
                                        <h3 className="text-white font-semibold mb-2 text-sm">{item.title}</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">{item.body}</p>
                                    </div>
                                ))}
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            <section className="py-24">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-slate-400 tracking-wide mb-6">
                            <Target size={12} /> TAKE THE NEXT STEP
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            Turn Your Knowledge Stack into a Capability Engine
                        </h2>
                        <p className="text-lg text-slate-400 mb-10 leading-relaxed">
                            Start free to evaluate in-product, or schedule a demo to map rollout priorities with your team.
                        </p>
                        <HomeCtaButtons ctaHref={ctaHref} ctaLabel={ctaLabel} size="section" />
                    </FadeIn>
                </div>
            </section>
        </div>
    );
}
