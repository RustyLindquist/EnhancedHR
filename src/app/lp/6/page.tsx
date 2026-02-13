import type { Metadata } from 'next';
import Link from 'next/link';
import {
    ArrowRight,
    Brain,
    BookOpen,
    Users,
    BarChart3,
    MessageCircle,
    Sparkles,
    Shield,
    Clock,
    Layers,
    Compass,
    Zap,
    Target,
    GraduationCap,
    FolderOpen,
    Award,
    Check,

    Lightbulb,
    HeartHandshake,
    TrendingUp,
} from 'lucide-react';

import FadeIn from '@/components/marketing/FadeIn';
import HeroBackground from '@/components/marketing/HeroBackground';
import MarketingDivider from '@/components/marketing/MarketingDivider';
import TrustBar from '@/components/landing/TrustBar';
import LandingCTA from '@/components/landing/LandingCTA';

export const metadata: Metadata = {
    title: 'EnhancedHR.ai — You Carry the Weight. Now Carry It Further.',
    description:
        'The AI-native professional development platform built for the HR leaders who hold it all together. 5 AI agents. Expert-led courses. Recertification credits. Start your free trial.',
};

/* ═══════════════════════════════════════════════════════
   SECTION 1 — HERO: "The Weight"
   Identity-first opening. No product. No features.
   Just the truth of who they are.
   ═══════════════════════════════════════════════════════ */

function HeroSection() {
    return (
        <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-[#0A0D12]">
            <HeroBackground />

            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-[120px] pb-20">
                <div className="max-w-4xl mx-auto text-center">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] mb-8">
                            <HeartHandshake size={14} />
                            For the ones who hold it all together
                        </div>
                    </FadeIn>

                    <FadeIn delay={100}>
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-8">
                            <span className="text-white">You carry the weight</span>
                            <br />
                            <span className="text-white">of every person</span>
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">
                                in your organization.
                            </span>
                        </h1>
                    </FadeIn>

                    <FadeIn delay={220}>
                        <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-12">
                            The layoffs nobody sees coming. The culture nobody else is measuring.
                            The compliance deadlines. The manager who needs coaching. The AI strategy
                            the board just added to your plate.
                            <span className="block mt-4 text-slate-300 font-medium">
                                It&apos;s time someone built something for you.
                            </span>
                        </p>
                    </FadeIn>

                    <FadeIn delay={340}>
                        <LandingCTA variant="large" />
                    </FadeIn>

                    <FadeIn delay={420}>
                        <div className="mt-10">
                            <TrustBar />
                        </div>
                    </FadeIn>
                </div>
            </div>

            {/* Bottom fade */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent via-[#0A0D12]/70 to-[#0A0D12]" />
        </section>
    );
}

/* ═══════════════════════════════════════════════════════
   SECTION 2 — THE WEIGHT: Empathy / Recognition
   Name every invisible thing they carry.
   ═══════════════════════════════════════════════════════ */

const weightItems = [
    {
        icon: <Users size={20} />,
        label: 'The people strategy',
        detail: 'that nobody outside HR understands the complexity of',
        color: '#4B8BB3',
    },
    {
        icon: <Shield size={20} />,
        label: 'The compliance burden',
        detail: 'that grows heavier with every new regulation and every new state',
        color: '#FF9300',
    },
    {
        icon: <Brain size={20} />,
        label: 'The AI question',
        detail: "that leadership expects you to answer even though you're still figuring it out too",
        color: '#78C0F0',
    },
    {
        icon: <TrendingUp size={20} />,
        label: 'The skills gap',
        detail: "that widens faster than any training program you've seen can close",
        color: '#FF2600',
    },
    {
        icon: <MessageCircle size={20} />,
        label: 'The difficult conversations',
        detail: 'that you rehearse alone in your car before walking into the office',
        color: '#4B8BB3',
    },
    {
        icon: <Clock size={20} />,
        label: 'The recertification hours',
        detail: 'you squeeze in between putting out fires because your own growth matters too',
        color: '#FF9300',
    },
];

function WeightSection() {
    return (
        <section className="py-28 relative">
            {/* Background glow */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#4B8BB3]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] mb-6">
                            <Compass size={14} />
                            We see what you carry
                        </div>
                    </FadeIn>

                    <FadeIn delay={80}>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                            Nobody talks about
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9300] to-[#FF2600]">
                                how much you carry alone.
                            </span>
                        </h2>
                    </FadeIn>

                    <FadeIn delay={160}>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            HR leaders don&apos;t get the luxury of a single focus. You&apos;re the
                            strategist, the counselor, the compliance officer, the culture architect,
                            and the AI translator&mdash;often in the same afternoon.
                        </p>
                    </FadeIn>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {weightItems.map((item, i) => (
                        <FadeIn key={i} delay={i * 80}>
                            <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full group hover:border-white/[0.12] transition-colors">
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                                    style={{ backgroundColor: `${item.color}15`, color: item.color }}
                                >
                                    {item.icon}
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{item.label}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{item.detail}</p>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                <FadeIn delay={500}>
                    <div className="mt-16 max-w-2xl mx-auto text-center">
                        <p className="text-xl sm:text-2xl text-slate-300 font-medium leading-relaxed">
                            Most platforms see HR as an admin function to automate.
                            <br />
                            <span className="text-white">
                                We see the most critical leadership role in the age of AI.
                            </span>
                        </p>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════
   SECTION 3 — THE SHIFT: Philosophy / Reframe
   From Human Resources to Human Relevance
   ═══════════════════════════════════════════════════════ */

function ShiftSection() {
    return (
        <section className="py-28 bg-[#0B1120]/40 relative">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4B8BB3]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left — The philosophy */}
                    <div>
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] mb-6">
                                <Lightbulb size={14} />
                                The bigger idea
                            </div>
                        </FadeIn>

                        <FadeIn delay={80}>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                                From Human Resources
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">
                                    to Human Relevance.
                                </span>
                            </h2>
                        </FadeIn>

                        <FadeIn delay={160}>
                            <div className="space-y-5 text-slate-400 text-base leading-relaxed">
                                <p>
                                    Every wave of technology has tried to reduce HR to a system of
                                    record. Automate the forms. Digitize the filing cabinet. Replace
                                    the human judgment with a workflow.
                                </p>
                                <p>
                                    AI could do the same thing&mdash;or it could do the opposite.
                                </p>
                                <p className="text-slate-300 font-medium">
                                    EnhancedHR was built on a single conviction: AI should amplify the
                                    human side of work, not automate it away. Your judgment, your
                                    empathy, your ability to see around corners for people&mdash;those
                                    aren&apos;t bugs in the system. They&apos;re the whole point.
                                </p>
                            </div>
                        </FadeIn>
                    </div>

                    {/* Right — The contrast */}
                    <FadeIn delay={240} direction="left">
                        <div className="space-y-4">
                            {/* Before card */}
                            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
                                    The old model
                                </div>
                                <ul className="space-y-3">
                                    {[
                                        'Generic courses built for compliance checkboxes',
                                        'Learning that ends when the video stops',
                                        'Knowledge trapped in individual silos',
                                        'Credits you track in spreadsheets',
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-500 text-sm">
                                            <div className="w-5 h-5 rounded-full bg-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* After card */}
                            <div className="p-6 rounded-2xl bg-[#4B8BB3]/5 border border-[#4B8BB3]/20">
                                <div className="text-xs font-medium text-[#4B8BB3] uppercase tracking-wider mb-4">
                                    The EnhancedHR model
                                </div>
                                <ul className="space-y-3">
                                    {[
                                        'Expert-led courses with AI that coaches you through every concept',
                                        'Learning that follows you into your real work',
                                        'Knowledge workspaces your whole team can think inside',
                                        'Credits tracked automatically, audit-proof, always current',
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                                            <div className="w-5 h-5 rounded-full bg-[#4B8BB3]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Check size={12} className="text-[#4B8BB3]" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════
   SECTION 4 — THE PLATFORM: What You Get
   Product through the lens of relief & power
   ═══════════════════════════════════════════════════════ */

const platformPillars = [
    {
        icon: <GraduationCap size={22} />,
        title: 'Academy',
        subtitle: 'Learn with AI at your side',
        description:
            'Expert-led courses built for HR professionals. Every course comes with two AI companions: a Course Assistant for instant answers and a Course Tutor that coaches you through complex concepts using Socratic method.',
        color: '#4B8BB3',
        features: ['Expert-designed curriculum', 'AI-powered Q&A', 'Socratic coaching', 'SHRM & HRCI credits'],
    },
    {
        icon: <FolderOpen size={22} />,
        title: 'Collections',
        subtitle: 'Your knowledge, unified',
        description:
            'Portable, AI-powered knowledge workspaces. Add courses, documents, notes, videos from anywhere, then ask the AI to synthesize across everything. Build the knowledge base you wish you had on day one.',
        color: '#78C0F0',
        features: ['Multi-source synthesis', 'Team knowledge sharing', 'AI-powered search', 'Portable workspaces'],
    },
    {
        icon: <Users size={22} />,
        title: 'Org Tools',
        subtitle: 'Scale what works',
        description:
            'Employee groups, org-specific course tracks, shared knowledge collections, and a real analytics dashboard. See what your team is learning, where the gaps are, and how engagement trends over time.',
        color: '#FF9300',
        features: ['Employee groups', 'Custom course tracks', 'Org knowledge base', 'Analytics dashboard'],
    },
    {
        icon: <Zap size={22} />,
        title: 'AI Tools',
        subtitle: 'Practice and predict',
        description:
            'RolePlay Dojo lets you rehearse difficult conversations with AI before having them for real. Role Disruption Forecasting shows which roles AI will affect. Skills Gap Analysis maps your team\'s readiness.',
        color: '#FF2600',
        features: ['RolePlay Dojo', 'Disruption forecasting', 'Skills gap analysis', 'Scenario simulation'],
    },
];

function PlatformSection() {
    return (
        <section className="py-28 relative">
            {/* Background glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#4B8BB3]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] mb-6">
                            <Layers size={14} />
                            The platform
                        </div>
                    </FadeIn>

                    <FadeIn delay={80}>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                            Everything you need.
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">
                                Nothing you don&apos;t.
                            </span>
                        </h2>
                    </FadeIn>

                    <FadeIn delay={160}>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Four pillars, one platform. Built by people who understand that HR professionals
                            don&apos;t need another tool to manage&mdash;they need a partner that makes them
                            more effective.
                        </p>
                    </FadeIn>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {platformPillars.map((pillar, i) => (
                        <FadeIn key={i} delay={i * 100}>
                            <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full group hover:border-white/[0.12] transition-colors">
                                <div className="flex items-start gap-5 mb-5">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: `${pillar.color}15`, color: pillar.color }}
                                    >
                                        {pillar.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{pillar.title}</h3>
                                        <p className="text-sm text-slate-500">{pillar.subtitle}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed mb-5">
                                    {pillar.description}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {pillar.features.map((f, j) => (
                                        <span
                                            key={j}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                                            style={{
                                                backgroundColor: `${pillar.color}10`,
                                                color: pillar.color,
                                                border: `1px solid ${pillar.color}20`,
                                            }}
                                        >
                                            <Check size={10} />
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                {/* Recertification callout */}
                <FadeIn delay={500}>
                    <div className="mt-8 p-6 rounded-2xl bg-[#FF9300]/5 border border-[#FF9300]/20 flex flex-col sm:flex-row items-center gap-6">
                        <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: '#FF930015', color: '#FF9300' }}
                        >
                            <Award size={26} />
                        </div>
                        <div className="text-center sm:text-left">
                            <h3 className="text-lg font-bold text-white mb-1">
                                Recertification, handled.
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Automatic SHRM PDC and HRCI credit tracking. Audit-proof ledger.
                                Instant certificates. Never chase down a credit again.
                            </p>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════
   SECTION 5 — THE INTELLIGENCE LAYER: AI Agents
   Show the depth of the AI — scoped, contextual, personal
   ═══════════════════════════════════════════════════════ */

const agents = [
    {
        name: 'Course Assistant',
        scope: 'Per course',
        description: 'Instant answers about course material. Ask anything, get contextual responses grounded in the course content.',
        icon: <BookOpen size={18} />,
        color: '#4B8BB3',
    },
    {
        name: 'Course Tutor',
        scope: 'Per course',
        description: "Doesn't just answer — coaches. Uses Socratic method to help you truly internalize concepts, not just memorize them.",
        icon: <GraduationCap size={18} />,
        color: '#78C0F0',
    },
    {
        name: 'Prometheus',
        scope: 'Platform-wide',
        description: 'Your personal AI advisor across the entire platform. Remembers your context, your goals, your learning history.',
        icon: <Sparkles size={18} />,
        color: '#FF9300',
    },
    {
        name: 'Collection Assistant',
        scope: 'Per collection',
        description: 'Synthesizes across every resource in a collection — courses, docs, notes, videos. Ask it to connect dots you couldn\'t see alone.',
        icon: <FolderOpen size={18} />,
        color: '#4B8BB3',
    },
    {
        name: 'Analytics Assistant',
        scope: 'Organization',
        description: 'Natural language analytics for org admins. Ask about engagement, completion, skill gaps — get answers, not dashboards.',
        icon: <BarChart3 size={18} />,
        color: '#FF2600',
    },
];

function IntelligenceSection() {
    return (
        <section className="py-28 bg-[#0B1120]/40 relative">
            {/* Background glows */}
            <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#FF9300]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#4B8BB3]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-start">
                    {/* Left — Concept + Chat Mockup */}
                    <div>
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] mb-6">
                                <Brain size={14} />
                                The intelligence layer
                            </div>
                        </FadeIn>

                        <FadeIn delay={80}>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                                Five AI agents.
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9300] to-[#FF2600]">
                                    Zero hallucination risk.
                                </span>
                            </h2>
                        </FadeIn>

                        <FadeIn delay={160}>
                            <p className="text-slate-400 text-lg leading-relaxed mb-8">
                                Every agent is scoped to its context. The Course Assistant only knows
                                your course material. The Collection Assistant only sees your collection.
                                Prometheus knows you across the entire platform. Precise context means
                                precise answers.
                            </p>
                        </FadeIn>

                        {/* Chat mockup */}
                        <FadeIn delay={240}>
                            <div className="rounded-2xl bg-[#0A0D12] border border-white/[0.08] overflow-hidden">
                                {/* Chat header */}
                                <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#FF9300]/15 flex items-center justify-center">
                                        <Sparkles size={14} className="text-[#FF9300]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">Prometheus</p>
                                        <p className="text-xs text-slate-500">Platform-wide AI</p>
                                    </div>
                                </div>
                                {/* Messages */}
                                <div className="p-5 space-y-4">
                                    {/* User message */}
                                    <div className="flex justify-end">
                                        <div className="px-4 py-3 rounded-2xl rounded-br-md bg-white/[0.04] max-w-[85%]">
                                            <p className="text-sm text-slate-300">
                                                I need to build a business case for upskilling our
                                                managers on AI. What have I learned across my courses
                                                that I can use?
                                            </p>
                                        </div>
                                    </div>
                                    {/* AI response */}
                                    <div className="flex justify-start">
                                        <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 max-w-[85%]">
                                            <p className="text-sm text-slate-300 leading-relaxed">
                                                Based on your completed courses and collection notes,
                                                here are three data points for your business case:
                                                the ROI framework from &quot;Strategic HR Analytics,&quot;
                                                the change management model from &quot;Leading Through
                                                Disruption,&quot; and the skills taxonomy you built in
                                                your &quot;AI Readiness&quot; collection&hellip;
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                    {/* Right — Agent cards */}
                    <div className="space-y-4">
                        {agents.map((agent, i) => (
                            <FadeIn key={i} delay={i * 80} direction="left">
                                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-4 group hover:border-white/[0.12] transition-colors">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: `${agent.color}15`, color: agent.color }}
                                    >
                                        {agent.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-base font-bold text-white">{agent.name}</h3>
                                            <span
                                                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                                style={{
                                                    backgroundColor: `${agent.color}15`,
                                                    color: agent.color,
                                                    border: `1px solid ${agent.color}25`,
                                                }}
                                            >
                                                {agent.scope}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            {agent.description}
                                        </p>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}

                        <FadeIn delay={agents.length * 80 + 80} direction="left">
                            <div className="p-5 rounded-2xl bg-[#4B8BB3]/5 border border-[#4B8BB3]/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <Target size={16} className="text-[#4B8BB3]" />
                                    <span className="text-sm font-semibold text-[#4B8BB3]">Context is everything</span>
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Each agent only accesses what it should. No data leaks between courses.
                                    No hallucination from unrelated content. Just precise, grounded intelligence
                                    scoped to exactly what you&apos;re working on.
                                </p>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════
   SECTION 6 — GET STARTED: Pricing + Final CTA
   Emotional close. You've carried enough alone.
   ═══════════════════════════════════════════════════════ */

const pricingPlans = [
    {
        name: 'Individual',
        price: '$30',
        period: '/month',
        description: 'For the HR professional who invests in their own growth.',
        features: [
            'Full course academy access',
            'AI Course Assistant & Tutor',
            'Prometheus personal AI',
            'Unlimited Collections',
            'AI Tools (RolePlay Dojo, Forecasting)',
            'SHRM & HRCI credit tracking',
            'Instant certificates',
        ],
        featured: false,
    },
    {
        name: 'Organization',
        price: '$30',
        period: '/user/month',
        description: 'For HR teams that want to elevate their entire department.',
        features: [
            'Everything in Individual',
            'Employee groups & management',
            'Org-specific course tracks',
            'Shared knowledge collections',
            'Analytics dashboard',
            'Analytics Assistant AI',
            'Team engagement insights',
        ],
        featured: true,
    },
];

function GetStartedSection() {
    return (
        <section className="py-28 relative">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#4B8BB3]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6">
                {/* Emotional close */}
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] mb-6">
                            <Sparkles size={14} />
                            Start in under 2 minutes
                        </div>
                    </FadeIn>

                    <FadeIn delay={80}>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                            You&apos;ve carried enough
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">
                                on your own.
                            </span>
                        </h2>
                    </FadeIn>

                    <FadeIn delay={160}>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Seven days free. No credit card required. Cancel anytime.
                            <br />
                            The only risk is staying where you are.
                        </p>
                    </FadeIn>
                </div>

                {/* Pricing cards */}
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
                    {pricingPlans.map((plan, i) => (
                        <FadeIn key={i} delay={i * 100}>
                            <div
                                className={`p-8 rounded-2xl h-full relative ${
                                    plan.featured
                                        ? 'bg-[#4B8BB3]/5 border border-[#4B8BB3]/20'
                                        : 'bg-white/[0.02] border border-white/[0.06]'
                                }`}
                            >
                                {plan.featured && (
                                    <div className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-[#4B8BB3] text-white text-xs font-bold">
                                        Popular
                                    </div>
                                )}
                                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                                <p className="text-sm text-slate-500 mb-5">{plan.description}</p>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                                    <span className="text-slate-500 text-sm">{plan.period}</span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((f, j) => (
                                        <li key={j} className="flex items-center gap-3 text-sm text-slate-300">
                                            <Check size={14} className="text-[#4B8BB3] flex-shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/login?view=signup"
                                    className={`w-full flex items-center justify-center gap-2 rounded-full font-bold py-3.5 transition-all hover:-translate-y-0.5 ${
                                        plan.featured
                                            ? 'bg-[#4B8BB3] text-white hover:bg-[#5a9bc3] shadow-[0_0_30px_rgba(75,139,179,0.3)] hover:shadow-[0_0_50px_rgba(75,139,179,0.5)]'
                                            : 'bg-white/[0.04] text-white border border-white/[0.08] hover:bg-white/[0.08]'
                                    }`}
                                >
                                    Start Free Trial
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                {/* Trust signals */}
                <FadeIn delay={300}>
                    <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500 mb-12">
                        <div className="flex items-center gap-2">
                            <Shield size={16} className="text-[#4B8BB3]" />
                            <span>7-day free trial</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-[#4B8BB3]" />
                            <span>Setup in under 2 minutes</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Award size={16} className="text-[#FF9300]" />
                            <span>SHRM & HRCI approved</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-[#4B8BB3]" />
                            <span>No credit card required</span>
                        </div>
                    </div>
                </FadeIn>

                {/* Final emotional note */}
                <FadeIn delay={400}>
                    <div className="max-w-2xl mx-auto text-center">
                        <p className="text-slate-500 text-base leading-relaxed">
                            You chose this profession because you believe in people.
                            <br />
                            <span className="text-slate-300">
                                We built this platform because we believe in you.
                            </span>
                        </p>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════
   PAGE ASSEMBLY
   ═══════════════════════════════════════════════════════ */

export default function OriginalLandingPage() {
    return (
        <>
            <HeroSection />
            <MarketingDivider />

            <WeightSection />

            {/* CTA after emotional close */}
            <section className="py-16 relative">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <FadeIn>
                        <p className="text-lg text-slate-400 mb-8">
                            A platform built for what you actually do.
                        </p>
                        <LandingCTA />
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            <ShiftSection />
            <MarketingDivider />

            <PlatformSection />
            <MarketingDivider />

            <IntelligenceSection />
            <MarketingDivider />

            <GetStartedSection />
        </>
    );
}
