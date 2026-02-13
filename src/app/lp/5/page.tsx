import type { Metadata } from 'next';
import React from 'react';
import {
    ArrowRight, Clock, Search, Users, MessageSquare,
    Brain, FolderOpen, BookOpen, Bot, BarChart3,
    Sparkles, Zap, Target, Layers, GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import FadeIn from '@/components/marketing/FadeIn';
import HeroBackground from '@/components/marketing/HeroBackground';
import MarketingDivider from '@/components/marketing/MarketingDivider';
import TrustBar from '@/components/landing/TrustBar';
import LandingCTA from '@/components/landing/LandingCTA';

export const metadata: Metadata = {
    title: 'AI Won\'t Save You. Your People Will. | EnhancedHR.ai',
    description: 'The organizations that win won\'t have the best AI. They\'ll have the fastest decision velocity. Discover the AI-native knowledge platform built for HR leaders.',
};

export default function ChallengerLandingPage() {
    return (
        <div className="overflow-hidden">

            {/* ═══════════════════════════════════════════
                SECTION 1: HERO — THE WARMER
                Challenger choreography: earn credibility
                by saying what the buyer suspects but
                hasn't articulated.
            ═══════════════════════════════════════════ */}
            <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-[#0A0D12]">
                <HeroBackground />

                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-[120px] pb-20">
                    <div className="text-center max-w-4xl mx-auto">
                        {/* Headline */}
                        <FadeIn delay={200}>
                            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-6 leading-[1.05]">
                                AI Won&apos;t Save You.
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">
                                    Your People Will.
                                </span>
                            </h1>
                        </FadeIn>

                        {/* Subtitle */}
                        <FadeIn delay={350}>
                            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                                The organizations that win won&apos;t be the ones with the best AI.
                                They&apos;ll be the ones whose people learn, decide, and act fastest.
                            </p>
                        </FadeIn>

                        {/* CTAs */}
                        <FadeIn delay={500}>
                            <LandingCTA />
                        </FadeIn>

                        {/* Trust Bar */}
                        <FadeIn delay={650}>
                            <div className="mt-12">
                                <TrustBar />
                            </div>
                        </FadeIn>
                    </div>
                </div>

                {/* Bottom fade into site background */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent via-[#0A0D12]/70 to-[#0A0D12]" />
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                SECTION 2: THE REFRAME
                Intellectual pivot — the moment the buyer
                starts to see the world differently.
            ═══════════════════════════════════════════ */}
            <section className="py-28 relative overflow-hidden">
                {/* Background accents */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#4B8BB3]/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center">
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-8">
                                <Zap size={12} /> THE REFRAME
                            </div>
                        </FadeIn>

                        <FadeIn delay={100}>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 tracking-tight leading-tight">
                                AI Is Now
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">
                                    Table Stakes.
                                </span>
                            </h2>
                        </FadeIn>

                        <FadeIn delay={200}>
                            <p className="text-lg md:text-xl text-slate-400 leading-relaxed mb-10">
                                Every company is implementing AI. Every company has access to GPT, Claude, Copilot.
                                When everyone has the same tools, the tools stop being the advantage.
                            </p>
                        </FadeIn>

                        <FadeIn delay={300}>
                            <p className="text-xl md:text-2xl text-white font-semibold leading-relaxed">
                                The real differentiator is{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9300] to-[#FF2600]">
                                    decision velocity
                                </span>{' '}
                                &mdash; how fast your people can convert information into action.
                            </p>
                        </FadeIn>
                    </div>

                    {/* Concept cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto mt-16">
                        {[
                            {
                                label: 'The Old Advantage',
                                text: 'Access to AI tools',
                                subtext: 'Everyone has this now.',
                                muted: true,
                            },
                            {
                                label: 'The Assumed Advantage',
                                text: 'More AI features',
                                subtext: 'Adds complexity without clarity.',
                                muted: true,
                            },
                            {
                                label: 'The Real Advantage',
                                text: 'Decision velocity',
                                subtext: 'How fast people learn, find truth, and act.',
                                muted: false,
                            },
                        ].map((card, i) => (
                            <FadeIn key={i} delay={400 + i * 100}>
                                <div className={`p-6 rounded-2xl text-center h-full ${
                                    card.muted
                                        ? 'bg-white/[0.02] border border-white/[0.06]'
                                        : 'bg-[#4B8BB3]/10 border border-[#4B8BB3]/20'
                                }`}>
                                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${
                                        card.muted ? 'text-slate-600' : 'text-[#4B8BB3]'
                                    }`}>
                                        {card.label}
                                    </div>
                                    <div className={`text-lg font-bold mb-2 ${
                                        card.muted ? 'text-slate-500 line-through decoration-slate-700' : 'text-white'
                                    }`}>
                                        {card.text}
                                    </div>
                                    <div className={`text-sm ${card.muted ? 'text-slate-600' : 'text-slate-400'}`}>
                                        {card.subtext}
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                SECTION 3: THE HIDDEN TAX — RATIONAL DROWNING
                Quantify the cost of knowledge friction
                with visceral statistics.
            ═══════════════════════════════════════════ */}
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

                    {/* Statistics */}
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

            {/* ═══════════════════════════════════════════
                SECTION 4: WHAT IT FEELS LIKE — EMOTIONAL IMPACT
                Make the buyer FEEL the pain, not just
                understand it intellectually.
            ═══════════════════════════════════════════ */}
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
                                body: 'Onboarding stretches into months because tribal knowledge lives in people\'s heads. The handbook says one thing. Reality is another. And nobody has time to bridge the gap.',
                                color: '#FF9300',
                            },
                            {
                                icon: <MessageSquare size={22} />,
                                title: 'Managers answer the same questions repeatedly',
                                body: 'Policy questions, process questions, "where do I find..." questions. Your most experienced people spend their days as human search engines instead of leading.',
                                color: '#4B8BB3',
                            },
                            {
                                icon: <Search size={22} />,
                                title: 'Teams reinvent work because they can\'t find the last version',
                                body: 'The playbook exists. Somewhere. In someone\'s Google Drive. Maybe. So the team builds it again from scratch, losing days they\'ll never get back.',
                                color: '#4B8BB3',
                            },
                            {
                                icon: <Sparkles size={22} />,
                                title: 'Your best insights evaporate',
                                body: 'A brilliant coaching conversation happens. A great solution is found during a training session. And then it\'s gone. Unrecorded. Unreusable. Lost to the next meeting.',
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

            {/* Mid-funnel CTA */}
            <section className="py-16 relative">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <FadeIn>
                        <p className="text-lg text-slate-400 mb-8">
                            Ready to stop paying the knowledge tax?
                        </p>
                        <LandingCTA />
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                SECTION 5: THE NEW WAY — THE CATEGORY
                Release tension by introducing a new
                category: scoped knowledge workspaces.
            ═══════════════════════════════════════════ */}
            <section className="py-28 bg-[#0B1120]/40 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[#4B8BB3]/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center mb-16">
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-8">
                                <Brain size={12} /> A NEW WAY
                            </div>
                        </FadeIn>

                        <FadeIn delay={100}>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 tracking-tight leading-tight">
                                Stop Treating Knowledge
                                <br />
                                Like Files.{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">
                                    Treat It Like
                                    <br />
                                    Living Context.
                                </span>
                            </h2>
                        </FadeIn>

                        <FadeIn delay={200}>
                            <p className="text-lg text-slate-400 leading-relaxed">
                                What if your knowledge wasn&apos;t scattered across 12 tools &mdash;
                                but organized into scoped, AI-native workspaces where every question gets an answer
                                grounded in the right context? Not a chatbot. Not a wiki. Not search.
                                Something fundamentally new.
                            </p>
                        </FadeIn>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
                        {[
                            {
                                icon: <Layers size={22} />,
                                title: 'Context, Not Content',
                                body: 'AI needs boundaries to be accurate. Course-only, collection-only, org-only scoping ensures answers are grounded in the right source &mdash; not the entire internet.',
                                color: '#4B8BB3',
                            },
                            {
                                icon: <GraduationCap size={22} />,
                                title: 'Application, Not Consumption',
                                body: 'Learning isn\'t watching a video and checking a box. It\'s applying concepts through Socratic AI coaching tailored to your actual role, your actual challenges.',
                                color: '#FF9300',
                            },
                            {
                                icon: <Sparkles size={22} />,
                                title: 'Capture, Not Forget',
                                body: 'Every insight from every conversation is captured and fed back into the system. The AI gets smarter about you and your organization over time.',
                                color: '#4B8BB3',
                            },
                            {
                                icon: <Zap size={22} />,
                                title: 'Velocity, Not Volume',
                                body: 'Less time searching for information. Less time re-creating work. More time making decisions and moving forward. Speed compounds.',
                                color: '#FF9300',
                            },
                        ].map((card, i) => (
                            <FadeIn key={i} delay={300 + i * 80}>
                                <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full group hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div
                                            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                                            style={{ backgroundColor: `${card.color}15`, color: card.color }}
                                        >
                                            {card.icon}
                                        </div>
                                        <h3 className="text-white font-bold text-base">{card.title}</h3>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed">{card.body}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                SECTION 6: THE SOLUTION — YOUR SOLUTION
                Reveal the product as the embodiment
                of everything built up in the narrative.
            ═══════════════════════════════════════════ */}
            <section className="py-28 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4B8BB3]/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#054C74]/8 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center mb-16">
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-8">
                                <Bot size={12} /> ENHANCEDHR.AI
                            </div>
                        </FadeIn>

                        <FadeIn delay={100}>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
                                The AI-Native Knowledge Platform
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">
                                    for HR
                                </span>
                            </h2>
                        </FadeIn>

                        <FadeIn delay={200}>
                            <p className="text-lg text-slate-400 leading-relaxed">
                                Four pillars. One platform. Designed from the ground up to turn scattered knowledge
                                into decision velocity &mdash; for individuals, teams, and entire organizations.
                            </p>
                        </FadeIn>
                    </div>

                    {/* Four Pillars */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
                        {[
                            {
                                icon: <FolderOpen size={22} />,
                                title: 'Collections',
                                subtitle: 'Queryable Knowledge Workspaces',
                                body: 'Turn scattered docs, policies, courses, and notes into AI-powered knowledge bases. Upload your handbook, add a course, drop in a YouTube video &mdash; then ask the AI anything across all of it.',
                                color: '#FF9300',
                            },
                            {
                                icon: <BookOpen size={22} />,
                                title: 'Academy',
                                subtitle: 'Expert-Led Courses with AI Coaching',
                                body: 'World-class courses from industry experts, paired with a Socratic AI tutor that adapts to your role, your company, and your challenges. SHRM and HRCI credits included.',
                                color: '#4B8BB3',
                            },
                            {
                                icon: <Brain size={22} />,
                                title: 'AI Agents',
                                subtitle: '5 Specialized, Scoped Agents',
                                body: 'A Course Assistant for instant cited answers. A Tutor for personalized coaching. A Platform Assistant for cross-library intelligence. A Collection Assistant for project synthesis. An Analytics Agent for org insights.',
                                color: '#78C0F0',
                            },
                            {
                                icon: <Users size={22} />,
                                title: 'Org Tools',
                                subtitle: 'Groups, Assignments, Analytics',
                                body: 'Custom employee groups, required learning assignments, org-specific courses and knowledge bases, and an analytics dashboard that tells you what your team is learning and asking about.',
                                color: '#4B8BB3',
                            },
                        ].map((pillar, i) => (
                            <FadeIn key={i} delay={300 + i * 100}>
                                <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full group hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div
                                            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                                            style={{ backgroundColor: `${pillar.color}15`, color: pillar.color }}
                                        >
                                            {pillar.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-base">{pillar.title}</h3>
                                            <div className="text-[11px] text-slate-500">{pillar.subtitle}</div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed mt-4">{pillar.body}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>

                    {/* Platform Visual Mockup */}
                    <FadeIn delay={700} className="mt-16">
                        <div className="relative mx-auto max-w-5xl">
                            {/* Glow behind */}
                            <div className="absolute -inset-8 bg-gradient-to-tr from-[#4B8BB3]/20 to-[#054C74]/10 blur-[80px] rounded-[48px] -z-10" />

                            <div className="relative rounded-[40px] border border-white/10 bg-[#070B12]/70 backdrop-blur-xl shadow-[0_28px_90px_rgba(0,0,0,0.65)] overflow-hidden">
                                {/* Browser Chrome */}
                                <div className="h-10 border-b border-white/[0.06] bg-white/[0.02] flex items-center px-4 gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#FF9300]/70" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#4B8BB3]/60" />
                                    </div>
                                    <div className="ml-3 flex-1 max-w-sm h-5 rounded-full bg-white/[0.04] flex items-center px-3">
                                        <span className="text-[10px] text-slate-600">app.enhancedhr.ai/collections/strategic-onboarding</span>
                                    </div>
                                </div>

                                {/* App Content — Collection Workspace */}
                                <div className="p-4 sm:p-6 grid grid-cols-12 gap-3 sm:gap-4 h-[280px] sm:h-[380px]">
                                    {/* Sidebar — Collection Items */}
                                    <div className="col-span-4 sm:col-span-3 space-y-3 hidden sm:block">
                                        <div className="p-3 rounded-lg bg-[#FF9300]/10 border border-[#FF9300]/20">
                                            <div className="text-[10px] font-bold text-[#FF9300] uppercase tracking-wider mb-2">Collection</div>
                                            <div className="space-y-1.5">
                                                {[
                                                    { name: 'Company Handbook', icon: '/' },
                                                    { name: 'Onboarding Course', icon: '/' },
                                                    { name: 'Policy Notes', icon: '/' },
                                                    { name: 'Best Practices', icon: '/' },
                                                ].map((item, i) => (
                                                    <div key={i} className="h-5 rounded bg-white/[0.06] flex items-center px-2">
                                                        <span className="text-[9px] text-slate-500">{item.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Content — Course View */}
                                    <div className="col-span-8 sm:col-span-5 space-y-3">
                                        <div className="h-40 rounded-xl bg-gradient-to-br from-[#054C74]/40 to-[#4B8BB3]/10 border border-white/[0.06] relative overflow-hidden">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                                                    <div className="w-0 h-0 border-l-[10px] border-l-white border-y-[7px] border-y-transparent ml-1" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-2 left-3">
                                                <div className="px-2 py-0.5 rounded bg-[#FF9300] text-white text-[7px] font-bold mb-0.5 w-max">1.5 SHRM PDCs</div>
                                                <div className="text-[10px] font-bold text-white">Strategic Onboarding</div>
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                            <div className="text-[9px] text-slate-500 mb-2">Knowledge Sources</div>
                                            <div className="flex gap-2">
                                                <div className="px-2 py-1 rounded bg-[#4B8BB3]/10 text-[8px] text-[#4B8BB3]">2 Courses</div>
                                                <div className="px-2 py-1 rounded bg-[#FF9300]/10 text-[8px] text-[#FF9300]">3 Files</div>
                                                <div className="px-2 py-1 rounded bg-[#78C0F0]/10 text-[8px] text-[#78C0F0]">2 Notes</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Panel */}
                                    <div className="col-span-4 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex flex-col">
                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.06]">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4B8BB3] to-[#054C74] flex items-center justify-center">
                                                <Sparkles size={10} className="text-white" />
                                            </div>
                                            <div className="text-[10px] font-bold text-white">Collection AI</div>
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.04]">
                                                <p className="text-[9px] text-slate-400 leading-relaxed">Draft a Week 1 onboarding plan using our handbook and the course best practices.</p>
                                            </div>
                                            <div className="p-2 rounded-lg bg-[#4B8BB3]/10 border border-[#4B8BB3]/20">
                                                <p className="text-[9px] text-slate-300 leading-relaxed">Based on your handbook policies and the Strategic Onboarding course, here&apos;s a plan that prioritizes cultural immersion first...</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center px-2">
                                            <span className="text-[9px] text-slate-600">Ask about your collection...</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom fade overlay */}
                                <div className="pointer-events-none absolute inset-x-0 -bottom-1 h-20 bg-gradient-to-b from-transparent to-[#070B12]" />
                            </div>
                        </div>
                    </FadeIn>

                    {/* Pricing teaser */}
                    <FadeIn delay={800} className="text-center mt-12">
                        <p className="text-sm text-slate-500">
                            Starting at <span className="text-white font-semibold">$30/month</span>.
                            7-day free trial. No credit card required.
                        </p>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                SECTION 7: FINAL CTA — THE CLOSE
                Release all built tension into action.
            ═══════════════════════════════════════════ */}
            <section className="py-32 bg-[#0B1120]/40 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#4B8BB3]/10 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-4xl mx-auto px-6 text-center relative">
                    <FadeIn>
                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
                            See What Decision Velocity
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">
                                Looks Like
                            </span>
                        </h2>
                        <p className="text-xl text-slate-400 mb-4 max-w-2xl mx-auto leading-relaxed">
                            Start a free trial and build your first knowledge workspace in minutes.
                            Upload your handbook, add a course, and ask the AI a question about your actual organization.
                        </p>
                        <p className="text-sm text-slate-500 mb-12">
                            7-day free trial &middot; No credit card required &middot; Cancel anytime
                        </p>
                    </FadeIn>

                    <FadeIn delay={200}>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/login?view=signup"
                                className="group inline-flex items-center gap-2 px-10 py-5 rounded-full bg-white text-[#0A0D12] font-bold text-xl hover:bg-[#4B8BB3] hover:text-white transition-all shadow-2xl hover:shadow-[0_0_50px_rgba(75,139,179,0.4)] hover:scale-[1.02]"
                            >
                                Start Free Trial
                                <ArrowRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <Link
                                href="/demo"
                                className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-white/[0.04] text-white font-semibold text-xl border border-white/[0.08] hover:bg-white/[0.08] transition-all"
                            >
                                Schedule a Demo <ArrowRight size={24} className="opacity-50" />
                            </Link>
                        </div>
                    </FadeIn>

                    <FadeIn delay={400} className="mt-12">
                        <TrustBar />
                    </FadeIn>
                </div>
            </section>

        </div>
    );
}
