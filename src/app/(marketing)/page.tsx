import React from 'react';
import Link from 'next/link';
import {
    ArrowRight, Check, Zap, BookOpen, Brain, Users,
    Building2, Wrench, Award, Shield, MessageSquare,
    GraduationCap, Layers, BarChart3, Sparkles, Target,
    FolderOpen, Bot, UserCheck, ChevronRight, Wand2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import FadeIn from '@/components/marketing/FadeIn';
import HeroBackground from '@/components/marketing/HeroBackground';
import MarketingDivider from '@/components/marketing/MarketingDivider';

const anchorPills = [
    { label: 'Platform', id: 'pillars' },
    { label: 'AI Agents', id: 'ai-showcase' },
    { label: 'The Agents', id: 'the-agents' },
    { label: 'Collections', id: 'collections' },
    { label: 'Organizations', id: 'organizations' },
    { label: 'Recertification', id: 'recertification' },
    { label: 'Pricing', id: 'pricing' },
];

export default async function MarketingHomePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const ctaHref = user ? '/dashboard' : '/login?view=signup';
    const ctaLabel = user ? 'Go to Dashboard' : 'Start Free Trial';

    return (
        <div className="overflow-hidden">

            {/* ═══════════════════════════════════════════
                HERO SECTION
            ═══════════════════════════════════════════ */}
            <section className="relative -mt-[72px] min-h-[100svh] flex items-center justify-center overflow-hidden bg-[#0A0D12]">
                {/* Animated Background — Deep Void */}
                <HeroBackground />

                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-[120px] pb-20">
                    <div className="text-center max-w-4xl mx-auto">
                        {/* Headline */}
                        <FadeIn delay={200}>
                            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-6 leading-[1.05]">
                                The AI-Native
                                <br />
                                Knowledge Platform
                            </h1>
                        </FadeIn>

                        {/* Subtitle */}
                        <FadeIn delay={300}>
                            <p className="text-base md:text-lg text-slate-400 tracking-wide mb-6">
                                For Cutting-Edge Organizations
                            </p>
                        </FadeIn>

                        {/* Inline Divider */}
                        <FadeIn delay={350}>
                            <div className="pointer-events-none relative mx-auto mb-8 h-px w-full max-w-md">
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                                <div className="absolute left-1/2 top-0 h-px w-32 -translate-x-1/2 bg-gradient-to-r from-[#4B8BB3]/0 via-[#4B8BB3]/60 to-[#4B8BB3]/0 blur-[1px]" />
                            </div>
                        </FadeIn>

                        {/* Description */}
                        <FadeIn delay={400}>
                            <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-4 leading-relaxed">
                                Learn from industry experts. Build your own courses. Create learning paths. Turn knowledge repositories into an always-on AI trained on company context and tailored for each user.
                            </p>
                            <p className="text-base md:text-lg text-slate-300 font-medium mb-12">
                                Make better decisions — faster.
                            </p>
                        </FadeIn>

                        {/* CTAs */}
                        <FadeIn delay={550}>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    href={ctaHref}
                                    className="group px-8 py-4 rounded-full bg-[#4B8BB3] text-white font-bold text-lg hover:bg-[#5a9bc3] transition-all shadow-[0_0_30px_rgba(75,139,179,0.3)] hover:shadow-[0_0_50px_rgba(75,139,179,0.5)] hover:-translate-y-0.5 flex items-center gap-2"
                                >
                                    {ctaLabel}
                                    <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                                <Link
                                    href="/demo"
                                    className="px-8 py-4 rounded-full bg-white/[0.04] text-white font-semibold text-lg border border-white/[0.08] hover:bg-white/[0.08] transition-all hover:-translate-y-0.5 flex items-center gap-2"
                                >
                                    Schedule a Demo <ArrowRight size={20} className="opacity-50" />
                                </Link>
                            </div>
                        </FadeIn>
                    </div>

                    {/* Hero Visual — Platform Mockup */}
                    <FadeIn delay={700} className="mt-20">
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
                                        <span className="text-[10px] text-slate-600">app.enhancedhr.ai/dashboard</span>
                                    </div>
                                </div>

                                {/* App Content */}
                                <div className="p-6 grid grid-cols-12 gap-4 h-[380px]">
                                    {/* Sidebar */}
                                    <div className="col-span-3 space-y-3">
                                        <div className="p-3 rounded-lg bg-[#4B8BB3]/10 border border-[#4B8BB3]/20">
                                            <div className="text-[10px] font-bold text-[#4B8BB3] uppercase tracking-wider mb-2">Collections</div>
                                            <div className="space-y-1.5">
                                                <div className="h-5 rounded bg-white/[0.06] flex items-center px-2">
                                                    <span className="text-[9px] text-slate-500">Favorites</span>
                                                </div>
                                                <div className="h-5 rounded bg-white/[0.06] flex items-center px-2">
                                                    <span className="text-[9px] text-slate-500">Onboarding Project</span>
                                                </div>
                                                <div className="h-5 rounded bg-white/[0.06] flex items-center px-2">
                                                    <span className="text-[9px] text-slate-500">Leadership Dev</span>
                                                </div>
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

                                    {/* Main Content */}
                                    <div className="col-span-6 space-y-4">
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

                                    {/* AI Panel */}
                                    <div className="col-span-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex flex-col">
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

                                {/* Bottom fade overlay */}
                                <div className="pointer-events-none absolute inset-x-0 -bottom-1 h-20 bg-gradient-to-b from-transparent to-[#070B12]" />
                            </div>
                        </div>
                    </FadeIn>

                    {/* Anchor Navigation Pills */}
                    <FadeIn delay={800}>
                        <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto mt-10">
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

                {/* Bottom fade into site background */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent via-[#0A0D12]/70 to-[#0A0D12]" />
            </section>

            {/* ═══════════════════════════════════════════
                WHY NOW — Pain Points
            ═══════════════════════════════════════════ */}
            <section className="py-24 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:items-start">
                        <div className="lg:col-span-5">
                            <FadeIn>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-slate-400 tracking-wide mb-6">
                                    <Zap size={12} /> WHY NOW
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                                    HR is being asked to do the impossible — at speed.
                                </h2>
                                <p className="mt-5 text-base text-slate-400 leading-relaxed">
                                    AI is reshaping roles, policies, and expectations. The problem isn&apos;t access to content — it&apos;s converting learning and context into decisions, conversations, and change management.
                                </p>
                            </FadeIn>
                        </div>

                        <div className="lg:col-span-7">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    {
                                        icon: <Wand2 size={20} />,
                                        title: 'Learning \u2260 Momentum',
                                        body: 'Most platforms deliver content, then stop. You still have to translate it into plans, docs, and conversations.',
                                        color: '#FF9300',
                                    },
                                    {
                                        icon: <Layers size={20} />,
                                        title: 'Context Is Scattered',
                                        body: 'Policies live in PDFs. Knowledge lives in people. Projects live in 12 tools. AI needs a clean source of truth.',
                                        color: '#4B8BB3',
                                    },
                                    {
                                        icon: <Users size={20} />,
                                        title: 'Teams Need Targeting',
                                        body: 'Different roles, different risks, different learning needs. HR needs segmentation without busywork.',
                                        color: '#4B8BB3',
                                    },
                                    {
                                        icon: <Brain size={20} />,
                                        title: 'AI Can\u2019t Be \u201cBolted On\u201d',
                                        body: 'Generic chat tools don\u2019t understand your platform, your org, or your content. The assistant must be integrated.',
                                        color: '#FF9300',
                                    },
                                ].map((item, i) => (
                                    <FadeIn key={i} delay={i * 80}>
                                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl h-full">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                    style={{ backgroundColor: `${item.color}15`, color: item.color }}
                                                >
                                                    {item.icon}
                                                </div>
                                                <div className="text-white font-semibold text-sm">{item.title}</div>
                                            </div>
                                            <p className="text-sm leading-relaxed text-slate-400">{item.body}</p>
                                        </div>
                                    </FadeIn>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                PLATFORM PILLARS
            ═══════════════════════════════════════════ */}
            <section id="pillars" className="scroll-mt-28 py-28 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-slate-400 tracking-wide mb-6">
                            <Layers size={12} /> THE PLATFORM
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            One Platform. Everything HR Needs.
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            From expert-led courses to AI-powered knowledge management, EnhancedHR enhances every aspect of how you learn, lead, and grow.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[
                            {
                                icon: <BookOpen size={22} />,
                                title: 'Academy',
                                desc: 'World-class courses from industry-leading experts, designed for the realities of modern HR and leadership.',
                                href: '/academy',
                                color: '#4B8BB3',
                            },
                            {
                                icon: <Brain size={22} />,
                                title: 'AI Intelligence',
                                desc: 'Five specialized AI agents woven into every layer of the platform, transforming how you learn and work.',
                                href: '/platform',
                                color: '#78C0F0',
                            },
                            {
                                icon: <FolderOpen size={22} />,
                                title: 'Collections',
                                desc: 'Build personal and team knowledge bases. Add courses, notes, files, videos — then let AI help you synthesize it all.',
                                href: '/collections',
                                color: '#FF9300',
                            },
                            {
                                icon: <Building2 size={22} />,
                                title: 'For Organizations',
                                desc: 'Custom groups, org-specific courses, centralized knowledge bases, and analytics for your entire team.',
                                href: '/organizations',
                                color: '#4B8BB3',
                            },
                            {
                                icon: <Wrench size={22} />,
                                title: 'AI Tools',
                                desc: 'Purpose-built AI tools for HR — from role disruption forecasting to the RolePlay Dojo for difficult conversations.',
                                href: '/ai-tools',
                                color: '#FF2600',
                            },
                            {
                                icon: <Award size={22} />,
                                title: 'Recertification',
                                desc: 'Automatic SHRM PDC and HRCI credit tracking. Audit-proof certificates generated the moment you finish.',
                                href: '#recertification',
                                color: '#FF9300',
                            },
                        ].map((pillar, i) => (
                            <FadeIn key={i} delay={i * 80}>
                                <Link
                                    href={pillar.href}
                                    className="group block p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 h-full"
                                >
                                    <div
                                        className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                                        style={{ backgroundColor: `${pillar.color}15`, color: pillar.color }}
                                    >
                                        {pillar.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                        {pillar.title}
                                        <ChevronRight size={14} className="text-slate-600 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
                                    </h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{pillar.desc}</p>
                                </Link>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                AI SHOWCASE
            ═══════════════════════════════════════════ */}
            <section id="ai-showcase" className="scroll-mt-28 py-28 bg-[#0B1120]/40 relative overflow-hidden">
                {/* Background accents */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4B8BB3]/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#054C74]/8 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Left: Copy */}
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
                                    This isn&apos;t a chatbot bolted onto an LMS. Five specialized AI agents are woven into every layer of the platform — each designed for a specific aspect of your learning and work.
                                </p>
                            </FadeIn>

                            <div className="space-y-5">
                                {[
                                    { name: 'Course Assistant', desc: 'Instant, cited answers from any course. Your on-demand librarian.', icon: <MessageSquare size={16} />, color: '#4B8BB3' },
                                    { name: 'Course Tutor', desc: 'Socratic coaching that adapts to your role, experience, and goals.', icon: <GraduationCap size={16} />, color: '#FF9300' },
                                    { name: 'Platform Assistant', desc: 'Cross-platform intelligence trained on the entire content library.', icon: <Brain size={16} />, color: '#78C0F0' },
                                    { name: 'Collection Assistant', desc: 'Your personal knowledge brain, trained on everything you curate.', icon: <FolderOpen size={16} />, color: '#4B8BB3' },
                                    { name: 'Analytics Assistant', desc: 'Org-level insights on learning patterns, engagement, and ROI.', icon: <BarChart3 size={16} />, color: '#FF9300' },
                                ].map((agent, i) => (
                                    <FadeIn key={i} delay={i * 80}>
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

                            <FadeIn delay={500} className="mt-10">
                                <Link
                                    href="/platform"
                                    className="inline-flex items-center gap-2 text-[#4B8BB3] font-semibold text-sm hover:text-white transition-colors group"
                                >
                                    Explore AI Platform
                                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </FadeIn>
                        </div>

                        {/* Right: AI Chat Mockup */}
                        <FadeIn direction="left" delay={200}>
                            <div className="relative">
                                <div className="absolute -inset-6 bg-gradient-to-tr from-[#4B8BB3]/20 to-[#054C74]/10 rounded-3xl blur-[60px] -z-10" />

                                <div className="bg-[#0A0D12] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
                                    {/* Chat Header */}
                                    <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4B8BB3] to-[#054C74] flex items-center justify-center">
                                            <Sparkles size={14} className="text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">Course Tutor</div>
                                            <div className="text-[10px] text-[#4B8BB3]">Personalized Coaching Mode</div>
                                        </div>
                                        <div className="ml-auto flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[10px] text-slate-500">Active</span>
                                        </div>
                                    </div>

                                    {/* Chat Messages */}
                                    <div className="p-5 space-y-4">
                                        <div className="max-w-[85%] p-3.5 rounded-xl rounded-tl-sm bg-white/[0.04] border border-white/[0.06]">
                                            <p className="text-xs text-slate-300 leading-relaxed">
                                                Welcome back, Sarah. As a Director of People Operations at a 400-person company, let me tailor this to your context. How are you currently handling the AI adoption pushback from your engineering managers?
                                            </p>
                                        </div>

                                        <div className="max-w-[75%] ml-auto p-3.5 rounded-xl rounded-tr-sm bg-[#4B8BB3]/10 border border-[#4B8BB3]/20">
                                            <p className="text-xs text-white leading-relaxed">
                                                They&apos;re worried about their teams being replaced. I&apos;ve tried sharing the company roadmap but it hasn&apos;t landed.
                                            </p>
                                        </div>

                                        <div className="max-w-[85%] p-3.5 rounded-xl rounded-tl-sm bg-white/[0.04] border border-white/[0.06]">
                                            <p className="text-xs text-slate-300 leading-relaxed">
                                                That&apos;s a common pattern. In Module 3, Dr. Chen discusses the <span className="text-[#4B8BB3] font-medium">&quot;Augmentation Narrative&quot;</span> framework — reframing AI as amplifying their teams&apos; strongest capabilities rather than replacing roles. Would you like to role-play that conversation with one of your engineering leads?
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

            {/* ═══════════════════════════════════════════
                THE AGENTS — Different Jobs, Different Assistants
            ═══════════════════════════════════════════ */}
            <section id="the-agents" className="scroll-mt-28 py-28 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                        {/* Left: Copy */}
                        <div className="lg:col-span-4">
                            <FadeIn>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#4B8BB3] mb-4">
                                    The Agents
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
                                    Different jobs need different assistants.
                                </h2>
                                <p className="text-lg text-slate-400 leading-relaxed">
                                    A course librarian should behave differently than a coach. A project assistant should behave differently than an org analytics analyst. EnhancedHR makes that explicit.
                                </p>
                            </FadeIn>
                        </div>

                        {/* Right: Agent Cards Grid */}
                        <div className="lg:col-span-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { name: 'Course Assistant', subtitle: 'Just-in-time answers', desc: 'Ask questions inside a course and get fast, grounded answers based on the course content.', icon: <MessageSquare size={18} />, color: '#4B8BB3' },
                                    { name: 'Course Tutor', subtitle: 'Practice + coaching', desc: 'Turn concepts into skill through roleplays, prompts, and feedback tailored to the learner.', icon: <GraduationCap size={18} />, color: '#FF9300' },
                                    { name: 'Prometheus', subtitle: 'Platform Assistant', desc: 'A high-end assistant that can connect dots across the platform and help you learn and build.', icon: <Sparkles size={18} />, color: '#FF9300' },
                                    { name: 'Collection Assistant', subtitle: 'Your project brain', desc: 'Trained on what you saved into a collection: lessons, docs, notes, videos, and your context.', icon: <FolderOpen size={18} />, color: '#4B8BB3' },
                                    { name: 'Tool Agents', subtitle: 'Structured workflows', desc: 'Purpose-built assistants that guide you through specific HR tasks with structured inputs/outputs.', icon: <Wrench size={18} />, color: '#4B8BB3' },
                                    { name: 'Analytics Assistant', subtitle: 'Org-level insights', desc: 'Summarize engagement and learning trends, and translate patterns into recommended actions.', icon: <BarChart3 size={18} />, color: '#FF9300' },
                                ].map((agent, i) => (
                                    <FadeIn key={i} delay={i * 80}>
                                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                    style={{ backgroundColor: `${agent.color}15`, color: agent.color }}
                                                >
                                                    {agent.icon}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">{agent.name}</div>
                                                    <div className="text-[11px] text-slate-500">{agent.subtitle}</div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-400 leading-relaxed">{agent.desc}</p>
                                        </div>
                                    </FadeIn>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                COLLECTIONS — KNOWLEDGE MANAGEMENT
            ═══════════════════════════════════════════ */}
            <section id="collections" className="scroll-mt-28 py-28 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Left: Visual — Collection Builder */}
                        <FadeIn direction="right">
                            <div className="relative">
                                <div className="absolute -inset-6 bg-[#FF9300]/8 rounded-3xl blur-[60px] -z-10" />

                                <div className="bg-[#0A0D12] border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
                                    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/[0.06]">
                                        <FolderOpen size={16} className="text-[#FF9300]" />
                                        <span className="text-sm font-bold text-white">Strategic Onboarding</span>
                                        <span className="ml-auto text-[10px] text-slate-600">7 items</span>
                                    </div>

                                    <div className="space-y-2.5">
                                        {[
                                            { type: 'Course', name: 'Building a World-Class Onboarding Program', color: '#4B8BB3', icon: <BookOpen size={12} /> },
                                            { type: 'Course', name: 'Strategic HR: First 90 Days', color: '#4B8BB3', icon: <BookOpen size={12} /> },
                                            { type: 'File', name: 'Company_Handbook_2025.pdf', color: '#78C0F0', icon: <Layers size={12} /> },
                                            { type: 'Note', name: 'Onboarding goals and constraints', color: '#FF9300', icon: <Target size={12} /> },
                                            { type: 'Video', name: 'YouTube: Onboarding Best Practices', color: '#FF2600', icon: <Zap size={12} /> },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors group">
                                                <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                                                    {item.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs text-white truncate">{item.name}</div>
                                                    <div className="text-[10px] text-slate-600">{item.type}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* AI Bar */}
                                    <div className="mt-4 p-3 rounded-xl bg-[#FF9300]/5 border border-[#FF9300]/15">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles size={12} className="text-[#FF9300]" />
                                            <span className="text-[10px] font-bold text-[#FF9300]">Collection Assistant</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 leading-relaxed">
                                            Based on the courses and your handbook, I&apos;d recommend structuring Week 1 around cultural immersion before any role-specific training...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>

                        {/* Right: Copy */}
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
                                    Collections are portable, AI-powered knowledge bases. Add courses, notes, files, videos — anything relevant. Then let the Collection Assistant help you synthesize it all.
                                </p>
                            </FadeIn>

                            <FadeIn delay={150}>
                                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-6">
                                    <h4 className="text-sm font-bold text-white mb-3">Example: Onboarding Project</h4>
                                    <ol className="space-y-2.5 text-sm text-slate-400">
                                        <li className="flex gap-2">
                                            <span className="text-[#FF9300] font-bold flex-shrink-0">1.</span>
                                            Create a &quot;Strategic Onboarding&quot; collection
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-[#FF9300] font-bold flex-shrink-0">2.</span>
                                            Add relevant Academy courses on onboarding
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-[#FF9300] font-bold flex-shrink-0">3.</span>
                                            Upload your company handbook and policies
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-[#FF9300] font-bold flex-shrink-0">4.</span>
                                            Add notes on goals, constraints, and timelines
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-[#FF9300] font-bold flex-shrink-0">5.</span>
                                            Ask the Collection Assistant to craft your strategy
                                        </li>
                                    </ol>
                                </div>
                            </FadeIn>

                            <FadeIn delay={250}>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    The AI knows <em>everything</em> in your collection — courses, documents, notes, even YouTube videos. It synthesizes across all sources to give you answers no single resource could provide.
                                </p>
                            </FadeIn>

                            <FadeIn delay={350} className="mt-8">
                                <Link
                                    href="/collections"
                                    className="inline-flex items-center gap-2 text-[#FF9300] font-semibold text-sm hover:text-white transition-colors group"
                                >
                                    Learn More About Collections
                                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </FadeIn>
                        </div>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                FOR ORGANIZATIONS
            ═══════════════════════════════════════════ */}
            <section id="organizations" className="scroll-mt-28 py-28 bg-[#0B1120]/40">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-slate-400 tracking-wide mb-6">
                            <Building2 size={12} /> FOR ORGANIZATIONS
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            Built for Teams, Not Just Individuals
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Give your entire organization an AI-enhanced learning and knowledge management platform — with the tools to manage, measure, and grow.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            {
                                icon: <Users size={22} />,
                                title: 'Custom Groups',
                                desc: 'Create unlimited employee segments — by team, department, onboarding cohort, or custom learning tiers. Assign required or suggested content to each.',
                                color: '#4B8BB3'
                            },
                            {
                                icon: <BookOpen size={22} />,
                                title: 'Org Courses',
                                desc: 'Build and host your own courses using the same AI-enhanced platform. Upload existing video content or create from scratch, then assign to any group.',
                                color: '#78C0F0'
                            },
                            {
                                icon: <FolderOpen size={22} />,
                                title: 'Org Collections',
                                desc: 'Centralized knowledge bases for your org — employee handbooks, policies, procedures. Prometheus learns it all, so employee questions get org-specific answers.',
                                color: '#FF9300'
                            },
                        ].map((feature, i) => (
                            <FadeIn key={i} delay={i * 100}>
                                <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full">
                                    <div
                                        className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                                        style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
                                    >
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>

                    <FadeIn delay={300} className="text-center mt-10">
                        <Link
                            href="/organizations"
                            className="inline-flex items-center gap-2 text-[#4B8BB3] font-semibold text-sm hover:text-white transition-colors group"
                        >
                            See All Organization Features
                            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                RECERTIFICATION
            ═══════════════════════════════════════════ */}
            <section id="recertification" className="scroll-mt-28 py-28 relative">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Visual: Certificate */}
                    <FadeIn direction="right" className="order-2 lg:order-1">
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

                    {/* Copy */}
                    <div className="order-1 lg:order-2">
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-6">
                                <Check size={12} /> AUDIT-PROOF TRACKING
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                                Recertification
                                <br />
                                on Autopilot
                            </h2>
                            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                                Never manually track a credit again. Our system automatically calculates SHRM PDCs and HRCI credits based on your exact watch time.
                            </p>
                        </FadeIn>

                        <FadeIn delay={150}>
                            <ul className="space-y-4">
                                {[
                                    'Automatic SHRM PDC and HRCI credit calculation',
                                    'Instant certificate generation upon completion',
                                    'Audit-proof ledger of your entire learning history',
                                    'Multi-session tracking — pick up where you left off',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                                        <div className="w-5 h-5 rounded-full bg-green-500/15 flex items-center justify-center text-green-400 flex-shrink-0">
                                            <Check size={11} />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </FadeIn>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                PRICING
            ═══════════════════════════════════════════ */}
            <section id="pricing" className="scroll-mt-28 py-28 bg-[#0B1120]/40 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[#4B8BB3]/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative">
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

                    <FadeIn delay={300} className="text-center mt-8">
                        <p className="text-sm text-slate-500 mb-4">7-day free trial on all plans. No credit card required. Cancel anytime.</p>
                        <Link
                            href="/pricing"
                            className="inline-flex items-center gap-2 text-[#4B8BB3] font-semibold text-sm hover:text-white transition-colors group"
                        >
                            View Full Pricing & FAQs
                            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                FOR EXPERTS CTA
            ═══════════════════════════════════════════ */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-6">
                    <FadeIn>
                        <div className="p-10 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#FF9300]/5 rounded-full blur-[80px] pointer-events-none" />
                            <div className="relative">
                                <UserCheck size={32} className="text-[#FF9300] mx-auto mb-4" />
                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Are You an Industry Expert?</h3>
                                <p className="text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
                                    Build courses on a legendary platform and earn commissions based on watch time. Join a growing community of thought leaders shaping the future of HR.
                                </p>
                                <Link
                                    href="/for-experts"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-[#FF9300] font-semibold hover:bg-[#FF9300]/20 transition-all group"
                                >
                                    Learn About Becoming an Expert
                                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                FINAL CTA
            ═══════════════════════════════════════════ */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#4B8BB3]/10 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-4xl mx-auto px-6 text-center relative">
                    <FadeIn>
                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
                            Ready to Enhance
                            <br />
                            Your Organization?
                        </h2>
                        <p className="text-xl text-slate-400 mb-12 max-w-xl mx-auto leading-relaxed">
                            Join the growing community of HR professionals and leaders who are transforming how they learn and lead.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href={ctaHref}
                                className="group inline-flex items-center gap-2 px-10 py-5 rounded-full bg-white text-[#0A0D12] font-bold text-xl hover:bg-[#4B8BB3] hover:text-white transition-all shadow-2xl hover:shadow-[0_0_50px_rgba(75,139,179,0.4)] hover:scale-[1.02]"
                            >
                                {ctaLabel}
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
                </div>
            </section>

        </div>
    );
}
