import React from 'react';
import Link from 'next/link';
import {
    ArrowRight, Check, Brain, MessageSquare, GraduationCap,
    Sparkles, FolderOpen, BarChart3, Bot, Zap, BookOpen,
    FileText, Layers, Target, Users, Shield
} from 'lucide-react';
import FadeIn from '@/components/marketing/FadeIn';

export default function PlatformPage() {
    return (
        <div className="overflow-hidden">

            {/* HERO */}
            <section className="relative py-24 md:py-32">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] bg-[#4B8BB3]/8 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[10%] right-[15%] w-[400px] h-[400px] bg-[#054C74]/10 rounded-full blur-[100px]" />
                </div>
                <div className="max-w-7xl mx-auto px-6 relative">
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
                    </FadeIn>
                </div>
            </section>

            {/* AGENT 1: COURSE ASSISTANT */}
            <section className="py-20 bg-[#0B1120]/40 border-t border-white/[0.04]">
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

            {/* AGENT 2: COURSE TUTOR */}
            <section className="py-20 border-t border-white/[0.04]">
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

            {/* AGENT 3: PLATFORM ASSISTANT (PROMETHEUS) */}
            <section className="py-20 bg-[#0B1120]/40 border-t border-white/[0.04]">
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

            {/* AGENT 4: COLLECTION ASSISTANT */}
            <section id="collections" className="py-20 border-t border-white/[0.04]">
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
                                <div className="grid grid-cols-2 gap-2">
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

            {/* AGENT 5: ANALYTICS ASSISTANT */}
            <section className="py-20 bg-[#0B1120]/40 border-t border-white/[0.04]">
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

            {/* PERSONAL CONTEXT */}
            <section className="py-20 border-t border-white/[0.04]">
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

            {/* CTA */}
            <section className="py-24 bg-[#0B1120]/40 border-t border-white/[0.04]">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <FadeIn>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            Experience AI-Native Learning
                        </h2>
                        <p className="text-lg text-slate-400 mb-10">
                            All five AI agents are included with every plan. Start your free trial and see the difference.
                        </p>
                        <Link
                            href="/login?view=signup"
                            className="group inline-flex items-center gap-2 px-10 py-5 rounded-full bg-white text-[#0A0D12] font-bold text-xl hover:bg-[#4B8BB3] hover:text-white transition-all shadow-2xl hover:shadow-[0_0_50px_rgba(75,139,179,0.4)] hover:scale-[1.02]"
                        >
                            Start Free Trial <ArrowRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </FadeIn>
                </div>
            </section>
        </div>
    );
}
