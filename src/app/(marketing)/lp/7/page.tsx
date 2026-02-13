import type { Metadata } from 'next';
import Link from 'next/link';
import {
    ArrowRight, Check, BookOpen, Brain, Users,
    Building2, Award, MessageSquare,
    GraduationCap, Layers, BarChart3, Sparkles,
    FolderOpen, Bot, Target, Zap, Shield, Wrench,
} from 'lucide-react';
import FadeIn from '@/components/marketing/FadeIn';
import HeroBackground from '@/components/marketing/HeroBackground';
import MarketingDivider from '@/components/marketing/MarketingDivider';
import TrustBar from '@/components/landing/TrustBar';
import LandingCTA from '@/components/landing/LandingCTA';

export const metadata: Metadata = {
    title: 'AI-Native HR Learning Platform for 100-1000 Employee Teams | EnhancedHR.ai',
    description: 'Expert-led courses, 5 scoped AI agents, knowledge collections, and automatic SHRM & HRCI recertification. Built for HR leaders at growing organizations.',
};

const platformPillars = [
    {
        icon: <BookOpen size={20} />,
        title: 'Academy',
        body: 'Expert-led courses built for modern HR realities. Video modules, quizzes, and downloadable resources from practitioners who have done the work.',
        color: '#4B8BB3',
        href: '/academy',
    },
    {
        icon: <Brain size={20} />,
        title: 'AI Intelligence',
        body: 'Five specialized agents woven into every layer. Not a chatbot add-on \u2014 intelligence that understands your courses, collections, and role.',
        color: '#78C0F0',
        href: '/platform',
    },
    {
        icon: <FolderOpen size={20} />,
        title: 'Collections',
        body: 'AI-powered knowledge workspaces where you combine courses, notes, files, and videos into a single context, then ask anything.',
        color: '#FF9300',
        href: '/collections',
    },
    {
        icon: <Building2 size={20} />,
        title: 'Organization Layer',
        body: 'Custom groups, org-specific courses, centralized knowledge bases, and analytics. Deploy learning with the controls you actually need.',
        color: '#4B8BB3',
        href: '/organizations',
    },
    {
        icon: <Wrench size={20} />,
        title: 'AI Tools',
        body: 'Purpose-built tools for HR: RolePlay Dojo for difficult conversations, Disruption Forecasting for AI impact, Skills Gap Analysis for workforce planning.',
        color: '#FF2600',
        href: '/ai-tools',
    },
    {
        icon: <Award size={20} />,
        title: 'Recertification',
        body: 'Automatic SHRM PDC and HRCI credit tracking from the moment you start watching. Audit-proof certificates generated instantly upon completion.',
        color: '#FF9300',
        href: '/academy',
    },
];

const aiAgents = [
    { name: 'Course Assistant', desc: 'Instant, cited answers from any course. Your on-demand research librarian.', icon: <MessageSquare size={16} />, color: '#4B8BB3' },
    { name: 'Course Tutor', desc: 'Socratic coaching adapted to your role, experience, and goals.', icon: <GraduationCap size={16} />, color: '#FF9300' },
    { name: 'Platform Assistant', desc: 'Cross-platform intelligence trained on the entire content library.', icon: <Brain size={16} />, color: '#78C0F0' },
    { name: 'Collection Assistant', desc: 'Personal knowledge brain trained on everything you curate.', icon: <FolderOpen size={16} />, color: '#4B8BB3' },
    { name: 'Analytics Assistant', desc: 'Org-level insights on learning patterns, engagement, and ROI.', icon: <BarChart3 size={16} />, color: '#FF9300' },
];

const valueOutcomes = [
    {
        title: 'Faster Decision Cycles',
        body: 'Context-grounded answers in seconds, not document scavenger hunts. Teams that switch report 60% faster time-to-answer on HR questions.',
        icon: <Zap size={20} />,
        color: '#FF9300',
    },
    {
        title: 'Higher Learning Transfer',
        body: 'Move from passive watching to role-specific application through AI tutoring. Learners complete 3x more practice scenarios than traditional LMS.',
        icon: <Target size={20} />,
        color: '#4B8BB3',
    },
    {
        title: 'Operational Consistency',
        body: 'Scale onboarding, policies, and playbooks with scoped AI so answers stay aligned with your org reality. One source of truth, always current.',
        icon: <Shield size={20} />,
        color: '#78C0F0',
    },
    {
        title: 'Team Visibility',
        body: 'Understand engagement, progress, and where support is needed. Required learning, completion tracking, and AI-powered analytics in one view.',
        icon: <BarChart3 size={20} />,
        color: '#4B8BB3',
    },
];

const fitSignals = [
    '100\u20131,000 employee organizations modernizing people operations',
    'HR and leadership teams navigating AI-driven change across roles',
    'Companies that need speed without compromising consistency or trust',
    'Teams replacing fragmented LMS + docs + chat tool stacks with one platform',
    'Organizations investing in manager enablement and onboarding excellence',
    'HR leaders who want AI that understands their context, not generic answers',
];

const recertItems = [
    'Automatic SHRM PDC and HRCI credit calculation',
    'Instant certificate generation on completion',
    'Audit-proof ledger of your entire learning history',
    'Multi-session tracking \u2014 pick up where you left off',
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

const individualFeatures = [
    'Unlimited access to all Academy courses',
    'All 5 AI agents (Tutor, Assistant, Prometheus, Collection, Analytics)',
    'SHRM & HRCI automatic credit tracking',
    'Personal collections & knowledge management',
    'AI Tools (RolePlay Dojo, Disruption Forecasting, more)',
];

const orgFeatures = [
    'Everything in the Individual plan',
    'Custom employee groups and segments',
    'Build and host org-specific courses',
    'Organizational knowledge collections',
    'Required learning assignments',
    'Analytics dashboard with AI insights',
];

export default function LP7FeaturesValuePage() {
    return (
        <div className="overflow-hidden">

            {/* ── HERO ── */}
            <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-[#0A0D12]">
                <HeroBackground />

                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-[120px] pb-20">
                    <div className="text-center max-w-4xl mx-auto">
                        <FadeIn delay={150}>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-8">
                                <Sparkles size={12} /> Built for 100&ndash;1,000 Employee Teams &middot; SHRM &amp; HRCI Approved
                            </div>
                        </FadeIn>

                        <FadeIn delay={200}>
                            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-6 leading-[1.05]">
                                Learn Faster.
                                <br />
                                Know More.
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">
                                    Stay Certified.
                                </span>
                            </h1>
                        </FadeIn>

                        <FadeIn delay={300}>
                            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                                Expert-led courses with AI tutors that adapt to your role.
                                Knowledge workspaces that turn scattered content into answers.
                                SHRM &amp; HRCI credits tracked automatically.
                            </p>
                        </FadeIn>

                        <FadeIn delay={400}>
                            <div className="mb-10">
                                <TrustBar />
                            </div>
                        </FadeIn>

                        <FadeIn delay={450}>
                            <LandingCTA />
                        </FadeIn>
                    </div>

                    {/* Platform mockup */}
                    <FadeIn delay={700} className="mt-20">
                        <div className="relative mx-auto max-w-5xl">
                            <div className="absolute -inset-8 bg-gradient-to-tr from-[#4B8BB3]/20 to-[#054C74]/10 blur-[80px] rounded-[48px] -z-10" />

                            <div className="relative rounded-[40px] border border-white/10 bg-[#070B12]/70 backdrop-blur-xl shadow-[0_28px_90px_rgba(0,0,0,0.65)] overflow-hidden">
                                <div className="h-10 border-b border-white/[0.06] bg-white/[0.02] flex items-center px-4 gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#FF9300]/70" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#4B8BB3]/60" />
                                    </div>
                                    <div className="ml-3 flex-1 max-w-sm h-5 rounded-full bg-white/[0.04] flex items-center px-3">
                                        <span className="text-[10px] text-slate-600">app.enhancedhr.ai/dashboard</span>
                                    </div>
                                </div>

                                <div className="p-4 sm:p-6 grid grid-cols-12 gap-3 sm:gap-4 h-[280px] sm:h-[380px]">
                                    <div className="col-span-4 sm:col-span-3 space-y-3 hidden sm:block">
                                        <div className="p-3 rounded-lg bg-[#4B8BB3]/10 border border-[#4B8BB3]/20">
                                            <div className="text-[10px] font-bold text-[#4B8BB3] uppercase tracking-wider mb-2">Collections</div>
                                            <div className="space-y-1.5">
                                                {['Favorites', 'Onboarding Project', 'Leadership Dev'].map((item) => (
                                                    <div key={item} className="h-5 rounded bg-white/[0.06] flex items-center px-2">
                                                        <span className="text-[9px] text-slate-500">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Courses</div>
                                            <div className="space-y-1.5">
                                                <div className="h-5 rounded bg-white/[0.04]" />
                                                <div className="h-5 rounded bg-white/[0.04]" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-8 sm:col-span-6 space-y-4">
                                        <div className="h-44 rounded-xl bg-gradient-to-br from-[#054C74]/40 to-[#4B8BB3]/10 border border-white/[0.06] relative overflow-hidden">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                                                    <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-3 left-3">
                                                <div className="px-2 py-0.5 rounded bg-[#FF9300] text-white text-[8px] font-bold mb-1 w-max">SHRM 1.5 PDCs</div>
                                                <div className="text-xs font-bold text-white">Leading Through AI Disruption</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="h-28 rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                                                <div className="text-[9px] text-slate-500 mb-2">Progress</div>
                                                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                    <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]" />
                                                </div>
                                                <div className="text-[9px] text-slate-500 mt-2">4 of 6 modules</div>
                                            </div>
                                            <div className="h-28 rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                                                <div className="text-[9px] text-slate-500 mb-2">Credits Earned</div>
                                                <div className="text-2xl font-bold text-white">12.5</div>
                                                <div className="text-[9px] text-[#FF9300]">SHRM PDCs</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-4 sm:col-span-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex flex-col">
                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.06]">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4B8BB3] to-[#054C74] flex items-center justify-center">
                                                <Sparkles size={10} className="text-white" />
                                            </div>
                                            <div className="text-[10px] font-bold text-white">Prometheus</div>
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.04]">
                                                <p className="text-[9px] text-slate-400 leading-relaxed">How should I approach the change management conversation from Module 3?</p>
                                            </div>
                                            <div className="p-2 rounded-lg bg-[#4B8BB3]/10 border border-[#4B8BB3]/20">
                                                <p className="text-[9px] text-slate-300 leading-relaxed">Based on the course content and your role as VP of People, I&apos;d suggest leading with...</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center px-2">
                                            <span className="text-[9px] text-slate-600">Ask anything...</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pointer-events-none absolute inset-x-0 -bottom-1 h-20 bg-gradient-to-b from-transparent to-[#070B12]" />
                            </div>
                        </div>
                    </FadeIn>
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent via-[#0A0D12]/70 to-[#0A0D12]" />
            </section>

            <MarketingDivider />

            {/* ── THE REALITY ── */}
            <section className="py-28 bg-[#0B1120]/40">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-6">
                            <Target size={12} /> THE REALITY
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            Your Current Tools Weren&apos;t Built
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9300] to-[#FF2600]">
                                for What HR Has Become.
                            </span>
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            You&apos;re navigating AI transformation, workforce upskilling, and compliance complexity &mdash; with tools designed for a simpler era.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
                        {[
                            {
                                problem: 'Generic LMS platforms',
                                detail: 'LinkedIn Learning and legacy LMS tools were built for compliance checkboxes, not for developing strategic HR capabilities in the age of AI.',
                                icon: <BookOpen size={20} />,
                                color: '#FF9300',
                            },
                            {
                                problem: 'AI without context',
                                detail: 'Unscoped ChatGPT doesn\'t know your courses, your policies, or your organization. Generic AI gives ungrounded, sometimes dangerous answers.',
                                icon: <Brain size={20} />,
                                color: '#FF2600',
                            },
                            {
                                problem: 'Knowledge scattered everywhere',
                                detail: 'Training in one tool, policies in SharePoint, notes in a third. Your team wastes hours searching instead of learning and executing.',
                                icon: <FolderOpen size={20} />,
                                color: '#FF9300',
                            },
                        ].map((item, i) => (
                            <FadeIn key={i} delay={i * 100}>
                                <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full">
                                    <div
                                        className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                                        style={{ backgroundColor: `${item.color}15`, color: item.color }}
                                    >
                                        {item.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-3">{item.problem}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{item.detail}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>

                    <FadeIn delay={400} className="text-center mt-12">
                        <p className="text-xl text-slate-300 font-medium">
                            Unlike generic platforms that retrofit AI, EnhancedHR was born in the AI era.
                        </p>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* ── PLATFORM OVERVIEW ── */}
            <section className="py-28">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-slate-400 tracking-wide mb-6">
                            <Layers size={12} /> THE PLATFORM
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            One Platform. Everything HR Needs.
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Six integrated pillars covering learning, knowledge management, AI intelligence, organizational tools, and professional growth.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {platformPillars.map((pillar, index) => (
                            <FadeIn key={pillar.title} delay={index * 80}>
                                <Link
                                    href={pillar.href}
                                    className="group block h-full rounded-2xl bg-white/[0.02] border border-white/[0.06] p-7 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                                >
                                    <div
                                        className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                                        style={{ backgroundColor: `${pillar.color}15`, color: pillar.color }}
                                    >
                                        {pillar.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                        {pillar.title}
                                        <ArrowRight size={15} className="text-slate-600 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all" />
                                    </h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{pillar.body}</p>
                                </Link>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ── AI AGENTS ── */}
            <section className="py-28 bg-[#0B1120]/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4B8BB3]/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <FadeIn>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-6">
                                    <Bot size={12} /> POWERED BY PROMETHEUS
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
                                    AI That Actually
                                    <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">
                                        Understands Your Work
                                    </span>
                                </h2>
                                <p className="text-lg text-slate-400 mb-10 leading-relaxed">
                                    Five specialized agents, each scoped to a specific context and purpose. They don&apos;t hallucinate about your organization because they&apos;re grounded in your actual courses, collections, and data.
                                </p>
                            </FadeIn>

                            <div className="space-y-4">
                                {aiAgents.map((agent, i) => (
                                    <FadeIn key={agent.name} delay={i * 80}>
                                        <div className="flex gap-4 group">
                                            <div
                                                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                                                style={{ backgroundColor: `${agent.color}15`, color: agent.color }}
                                            >
                                                {agent.icon}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white mb-1">{agent.name}</h4>
                                                <p className="text-sm text-slate-500">{agent.desc}</p>
                                            </div>
                                        </div>
                                    </FadeIn>
                                ))}
                            </div>
                        </div>

                        {/* AI Chat mockup */}
                        <FadeIn direction="left" delay={200}>
                            <div className="relative">
                                <div className="absolute -inset-6 bg-gradient-to-tr from-[#4B8BB3]/20 to-[#054C74]/10 rounded-3xl blur-[60px] -z-10" />

                                <div className="bg-[#0A0D12] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
                                    <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4B8BB3] to-[#054C74] flex items-center justify-center">
                                            <Sparkles size={14} className="text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">Course Tutor</div>
                                            <div className="text-[10px] text-[#4B8BB3]">Leading Through AI Disruption &middot; Module 3</div>
                                        </div>
                                        <div className="ml-auto flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[10px] text-slate-500">Active</span>
                                        </div>
                                    </div>

                                    <div className="p-5 space-y-4">
                                        <div className="max-w-[85%] p-3.5 rounded-xl rounded-tl-sm bg-white/[0.04] border border-white/[0.06]">
                                            <p className="text-xs text-slate-300 leading-relaxed">
                                                You mentioned your org is rolling out AI copilots next quarter. Module 3 covers the change communication framework specifically for this scenario. Want me to walk you through the key steps?
                                            </p>
                                        </div>

                                        <div className="max-w-[75%] ml-auto p-3.5 rounded-xl rounded-tr-sm bg-[#4B8BB3]/10 border border-[#4B8BB3]/20">
                                            <p className="text-xs text-white leading-relaxed">
                                                Yes, especially handling resistance from senior managers who feel threatened by automation.
                                            </p>
                                        </div>

                                        <div className="max-w-[85%] p-3.5 rounded-xl rounded-tl-sm bg-white/[0.04] border border-white/[0.06]">
                                            <p className="text-xs text-slate-300 leading-relaxed">
                                                Great focus area. The framework uses a <span className="text-[#4B8BB3] font-medium">&quot;role evolution narrative&quot;</span> approach: reframe automation as expanding strategic capacity rather than replacing tasks. Let&apos;s practice that conversation with your VP of Operations scenario.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 pt-1">
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#4B8BB3] animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#4B8BB3] animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#4B8BB3] animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                            <span className="text-[10px] text-slate-600">Analyzing your context...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ── KNOWLEDGE BRAIN ── */}
            <section className="py-28">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <FadeIn>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-6">
                                    <FolderOpen size={12} /> KNOWLEDGE MANAGEMENT
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
                                    Build Your
                                    <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9300] to-[#FF2600]">
                                        Knowledge Brain
                                    </span>
                                </h2>
                                <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                                    Collections are portable, AI-powered knowledge bases. Add courses, notes, files, videos &mdash; anything relevant to your project. Then let the Collection Assistant synthesize it all into actionable strategy.
                                </p>
                            </FadeIn>

                            <FadeIn delay={150}>
                                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-6">
                                    <h4 className="text-sm font-bold text-white mb-3">Example: Redesigning Onboarding</h4>
                                    <ol className="space-y-2.5 text-sm text-slate-400">
                                        <li className="flex gap-2">
                                            <span className="text-[#FF9300] font-bold flex-shrink-0">1.</span>
                                            Create a &quot;Strategic Onboarding&quot; collection
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-[#FF9300] font-bold flex-shrink-0">2.</span>
                                            Add Academy courses on onboarding best practices
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-[#FF9300] font-bold flex-shrink-0">3.</span>
                                            Upload your company handbook and current SOPs
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-[#FF9300] font-bold flex-shrink-0">4.</span>
                                            Add notes on goals, timelines, and budget constraints
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-[#FF9300] font-bold flex-shrink-0">5.</span>
                                            Ask the Collection Assistant to draft your 90-day plan
                                        </li>
                                    </ol>
                                </div>
                            </FadeIn>

                            <FadeIn delay={250}>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Your handbook becomes a live assistant. Your courses become searchable knowledge. Your notes, files, and research combine into a single AI brain that helps you build &mdash; not just learn.
                                </p>
                            </FadeIn>
                        </div>

                        <FadeIn delay={200} direction="left">
                            <div className="relative">
                                <div className="absolute -inset-4 bg-[#FF9300]/10 rounded-3xl blur-[60px] -z-10" />
                                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-[#FF9300]/10 flex items-center justify-center">
                                            <FolderOpen size={16} className="text-[#FF9300]" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-white">Strategic Onboarding</div>
                                            <div className="text-[10px] text-slate-500">Collection &middot; 12 resources</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {['Academy: Onboarding Best Practices', 'Company Handbook v4.2', 'Manager Quick-Start Guide', 'Q1 Goals & OKRs'].map((item) => (
                                            <div key={item} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs text-slate-400">
                                                <Check size={10} className="text-[#FF9300] flex-shrink-0" />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 p-3 rounded-lg bg-[#FF9300]/[0.04] border border-[#FF9300]/10">
                                        <div className="text-[10px] text-[#FF9300] font-medium mb-1">Collection Assistant</div>
                                        <div className="text-xs text-slate-400">&quot;Based on your handbook and the onboarding course, here&apos;s a 90-day plan that aligns with your Q1 OKRs...&quot;</div>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ── MID-PAGE CTA ── */}
            <section className="py-20">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <FadeIn>
                        <p className="text-lg text-slate-400 mb-8">
                            See how scoped AI transforms the learning experience.
                        </p>
                        <LandingCTA />
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* ── WHY TEAMS SWITCH ── */}
            <section className="py-28 bg-[#0B1120]/40">
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
                                        <div className="h-full rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300">
                                            <div
                                                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                                                style={{ backgroundColor: `${outcome.color}15`, color: outcome.color }}
                                            >
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

            {/* ── BEST FIT ── */}
            <section className="py-28">
                <div className="max-w-5xl mx-auto px-6">
                    <FadeIn className="text-center mb-10">
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5">
                            Best Fit for Teams in Active Change
                        </h2>
                        <p className="text-lg text-slate-400 max-w-3xl mx-auto">
                            Built for HR leaders at organizations with 100&ndash;1,000 employees who need faster capability-building across onboarding, policy, and manager enablement.
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

            {/* ── RECERTIFICATION ── */}
            <section className="py-28 bg-[#0B1120]/40">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <FadeIn direction="right">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-[#FF9300]/10 rounded-3xl blur-[60px] -z-10" />
                            <div className="bg-white text-[#0A0D12] rounded-2xl p-8 shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-700">
                                <div className="border-2 border-slate-200 rounded-xl p-8 text-center">
                                    <Award size={48} className="text-[#FF9300] mx-auto mb-4" />
                                    <div className="text-2xl font-bold mb-1">Certificate of Completion</div>
                                    <div className="text-sm text-slate-500 mb-6">Awarded to <span className="font-bold text-[#0A0D12]">Sarah Mitchell</span></div>
                                    <div className="text-xs text-slate-500 mb-4">Leading Through AI Disruption</div>
                                    <div className="flex justify-center gap-3">
                                        <span className="px-3 py-1.5 bg-[#054C74]/10 rounded-lg text-xs font-bold text-[#054C74]">1.5 SHRM PDCs</span>
                                        <span className="px-3 py-1.5 bg-[#FF9300]/10 rounded-lg text-xs font-bold text-[#FF9300]">1.5 HRCI Credits</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    <div>
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-6">
                                <Award size={12} /> SHRM &amp; HRCI APPROVED
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                                Recertification
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9300] to-[#FFD46B]">
                                    on Autopilot
                                </span>
                            </h2>
                            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                                Every Academy course includes pre-approved credits. Complete a course and your credits are calculated, tracked, and documented automatically.
                            </p>
                        </FadeIn>

                        <FadeIn delay={150}>
                            <ul className="space-y-3">
                                {recertItems.map((item) => (
                                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                                        <Check size={14} className="text-[#FF9300] mt-0.5 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </FadeIn>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ── LAUNCH IN THREE ── */}
            <section className="py-28">
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

            {/* ── PRICING ── */}
            <section className="py-28 bg-[#0B1120]/40">
                <div className="max-w-5xl mx-auto px-6">
                    <FadeIn className="text-center mb-14">
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5">
                            Simple, Transparent Pricing
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            7-day free trial on all plans. No credit card required.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        <FadeIn delay={100}>
                            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full flex flex-col">
                                <div className="mb-6">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Individual</div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-bold text-white">$30</span>
                                        <span className="text-slate-500">/month</span>
                                    </div>
                                </div>
                                <ul className="space-y-3 flex-1 mb-8">
                                    {individualFeatures.map((item) => (
                                        <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
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
                                </div>
                                <ul className="space-y-3 flex-1 mb-8">
                                    {orgFeatures.map((item) => (
                                        <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
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

                    <FadeIn delay={300} className="text-center mt-8">
                        <p className="text-sm text-slate-500">7-day free trial on all plans. No credit card required. Cancel anytime.</p>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* ── FINAL CTA ── */}
            <section className="py-28">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <FadeIn>
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
                            Ready to Transform How
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">
                                Your Team Learns?
                            </span>
                        </h2>
                        <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
                            Join the HR leaders using AI-native tools to build faster, more capable organizations. Start with a free trial and see the difference in your first session.
                        </p>
                        <LandingCTA variant="large" />
                        <p className="text-sm text-slate-500 mt-8">
                            7-day free trial &middot; No credit card required &middot; Cancel anytime
                        </p>
                    </FadeIn>
                </div>
            </section>

        </div>
    );
}
