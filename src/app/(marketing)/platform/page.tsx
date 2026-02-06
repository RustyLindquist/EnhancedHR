import React from 'react';
import Link from 'next/link';
import {
    ArrowRight, Check, Brain, MessageSquare, GraduationCap,
    Sparkles, FolderOpen, BarChart3, Bot, Zap, BookOpen,
    FileText, Layers, Target, Users, Shield, ShieldCheck,
    ChevronRight, Building2, Wrench, Settings, Award, Swords
} from 'lucide-react';
import FadeIn from '@/components/marketing/FadeIn';
import HeroBackground from '@/components/marketing/HeroBackground';
import MarketingDivider from '@/components/marketing/MarketingDivider';

const anchorPills = [
    { label: 'Overview', id: 'overview' },
    { label: 'Course Assistant', id: 'course-assistant' },
    { label: 'Course Tutor', id: 'course-tutor' },
    { label: 'Prometheus', id: 'prometheus' },
    { label: 'Collections', id: 'collections' },
    { label: 'Analytics', id: 'analytics' },
    { label: 'Context', id: 'context-scopes' },
    { label: 'Guardrails', id: 'guardrails' },
];

export default function PlatformPage() {
    return (
        <div className="overflow-hidden">

            {/* HERO */}
            <section className="relative -mt-[72px] bg-[#0A0D12]">
                <HeroBackground />
                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-[120px] pb-20">
                    <FadeIn className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-6">
                            <Bot size={12} /> AI PLATFORM
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8">
                            AI Woven Into
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">Every Layer</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed">
                            Five specialized AI agents. Personal context that gets smarter over time. Collections that become knowledge brains. This is what an AI-native platform actually looks like.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/login?view=signup"
                                className="group px-8 py-4 rounded-full bg-[#4B8BB3] text-white font-bold text-lg hover:bg-[#5a9bc3] transition-all shadow-[0_0_30px_rgba(75,139,179,0.3)] hover:shadow-[0_0_50px_rgba(75,139,179,0.5)] hover:-translate-y-0.5 flex items-center gap-2"
                            >
                                Start Free Trial <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <Link
                                href="/demo"
                                className="px-8 py-4 rounded-full bg-white/[0.04] text-white font-semibold text-lg border border-white/[0.08] hover:bg-white/[0.08] transition-all hover:-translate-y-0.5 flex items-center gap-2"
                            >
                                Schedule a Demo <ArrowRight size={20} className="opacity-50" />
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
                PLATFORM OVERVIEW
            ═══════════════════════════════════════════ */}
            <section id="overview" className="scroll-mt-28 py-20">
                <div className="mx-auto max-w-7xl px-6">
                    <FadeIn className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-6">
                            <Settings size={12} /> THE PLATFORM
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
                            One Platform. Everything HR Needs.
                        </h2>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            From expert-led courses to AI-powered knowledge management, EnhancedHR enhances every aspect of how you learn, lead, and grow.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                        {[
                            { icon: <BookOpen size={20} />, color: '#4B8BB3', title: 'Academy', desc: 'Expert-led courses with AI companions that teach, test, and personalize.', href: '/academy' },
                            { icon: <Brain size={20} />, color: '#4B8BB3', title: 'AI Intelligence', desc: 'Five specialized agents that understand your role, your org, and your goals.', href: '#course-assistant' },
                            { icon: <FolderOpen size={20} />, color: '#FF9300', title: 'Collections', desc: 'Portable knowledge containers powered by AI that synthesize everything inside.', href: '/collections' },
                            { icon: <Building2 size={20} />, color: '#4B8BB3', title: 'For Organizations', desc: 'Team management, assignments, custom courses, and analytics dashboards.', href: '/organizations' },
                            { icon: <Wrench size={20} />, color: '#FF9300', title: 'AI Tools', desc: 'Specialized tools for roleplay, disruption forecasting, and HR strategy.', href: '/ai-tools' },
                            { icon: <Award size={20} />, color: '#4B8BB3', title: 'Recertification', desc: 'Automatic SHRM & HRCI credit tracking with an audit-proof integrity ledger.', href: '/academy#recertification' },
                        ].map((card, i) => (
                            <FadeIn key={card.title} delay={i * 80}>
                                <Link
                                    href={card.href}
                                    className="group flex flex-col p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all h-full"
                                >
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                                        style={{ backgroundColor: `${card.color}15`, color: card.color }}
                                    >
                                        {card.icon}
                                    </div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <h3 className="text-white font-semibold">{card.title}</h3>
                                        <ChevronRight size={14} className="text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
                                </Link>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* AGENT 1: COURSE ASSISTANT */}
            <section id="course-assistant" className="scroll-mt-28 py-20 bg-[#0B1120]/40">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-6">
                                <MessageSquare size={12} /> AGENT 01
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Course Assistant</h2>
                            <p className="text-lg text-slate-400 mb-6 leading-relaxed">
                                Your on-demand librarian for every course. It knows every word of every transcript and can find exactly what you need in seconds — with timestamps and citations.
                            </p>
                        </FadeIn>
                        <FadeIn delay={100}>
                            <ul className="space-y-3">
                                {[
                                    'Instant, cited answers from course transcripts',
                                    'Jump to exact timestamps in video content',
                                    'Summarize any module or the entire course',
                                    'Find connections between topics within a course',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                        <Check size={14} className="text-[#4B8BB3] flex-shrink-0" /> {item}
                                    </li>
                                ))}
                            </ul>
                        </FadeIn>
                    </div>
                    <FadeIn direction="left" delay={150}>
                        <div className="p-5 rounded-2xl bg-[#0A0D12] border border-white/[0.08] shadow-xl">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
                                <div className="w-7 h-7 rounded-full bg-[#4B8BB3]/15 flex items-center justify-center"><MessageSquare size={12} className="text-[#4B8BB3]" /></div>
                                <span className="text-xs font-bold text-white">Course Assistant</span>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.04]">
                                    <p className="text-[11px] text-slate-400">&quot;What frameworks does this course cover for managing AI adoption?&quot;</p>
                                </div>
                                <div className="p-3 rounded-lg bg-[#4B8BB3]/10 border border-[#4B8BB3]/20">
                                    <p className="text-[11px] text-slate-300 leading-relaxed">
                                        The course covers three frameworks: <span className="text-[#4B8BB3] font-medium">1) The Augmentation Narrative</span> (Module 3, 12:34) for reframing AI as capability amplification, <span className="text-[#4B8BB3] font-medium">2) The Human Relevance Matrix</span> (Module 4, 8:22) for evaluating role disruption risk, and <span className="text-[#4B8BB3] font-medium">3) The Change Acceleration Model</span> (Module 6, 3:45) for implementation planning.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* AGENT 2: COURSE TUTOR */}
            <section id="course-tutor" className="scroll-mt-28 py-20">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <FadeIn direction="right" className="order-2 lg:order-1">
                        <div className="p-5 rounded-2xl bg-[#0A0D12] border border-white/[0.08] shadow-xl">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
                                <div className="w-7 h-7 rounded-full bg-[#FF9300]/15 flex items-center justify-center"><GraduationCap size={12} className="text-[#FF9300]" /></div>
                                <span className="text-xs font-bold text-white">Course Tutor</span>
                                <span className="ml-auto text-[10px] text-[#FF9300]">Personalized Mode</span>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.04]">
                                    <p className="text-[11px] text-slate-300">Based on your role as VP of People at a 300-person fintech, let&apos;s apply the Augmentation Narrative to your specific challenge with the engineering team. How would you open that conversation?</p>
                                </div>
                                <div className="p-3 rounded-lg bg-[#FF9300]/10 border border-[#FF9300]/20 ml-4">
                                    <p className="text-[11px] text-white">&quot;I&apos;d start by acknowledging their concerns directly...&quot;</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.04]">
                                    <p className="text-[11px] text-slate-300">Good instinct. Now, the course suggests leading with data first. What metric from your org would best demonstrate AI as an amplifier rather than a replacement?</p>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                    <div className="order-1 lg:order-2">
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-6">
                                <GraduationCap size={12} /> AGENT 02
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Course Tutor</h2>
                            <p className="text-lg text-slate-400 mb-6 leading-relaxed">
                                A proactive Socratic coach that learns your role, industry, company, and experience — then creates a completely personalized path through the material. It doesn&apos;t just answer; it challenges you to apply.
                            </p>
                        </FadeIn>
                        <FadeIn delay={100}>
                            <ul className="space-y-3">
                                {[
                                    'Gathers your context through natural conversation',
                                    'Builds personalized learning paths through course content',
                                    'Role-plays scenarios tailored to your actual job',
                                    'Saves your context so it gets smarter across courses',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                        <Check size={14} className="text-[#FF9300] flex-shrink-0" /> {item}
                                    </li>
                                ))}
                            </ul>
                        </FadeIn>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* AGENT 3: PLATFORM ASSISTANT (PROMETHEUS) */}
            <section id="prometheus" className="scroll-mt-28 py-20 bg-[#0B1120]/40">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#78C0F0]/10 border border-[#78C0F0]/20 text-xs font-medium text-[#78C0F0] tracking-wide mb-6">
                                <Brain size={12} /> AGENT 03
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Platform Assistant</h2>
                            <div className="text-sm text-[#78C0F0] mb-4 font-medium">Prometheus</div>
                            <p className="text-lg text-slate-400 mb-6 leading-relaxed">
                                Cross-platform intelligence trained on the entire content library. Prometheus connects dots between courses, creates custom training regimens, and is available everywhere in the platform. It knows your personal context from every previous interaction.
                            </p>
                        </FadeIn>
                        <FadeIn delay={100}>
                            <ul className="space-y-3">
                                {[
                                    'Trained on ALL courses, content, and your personal context',
                                    'Creates custom learning paths across the entire library',
                                    'Available from the dashboard and throughout the platform',
                                    'Gets smarter about you with every conversation',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                        <Check size={14} className="text-[#78C0F0] flex-shrink-0" /> {item}
                                    </li>
                                ))}
                            </ul>
                        </FadeIn>
                    </div>
                    <FadeIn direction="left" delay={150}>
                        <div className="p-5 rounded-2xl bg-[#0A0D12] border border-white/[0.08] shadow-xl">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4B8BB3] to-[#054C74] flex items-center justify-center"><Sparkles size={12} className="text-white" /></div>
                                <span className="text-xs font-bold text-white">Prometheus</span>
                                <span className="ml-auto flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /><span className="text-[10px] text-slate-500">Active</span></span>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.04]">
                                    <p className="text-[11px] text-slate-400">&quot;I need to build a 90-day plan for our new HR team. What should I focus on?&quot;</p>
                                </div>
                                <div className="p-3 rounded-lg bg-[#78C0F0]/10 border border-[#78C0F0]/20">
                                    <p className="text-[11px] text-slate-300 leading-relaxed">
                                        Based on your company context (300-person fintech, rapid growth) and three relevant courses in the library, I&apos;d suggest structuring your 90-day plan around: <span className="text-[#78C0F0] font-medium">Week 1-2: Audit & Listen</span>, <span className="text-[#78C0F0] font-medium">Week 3-6: Quick Wins</span>, <span className="text-[#78C0F0] font-medium">Week 7-12: Strategic Foundation</span>. Want me to create a detailed plan with specific course recommendations for each phase?
                                    </p>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* AGENT 4: COLLECTION ASSISTANT */}
            <section id="collections" className="scroll-mt-28 py-20">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <FadeIn direction="right" className="order-2 lg:order-1">
                        <div className="p-5 rounded-2xl bg-[#0A0D12] border border-white/[0.08] shadow-xl">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
                                <FolderOpen size={14} className="text-[#FF9300]" />
                                <span className="text-xs font-bold text-white">Onboarding Strategy</span>
                                <span className="ml-auto text-[10px] text-slate-600">5 items</span>
                            </div>
                            <div className="space-y-2 mb-4">
                                {[
                                    { name: 'Onboarding Mastery Course', type: 'Course', icon: <BookOpen size={10} />, color: '#4B8BB3' },
                                    { name: 'Company Handbook v3.pdf', type: 'File', icon: <FileText size={10} />, color: '#78C0F0' },
                                    { name: 'Goals & constraints note', type: 'Note', icon: <Target size={10} />, color: '#FF9300' },
                                    { name: 'Best Practices (YouTube)', type: 'Video', icon: <Zap size={10} />, color: '#FF2600' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: `${item.color}15`, color: item.color }}>{item.icon}</div>
                                        <div className="text-[11px] text-white flex-1">{item.name}</div>
                                        <div className="text-[9px] text-slate-600">{item.type}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 rounded-lg bg-[#FF9300]/5 border border-[#FF9300]/15">
                                <div className="flex items-center gap-1 mb-1"><Sparkles size={10} className="text-[#FF9300]" /><span className="text-[10px] font-bold text-[#FF9300]">Collection Assistant</span></div>
                                <p className="text-[11px] text-slate-400">Combining insights from the onboarding course with your handbook policies, here&apos;s a draft Week 1 schedule that aligns with your stated goals...</p>
                            </div>
                        </div>
                    </FadeIn>
                    <div className="order-1 lg:order-2">
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-6">
                                <FolderOpen size={12} /> AGENT 04
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Collection Assistant</h2>
                            <p className="text-lg text-slate-400 mb-6 leading-relaxed">
                                Build a collection. Add courses, notes, files, videos — anything. The Collection Assistant is trained on everything you add, synthesizing across all sources to help you think, plan, and create.
                            </p>
                        </FadeIn>
                        <FadeIn delay={100}>
                            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                <h4 className="text-sm font-bold text-white mb-3">What you can add:</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {['Academy courses', 'Individual lessons', 'Notes & ideas', 'Uploaded files', 'YouTube videos', 'AI conversations'].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                                            <Check size={12} className="text-[#FF9300] flex-shrink-0" /> {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* AGENT 5: ANALYTICS ASSISTANT */}
            <section id="analytics" className="scroll-mt-28 py-20 bg-[#0B1120]/40">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-6">
                                <BarChart3 size={12} /> AGENT 05
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Analytics Assistant</h2>
                            <p className="text-lg text-slate-400 mb-6 leading-relaxed">
                                For organizational administrators. Trained on all usage data from your org, it extracts deep insights on learning patterns, engagement, and what your teams are asking about — so you can make smarter decisions about development.
                            </p>
                        </FadeIn>
                        <FadeIn delay={100}>
                            <ul className="space-y-3">
                                {[
                                    'Learning engagement trends across teams',
                                    'What topics your people are asking Prometheus about',
                                    'Training effectiveness and ROI metrics',
                                    'Recommendations for content and development priorities',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                        <Check size={14} className="text-[#FF9300] flex-shrink-0" /> {item}
                                    </li>
                                ))}
                            </ul>
                        </FadeIn>
                    </div>
                    <FadeIn direction="left" delay={150}>
                        <div className="p-5 rounded-2xl bg-[#0A0D12] border border-white/[0.08] shadow-xl">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
                                <div className="w-7 h-7 rounded-full bg-[#FF9300]/15 flex items-center justify-center"><BarChart3 size={12} className="text-[#FF9300]" /></div>
                                <span className="text-xs font-bold text-white">Analytics Assistant</span>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.04]">
                                    <p className="text-[11px] text-slate-400">&quot;What are the most common questions our team is asking this month?&quot;</p>
                                </div>
                                <div className="p-3 rounded-lg bg-[#FF9300]/10 border border-[#FF9300]/20">
                                    <p className="text-[11px] text-slate-300 leading-relaxed">
                                        This month, your team&apos;s top question themes are: <span className="text-[#FF9300] font-medium">1) AI adoption strategies</span> (34% of queries), <span className="text-[#FF9300] font-medium">2) Performance management</span> (22%), and <span className="text-[#FF9300] font-medium">3) Remote team communication</span> (18%). AI adoption questions spiked 3x after last week&apos;s all-hands meeting.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* AI TOOLS */}
            <section className="py-20">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <FadeIn>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#4B8BB3] mb-4">
                                    AI Tools
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                                    Not chatbots. Tools.
                                </h2>
                                <p className="text-lg text-slate-400 leading-relaxed">
                                    Use structured AI workflows for real HR work&mdash;skills planning, disruption analysis, and conversation prep. Save the outputs into collections and reuse them across projects.
                                </p>
                            </FadeIn>
                        </div>

                        <FadeIn delay={150}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { icon: <Target size={20} />, color: '#FF9300', title: 'Role Disruption', desc: 'Forecast how AI changes a role, then plan the skills and transitions proactively.' },
                                    { icon: <Swords size={20} />, color: '#4B8BB3', title: 'Roleplay Dojo', desc: 'Practice tough conversations with an AI trained for coaching\u2014not generic advice.' },
                                    { icon: <Layers size={20} />, color: '#4B8BB3', title: 'Skills Gaps', desc: 'Identify gaps and map learning to outcomes for individuals, teams, or roles.' },
                                    { icon: <Wrench size={20} />, color: '#FF9300', title: 'Tool Library', desc: 'A growing inventory of tools designed specifically for HR and leaders.' },
                                ].map((card, i) => (
                                    <FadeIn key={card.title} delay={100 + i * 80}>
                                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                                                style={{ backgroundColor: `${card.color}15`, color: card.color }}
                                            >
                                                {card.icon}
                                            </div>
                                            <h3 className="text-base font-bold text-white mb-2">{card.title}</h3>
                                            <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
                                        </div>
                                    </FadeIn>
                                ))}
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* CONTEXT SCOPES */}
            <section id="context-scopes" className="scroll-mt-28 py-20 bg-[#0B1120]/40">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
                        <div className="lg:col-span-5">
                            <FadeIn>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#4B8BB3]">
                                    Context Engineering
                                </div>
                                <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    AI accuracy comes from boundaries.
                                </h2>
                                <p className="mt-5 text-base leading-relaxed text-slate-400">
                                    EnhancedHR uses a retrieval layer that pulls only the most relevant context, from the correct scope, and layers in personal context for relevance.
                                </p>
                                <div className="mt-7">
                                    <Link
                                        href="/collections"
                                        className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors"
                                    >
                                        Learn About Collections <ArrowRight size={16} className="opacity-70" />
                                    </Link>
                                </div>
                            </FadeIn>
                        </div>

                        <div className="lg:col-span-7">
                            <FadeIn direction="left" delay={150}>
                                <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0B1120]/60 p-7 backdrop-blur-xl">
                                    <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#4B8BB3]/8 blur-[100px]" />
                                    <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-[#FF9300]/6 blur-[110px]" />

                                    <div className="relative">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#4B8BB3]">
                                            Context Scopes
                                        </div>
                                        <div className="mt-3 text-xl font-bold text-white">
                                            The agent is only as smart as its scope.
                                        </div>
                                        <p className="mt-3 text-sm leading-relaxed text-slate-400">
                                            EnhancedHR resolves the right scope automatically: course-only for accuracy, collection-only for projects, org-only for policies, plus personal context for relevance.
                                        </p>

                                        {/* SVG Diagram */}
                                        <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.06] bg-black/20">
                                            <div className="relative aspect-[16/10] w-full">
                                                <svg
                                                    viewBox="0 0 640 400"
                                                    className="absolute inset-0 h-full w-full"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    aria-hidden="true"
                                                >
                                                    <defs>
                                                        <linearGradient id="scope-line" x1="0" y1="0" x2="1" y2="1">
                                                            <stop offset="0" stopColor="#78C0F0" stopOpacity="0.95" />
                                                            <stop offset="0.6" stopColor="#054C74" stopOpacity="0.7" />
                                                            <stop offset="1" stopColor="#FF9300" stopOpacity="0.85" />
                                                        </linearGradient>
                                                        <radialGradient id="scope-dot" cx="50%" cy="50%" r="50%">
                                                            <stop offset="0" stopColor="#78C0F0" stopOpacity="1" />
                                                            <stop offset="1" stopColor="#78C0F0" stopOpacity="0.18" />
                                                        </radialGradient>
                                                    </defs>

                                                    {/* Rings */}
                                                    <g fill="none" stroke="url(#scope-line)" strokeWidth="1.6" opacity="0.55">
                                                        <circle cx="320" cy="200" r="70" strokeDasharray="7 10" className="animate-border-flow" />
                                                        <circle cx="320" cy="200" r="130" strokeDasharray="12 14" className="animate-border-flow" />
                                                        <circle cx="320" cy="200" r="180" strokeDasharray="16 16" className="animate-border-flow" />
                                                    </g>

                                                    {/* Spokes */}
                                                    <g fill="none" stroke="url(#scope-line)" strokeWidth="1.6" opacity="0.5">
                                                        <path d="M320 200 L320 35" strokeDasharray="220" className="animate-border-flow" />
                                                        <path d="M320 200 L520 110" strokeDasharray="220" className="animate-border-flow" />
                                                        <path d="M320 200 L548 235" strokeDasharray="220" className="animate-border-flow" />
                                                        <path d="M320 200 L430 356" strokeDasharray="220" className="animate-border-flow" />
                                                        <path d="M320 200 L165 315" strokeDasharray="220" className="animate-border-flow" />
                                                        <path d="M320 200 L120 150" strokeDasharray="220" className="animate-border-flow" />
                                                    </g>

                                                    {/* Dots */}
                                                    <g>
                                                        <circle cx="320" cy="200" r="14" fill="url(#scope-dot)" />
                                                        <circle cx="320" cy="35" r="10" fill="url(#scope-dot)" />
                                                        <circle cx="520" cy="110" r="10" fill="url(#scope-dot)" />
                                                        <circle cx="548" cy="235" r="10" fill="url(#scope-dot)" />
                                                        <circle cx="430" cy="356" r="10" fill="url(#scope-dot)" />
                                                        <circle cx="165" cy="315" r="10" fill="url(#scope-dot)" />
                                                        <circle cx="120" cy="150" r="10" fill="url(#scope-dot)" />
                                                    </g>
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Scope Cards */}
                                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                            {[
                                                { t: 'COURSE', d: 'Only the active course (accuracy-first).' },
                                                { t: 'COLLECTION', d: 'Only what\u2019s saved in the collection (project-first).' },
                                                { t: 'ORG', d: 'Org knowledge + org courses (policy + enablement).' },
                                                { t: 'PERSONAL', d: 'Role, goals, constraints (relevance-first).' },
                                            ].map((row) => (
                                                <div key={row.t} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                                                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                                        {row.t}
                                                    </div>
                                                    <div className="mt-1 text-sm font-semibold text-white/90">{row.d}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* GUARDRAILS */}
            <section id="guardrails" className="scroll-mt-28 py-20">
                <div className="mx-auto max-w-7xl px-6">
                    <FadeIn>
                        <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-10 backdrop-blur-xl">
                            <div className="absolute -left-36 -top-36 h-96 w-96 rounded-full bg-[#4B8BB3]/8 blur-[110px]" />
                            <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-[#FF9300]/6 blur-[120px]" />
                            <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center">
                                <div className="lg:col-span-7">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#4B8BB3]">
                                        Guardrails
                                    </div>
                                    <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                        Built for organizations, not experiments.
                                    </h2>
                                    <p className="mt-5 text-base leading-relaxed text-slate-400">
                                        Scope boundaries, org isolation, and permissioned access are designed into the system. The goal is not &ldquo;more AI.&rdquo; The goal is AI that stays accurate and relevant — without leaking across contexts.
                                    </p>
                                    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                                        <Link
                                            href="/pricing"
                                            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4B8BB3] px-6 py-3 text-sm font-bold text-white hover:bg-white hover:text-[#0A0D12] transition-colors shadow-[0_0_20px_rgba(75,139,179,0.25)]"
                                        >
                                            Pricing <ArrowRight size={16} />
                                        </Link>
                                        <Link
                                            href="/login?view=signup"
                                            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors"
                                        >
                                            Get Started <ArrowRight size={16} className="opacity-70" />
                                        </Link>
                                    </div>
                                </div>

                                <div className="lg:col-span-5">
                                    <div className="grid gap-3">
                                        {[
                                            { t: 'Scoped retrieval', d: 'Course-only answers stay course-only.' },
                                            { t: 'Org isolation', d: 'Org data stays in-org.' },
                                            { t: 'Personal context', d: 'Relevance without overreach.' },
                                            { t: 'Cited answers', d: 'Grounded outputs you can trust.' },
                                        ].map((row) => (
                                            <div
                                                key={row.t}
                                                className="rounded-xl border border-white/[0.06] bg-black/20 px-5 py-4"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <ShieldCheck size={18} className="text-[#4B8BB3]" />
                                                    <div className="text-white font-semibold">{row.t}</div>
                                                </div>
                                                <p className="mt-2 text-sm text-slate-400">{row.d}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* PERSONAL CONTEXT */}
            <section className="py-20 bg-[#0B1120]/40">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
                            The More You Use It,
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">The Smarter It Gets</span>
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Every AI agent has access to your personal context — your role, experience, company, and goals. Auto-saved insights from conversations make every interaction more relevant than the last.
                        </p>
                    </FadeIn>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
                        {[
                            { icon: <Users size={20} />, title: 'Your Profile', desc: 'Role, industry, company size, experience level — gathered naturally through conversation.', color: '#4B8BB3' },
                            { icon: <Sparkles size={20} />, title: 'Auto-Insights', desc: 'Key learnings and preferences are saved automatically from every AI conversation.', color: '#FF9300' },
                            { icon: <Layers size={20} />, title: 'Cross-Agent Memory', desc: 'Context gathered by one agent is available to all others. No repeating yourself.', color: '#78C0F0' },
                        ].map((item, i) => (
                            <FadeIn key={i} delay={i * 100}>
                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${item.color}15`, color: item.color }}>{item.icon}</div>
                                    <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* CTA */}
            <section className="py-24">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <FadeIn>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            Deeply integrated AI. Scoped. Grounded. Useful.
                        </h2>
                        <p className="text-lg text-slate-400 mb-10">
                            EnhancedHR doesn&apos;t ship &ldquo;an AI chat.&rdquo; It ships a network of agents — each with a specific job, a specific context scope, and a retrieval layer that keeps answers anchored to your content.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/login?view=signup"
                                className="group inline-flex items-center gap-2 px-10 py-5 rounded-full bg-white text-[#0A0D12] font-bold text-xl hover:bg-[#4B8BB3] hover:text-white transition-all shadow-2xl hover:shadow-[0_0_50px_rgba(75,139,179,0.4)] hover:scale-[1.02]"
                            >
                                Start Free Trial <ArrowRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
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
