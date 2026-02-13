import type { Metadata } from 'next';
import Link from 'next/link';
import {
    ArrowRight, Check, BookOpen, Brain, Users,
    Bot, Sparkles, Zap, Target, Layers,
    FolderOpen, GraduationCap, BarChart3,
    MessageSquare, Clock, Search,
} from 'lucide-react';
import FadeIn from '@/components/marketing/FadeIn';
import HeroBackground from '@/components/marketing/HeroBackground';
import MarketingDivider from '@/components/marketing/MarketingDivider';
import TrustBar from '@/components/landing/TrustBar';
import LandingCTA from '@/components/landing/LandingCTA';

export const metadata: Metadata = {
    title: 'AI Won\'t Save You. Your People Will. | EnhancedHR.ai',
    description: 'AI is table stakes. Decision velocity is the advantage. The AI-native knowledge platform built for HR leaders at 100-1000 employee organizations.',
};

const pillarCards = [
    {
        icon: <FolderOpen size={22} />,
        title: 'Collections',
        subtitle: 'Queryable Knowledge Workspaces',
        body: 'Turn scattered docs, policies, courses, and notes into scoped AI-powered knowledge bases. Upload your handbook, add a course, drop in a video \u2014 then ask the AI anything across all of it.',
        color: '#FF9300',
    },
    {
        icon: <BookOpen size={22} />,
        title: 'Academy',
        subtitle: 'Expert-Led Courses with AI Coaching',
        body: 'World-class courses from industry experts, paired with a Socratic AI tutor that adapts to your role and challenges. SHRM and HRCI credits included.',
        color: '#4B8BB3',
    },
    {
        icon: <Brain size={22} />,
        title: 'AI Agents',
        subtitle: '5 Specialized, Scoped Agents',
        body: 'Course Assistant for cited answers. Tutor for personalized coaching. Platform Assistant for cross-library intelligence. Collection Assistant for project synthesis. Analytics Agent for org insights.',
        color: '#78C0F0',
    },
    {
        icon: <Users size={22} />,
        title: 'Org Tools',
        subtitle: 'Groups, Assignments, Analytics',
        body: 'Custom employee groups, required learning assignments, org-specific courses and knowledge bases, and an analytics dashboard showing what your team is learning and asking about.',
        color: '#4B8BB3',
    },
];

const pilotSteps = [
    'Pick two teams with high knowledge friction (e.g., HRBP + managers)',
    'Create three scoped repositories (onboarding, policy, team enablement)',
    'Load 20\u201350 critical artifacts and assign one focused learning path',
    'Measure time-to-answer, repeat-question volume, and ramp confidence over 14 days',
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

export default function LP8ChallengerPage() {
    return (
        <div className="overflow-hidden">

            {/* ── HERO ── */}
            <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-[#0A0D12]">
                <HeroBackground />

                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-[120px] pb-20">
                    <div className="text-center max-w-4xl mx-auto">
                        <FadeIn delay={150}>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-8">
                                <Sparkles size={12} /> AI-NATIVE KNOWLEDGE PLATFORM &middot; For 100&ndash;1,000 Employee Teams
                            </div>
                        </FadeIn>

                        <FadeIn delay={200}>
                            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-6 leading-[1.05]">
                                AI Won&apos;t Save You.
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">
                                    Your People Will.
                                </span>
                            </h1>
                        </FadeIn>

                        <FadeIn delay={350}>
                            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                                The organizations that win won&apos;t be the ones with the best AI.
                                They&apos;ll be the ones whose people learn, decide, and act fastest.
                            </p>
                        </FadeIn>

                        <FadeIn delay={450}>
                            <div className="mb-10">
                                <TrustBar />
                            </div>
                        </FadeIn>

                        <FadeIn delay={500}>
                            <LandingCTA />
                        </FadeIn>
                    </div>
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent via-[#0A0D12]/70 to-[#0A0D12]" />
            </section>

            <MarketingDivider />

            {/* ── THE REFRAME + STATS ── */}
            <section className="py-28 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#4B8BB3]/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-6">
                            <Zap size={12} /> THE REFRAME
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5">
                            AI Is Now
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">
                                Table Stakes.
                            </span>
                        </h2>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Every company has AI. When everyone has the same tools, the tools stop being the advantage.
                            The real differentiator is decision velocity &mdash; how fast your people convert information into action.
                        </p>
                    </FadeIn>

                    {/* Concept cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
                        {[
                            { label: 'The Old Advantage', text: 'Access to AI tools', subtext: 'Everyone has this now.', muted: true },
                            { label: 'The Assumed Advantage', text: 'More AI features', subtext: 'Adds complexity without clarity.', muted: true },
                            { label: 'The Real Advantage', text: 'Decision velocity', subtext: 'How fast people learn, find truth, and act.', muted: false },
                        ].map((card, i) => (
                            <FadeIn key={i} delay={i * 100}>
                                <div className={`p-6 rounded-2xl text-center h-full ${
                                    card.muted
                                        ? 'bg-white/[0.02] border border-white/[0.06]'
                                        : 'bg-[#4B8BB3]/10 border border-[#4B8BB3]/20'
                                }`}>
                                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${card.muted ? 'text-slate-600' : 'text-[#4B8BB3]'}`}>
                                        {card.label}
                                    </div>
                                    <div className={`text-lg font-bold mb-2 ${card.muted ? 'text-slate-500 line-through decoration-slate-700' : 'text-white'}`}>
                                        {card.text}
                                    </div>
                                    <div className={`text-sm ${card.muted ? 'text-slate-600' : 'text-slate-400'}`}>
                                        {card.subtext}
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            { stat: '25%', label: 'of work time wasted searching for information', source: 'Atlassian', color: '#FF9300' },
                            { stat: '47%', label: 'of digital workers struggle to find what they need', source: 'Gartner', color: '#FF2600' },
                            { stat: '~10', label: 'hours lost per week per employee to information fragmentation', source: 'APQC', color: '#FF9300' },
                        ].map((item, i) => (
                            <FadeIn key={i} delay={i * 100}>
                                <div className="text-center p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                    <div className="text-6xl font-bold mb-3" style={{ color: item.color }}>{item.stat}</div>
                                    <div className="text-sm text-slate-400 leading-relaxed mb-2">{item.label}</div>
                                    <div className="text-[10px] text-slate-600">Source: {item.source}</div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ── THE HIDDEN TAX ── */}
            <section className="py-28 bg-[#0B1120]/40 relative">
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#FF9300]/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-6">
                            <Clock size={12} /> THE HIDDEN TAX
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            Your Company Doesn&apos;t Have a Knowledge Problem.
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9300] to-[#FF2600]">
                                You Have a Context Problem.
                            </span>
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Knowledge lives everywhere &mdash; SharePoint, Google Drive, Slack, wikis, people&apos;s heads.
                            When context is scattered, AI just accelerates the confusion.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {[
                            {
                                stat: '25%',
                                label: 'of work time wasted searching for information',
                                source: 'Atlassian',
                                color: '#FF9300',
                            },
                            {
                                stat: '47%',
                                label: 'of digital workers struggle to find what they need',
                                source: 'Gartner',
                                color: '#FF2600',
                            },
                            {
                                stat: '~10',
                                label: 'hours lost per week per employee to information fragmentation',
                                source: 'APQC',
                                color: '#FF9300',
                            },
                        ].map((item, i) => (
                            <FadeIn key={i} delay={i * 120}>
                                <div className="text-center p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                    <div
                                        className="text-6xl md:text-7xl font-bold mb-3"
                                        style={{ color: item.color }}
                                    >
                                        {item.stat}
                                    </div>
                                    <div className="text-sm text-slate-400 leading-relaxed mb-2">
                                        {item.label}
                                    </div>
                                    <div className="text-[10px] text-slate-600">
                                        Source: {item.source}
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>

                    <FadeIn delay={400} className="text-center mt-12">
                        <p className="text-base text-slate-500 max-w-xl mx-auto italic">
                            This is the hidden tax on every organization. And it compounds &mdash;
                            the faster you grow, the worse it gets.
                        </p>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* ── THE COST ISN'T ABSTRACT ── */}
            <section className="py-28 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4B8BB3]/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-slate-400 tracking-wide mb-6">
                            <Target size={12} /> EVERY DAY, YOUR TEAM EXPERIENCES THIS
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                            The Cost Isn&apos;t Abstract.
                            <br />
                            It&apos;s Personal.
                        </h2>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
                        {[
                            {
                                icon: <Clock size={22} />,
                                title: 'New hires take too long to become confident',
                                body: 'Onboarding stretches into months because tribal knowledge lives in people\u2019s heads. The handbook says one thing. Reality is another. And nobody has time to bridge the gap.',
                                color: '#FF9300',
                            },
                            {
                                icon: <MessageSquare size={22} />,
                                title: 'Managers answer the same questions repeatedly',
                                body: 'Policy questions, process questions, \u201cwhere do I find...\u201d questions. Your most experienced people spend their days as human search engines instead of leading.',
                                color: '#4B8BB3',
                            },
                            {
                                icon: <Search size={22} />,
                                title: 'Teams reinvent work because they can\u2019t find the last version',
                                body: 'The playbook exists. Somewhere. In someone\u2019s Google Drive. Maybe. So the team builds it again from scratch, losing days they\u2019ll never get back.',
                                color: '#4B8BB3',
                            },
                            {
                                icon: <Sparkles size={22} />,
                                title: 'Your best insights evaporate',
                                body: 'A brilliant coaching conversation happens. A great solution is found during a training session. And then it\u2019s gone. Unrecorded. Unreusable. Lost to the next meeting.',
                                color: '#FF9300',
                            },
                        ].map((card, i) => (
                            <FadeIn key={i} delay={i * 80}>
                                <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div
                                            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: `${card.color}15`, color: card.color }}
                                        >
                                            {card.icon}
                                        </div>
                                        <h3 className="text-white font-bold text-base leading-snug">{card.title}</h3>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed">{card.body}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ── THE SOLUTION ── */}
            <section className="py-28 bg-[#0B1120]/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4B8BB3]/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-6">
                            <Bot size={12} /> ENHANCEDHR.AI
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5">
                            The AI-Native Knowledge Platform
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">
                                for HR
                            </span>
                        </h2>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Four pillars. One platform. Designed from the ground up to turn scattered knowledge into decision velocity.
                        </p>
                    </FadeIn>

                    {/* 2x2 pillar cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
                        {pillarCards.map((card, index) => (
                            <FadeIn key={card.title} delay={index * 90}>
                                <div className="group h-full rounded-2xl bg-white/[0.02] border border-white/[0.06] p-7 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all relative overflow-hidden">
                                    <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[70px] opacity-20" style={{ backgroundColor: card.color }} />
                                    <div className="relative">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div
                                                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                                                style={{ backgroundColor: `${card.color}15`, color: card.color }}
                                            >
                                                {card.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-white font-bold text-base">{card.title}</h3>
                                                <div className="text-[11px] text-slate-500">{card.subtitle}</div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-400 leading-relaxed mt-4">{card.body}</p>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>

                    {/* Platform visual mockup */}
                    <FadeIn delay={200}>
                        <div className="rounded-2xl border border-white/[0.08] bg-[#0B1120]/70 overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-white/[0.08]" />
                                    <div className="w-3 h-3 rounded-full bg-white/[0.08]" />
                                    <div className="w-3 h-3 rounded-full bg-white/[0.08]" />
                                </div>
                                <div className="flex-1 mx-4 px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-xs text-slate-500">
                                    app.enhancedhr.ai/collections/onboarding-playbook
                                </div>
                            </div>
                            <div className="grid grid-cols-12 min-h-[320px]">
                                <div className="col-span-3 border-r border-white/[0.06] p-4">
                                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Collection</div>
                                    <div className="space-y-2">
                                        {['Onboarding Playbook', 'Policy Library', 'Manager Toolkit'].map((item, i) => (
                                            <div key={item} className={`px-3 py-2 rounded-lg text-xs ${i === 0 ? 'bg-[#4B8BB3]/10 text-[#78C0F0] font-medium' : 'text-slate-500'}`}>
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Knowledge Sources</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {['12 Documents', '3 Courses', '2 Policies'].map((badge) => (
                                            <span key={badge} className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] text-slate-400">
                                                {badge}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-span-5 border-r border-white/[0.06] p-5">
                                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-5 rounded bg-[#FF9300]/20" />
                                            <div className="text-xs text-slate-400">Video &middot; 12:34</div>
                                        </div>
                                        <div className="w-full h-24 rounded-lg bg-gradient-to-br from-[#0A0D12] to-[#0B1120] border border-white/[0.04] flex items-center justify-center">
                                            <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center">
                                                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white/40 border-b-[6px] border-b-transparent ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-semibold text-white mb-1">New Hire Orientation Framework</div>
                                    <p className="text-xs text-slate-500 leading-relaxed">Comprehensive guide to structuring the first 90 days for new team members...</p>
                                </div>
                                <div className="col-span-4 p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-6 h-6 rounded-lg bg-[#4B8BB3]/20 flex items-center justify-center">
                                            <Bot size={12} className="text-[#4B8BB3]" />
                                        </div>
                                        <span className="text-xs font-semibold text-white">Collection AI</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                                            <p className="text-[11px] text-slate-400 leading-relaxed">What are the key milestones for week one of onboarding?</p>
                                        </div>
                                        <div className="rounded-lg bg-[#4B8BB3]/10 border border-[#4B8BB3]/15 p-3">
                                            <p className="text-[11px] text-slate-300 leading-relaxed">Based on your onboarding playbook, the week one milestones include: systems access setup, team introductions, role expectations review, and first check-in with manager...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* ── MID-PAGE CTA ── */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <FadeIn>
                        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-8">
                            Ready to stop paying the knowledge tax?
                        </h2>
                        <LandingCTA />
                        <p className="mt-6 text-sm text-slate-500">Starting at $30/month</p>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* ── PROVE IT IN 14 DAYS ── */}
            <section className="py-28 bg-[#0B1120]/40">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pilotSteps.map((step) => (
                                    <div key={step} className="flex items-start gap-2.5 text-sm text-slate-300">
                                        <Check size={14} className="text-[#4B8BB3] mt-0.5 flex-shrink-0" />
                                        {step}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-7 rounded-xl border border-[#4B8BB3]/20 bg-[#4B8BB3]/[0.08] p-4 text-sm text-slate-300">
                                <strong className="text-white">Success criteria:</strong> lower time-to-answer, fewer repeated questions, stronger onboarding confidence, and clearer manager guidance.
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* ── PRICING ── */}
            <section className="py-28">
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
                        <FadeIn delay={0}>
                            <div className="h-full rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 flex flex-col">
                                <h3 className="text-xl font-bold text-white mb-2">Individual</h3>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-4xl font-bold text-white">$30</span>
                                    <span className="text-slate-400 text-sm">/month</span>
                                </div>
                                <ul className="space-y-3 flex-1 mb-8">
                                    {individualFeatures.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-300">
                                            <Check size={14} className="text-[#4B8BB3] mt-0.5 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/login?view=signup"
                                    className="block w-full text-center rounded-full bg-white/[0.06] border border-white/[0.1] text-white font-semibold py-3 hover:bg-white/[0.1] transition-all"
                                >
                                    Start Free Trial
                                </Link>
                            </div>
                        </FadeIn>

                        <FadeIn delay={90}>
                            <div className="h-full rounded-2xl bg-white/[0.02] border border-[#4B8BB3]/30 p-8 relative overflow-hidden flex flex-col">
                                <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-[#4B8BB3]/10 blur-[80px]" />
                                <div className="relative flex-1 flex flex-col">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-white">Organization</h3>
                                        <span className="px-2.5 py-0.5 rounded-full bg-[#4B8BB3]/15 border border-[#4B8BB3]/25 text-[10px] font-bold uppercase tracking-wider text-[#78C0F0]">Popular</span>
                                    </div>
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-4xl font-bold text-white">$30</span>
                                        <span className="text-slate-400 text-sm">/user/month</span>
                                    </div>
                                    <ul className="space-y-3 flex-1 mb-8">
                                        {orgFeatures.map((feature) => (
                                            <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-300">
                                                <Check size={14} className="text-[#4B8BB3] mt-0.5 flex-shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        href="/login?view=signup"
                                        className="block w-full text-center rounded-full bg-[#4B8BB3] text-white font-semibold py-3 hover:bg-[#5a9bc3] transition-all shadow-[0_0_30px_rgba(75,139,179,0.3)] hover:shadow-[0_0_50px_rgba(75,139,179,0.5)]"
                                    >
                                        Start Free Trial
                                    </Link>
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                    <FadeIn delay={180}>
                        <p className="text-center text-sm text-slate-500 mt-8">
                            7-day free trial on all plans. No credit card required. Cancel anytime.
                        </p>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* ── FINAL CTA ── */}
            <section className="py-28 bg-[#0B1120]/40 relative">
                <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[#4B8BB3]/[0.08] blur-[120px]" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                    <FadeIn>
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
                            See What Decision Velocity
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">
                                Looks Like
                            </span>
                        </h2>
                        <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-2xl mx-auto">
                            Start your free trial today. Build your first knowledge workspace, assign a learning path, and see
                            how fast your team can move when knowledge meets action.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/login?view=signup"
                                className="group rounded-full bg-white text-[#0A0D12] font-bold px-10 py-5 text-xl hover:bg-[#4B8BB3] hover:text-white transition-all hover:-translate-y-0.5 flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(75,139,179,0.5)]"
                            >
                                Start Free Trial
                                <ArrowRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <Link
                                href="/demo"
                                className="rounded-full bg-transparent text-white font-semibold border border-white/[0.15] px-10 py-5 text-xl hover:bg-white/[0.06] transition-all hover:-translate-y-0.5 flex items-center gap-2"
                            >
                                Schedule a Demo
                                <ArrowRight size={24} className="opacity-50" />
                            </Link>
                        </div>
                        <div className="mt-12">
                            <TrustBar />
                        </div>
                    </FadeIn>
                </div>
            </section>

        </div>
    );
}
