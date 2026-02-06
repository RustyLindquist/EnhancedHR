import React from 'react';
import Link from 'next/link';
import {
    ArrowRight, Check, BookOpen, GraduationCap, Brain, Zap,
    Award, MessageSquare, Sparkles, Clock, Shield, PlayCircle,
    Users, Target, FileText
} from 'lucide-react';
import FadeIn from '@/components/marketing/FadeIn';
import MarketingDivider from '@/components/marketing/MarketingDivider';

const anchorPills = [
    { label: 'Expert-Led', id: 'expert-led' },
    { label: 'AI-Enhanced', id: 'ai-enhanced' },
    { label: 'Integrity Ledger', id: 'integrity-ledger' },
    { label: 'Recertification', id: 'recertification' },
    { label: 'Experience', id: 'experience' },
];

export default function AcademyPage() {
    return (
        <div className="overflow-hidden">

            {/* HERO */}
            <section className="relative py-24 md:py-32">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-[#4B8BB3]/8 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-[10%] w-[500px] h-[500px] bg-[#054C74]/10 rounded-full blur-[100px]" />
                </div>
                <div className="max-w-7xl mx-auto px-6 relative">
                    <FadeIn className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-6">
                            <BookOpen size={12} /> THE ACADEMY
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8">
                            Learn From the
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">Best in HR</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed">
                            Expert-led courses on leadership, AI adoption, communication, and strategic HR — designed for the realities of today&apos;s workplace, not yesterday&apos;s textbooks.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/login?view=signup"
                                className="group px-8 py-4 rounded-full bg-[#4B8BB3] text-white font-bold text-lg hover:bg-[#5a9bc3] transition-all shadow-[0_0_30px_rgba(75,139,179,0.3)] hover:shadow-[0_0_50px_rgba(75,139,179,0.5)] flex items-center gap-2"
                            >
                                Get Started <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <Link
                                href="/demo"
                                className="px-8 py-4 rounded-full bg-white/[0.04] text-white font-semibold text-lg border border-white/[0.08] hover:bg-white/[0.08] transition-all flex items-center gap-2"
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

            {/* EXPERT-LED LEARNING */}
            <section id="expert-led" className="scroll-mt-28 py-24 bg-[#0B1120]/40">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <FadeIn>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-6">
                                    <Users size={12} /> EXPERT-LED
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                                    Built by Practitioners,
                                    <br />
                                    Not Theorists
                                </h2>
                                <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                                    Every course is created by industry practitioners who live the work every day. Modern, conversational, and applied — designed for HR teams at growing organizations, not Fortune 500 theory.
                                </p>
                            </FadeIn>
                            <FadeIn delay={150}>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        'Leadership Development',
                                        'AI & Workforce Transformation',
                                        'Communication Skills',
                                        'People Operations',
                                        'Strategic HR',
                                        'Change Management',
                                    ].map((topic, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                            <Check size={14} className="text-[#4B8BB3] flex-shrink-0" />
                                            {topic}
                                        </div>
                                    ))}
                                </div>
                            </FadeIn>
                        </div>

                        {/* Course Card Mockup */}
                        <FadeIn direction="left" delay={200}>
                            <div className="relative">
                                <div className="absolute -inset-4 bg-[#4B8BB3]/10 rounded-3xl blur-[50px] -z-10" />
                                <div className="space-y-4">
                                    {[
                                        { title: 'Leading Through AI Disruption', author: 'Dr. Sarah Chen', credits: '1.5 SHRM PDCs', lessons: 12, color: '#4B8BB3' },
                                        { title: 'The Human Relevance Framework', author: 'Rusty Lindquist', credits: '2.0 SHRM PDCs', lessons: 18, color: '#FF9300' },
                                        { title: 'Strategic Onboarding Mastery', author: 'Maria Santos', credits: '1.0 SHRM PDCs', lessons: 8, color: '#78C0F0' },
                                    ].map((course, i) => (
                                        <div key={i} className="p-5 rounded-xl bg-[#0A0D12] border border-white/[0.08] flex items-center gap-5 group hover:border-white/[0.12] transition-colors">
                                            <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${course.color}15` }}>
                                                <PlayCircle size={24} style={{ color: course.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-white mb-1">{course.title}</div>
                                                <div className="text-xs text-slate-500 mb-2">{course.author}</div>
                                                <div className="flex items-center gap-3 text-[10px] text-slate-600">
                                                    <span className="px-2 py-0.5 rounded bg-[#FF9300]/10 text-[#FF9300] font-bold">{course.credits}</span>
                                                    <span>{course.lessons} lessons</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* AI-ENHANCED LEARNING */}
            <section id="ai-enhanced" className="scroll-mt-28 py-24 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-6">
                            <Brain size={12} /> AI-ENHANCED
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            Every Course Comes With
                            <br />
                            Two AI Companions
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Static video is dead. Every course pairs expert instruction with a dual-layer AI system that transforms passive watching into active learning.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Course Assistant */}
                        <FadeIn delay={100}>
                            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full">
                                <div className="w-12 h-12 rounded-xl bg-[#4B8BB3]/15 flex items-center justify-center mb-6">
                                    <MessageSquare size={22} className="text-[#4B8BB3]" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Course Assistant</h3>
                                <p className="text-slate-400 mb-6 leading-relaxed">
                                    Your on-demand librarian for every course. Ask any question and get instant, cited answers pulled directly from the course transcript — with timestamps so you can jump right to the relevant moment.
                                </p>
                                {/* Mini mockup */}
                                <div className="p-4 rounded-xl bg-[#0A0D12] border border-white/[0.06]">
                                    <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.04] mb-3">
                                        <p className="text-[11px] text-slate-400">&quot;What does the instructor say about handling resistance to AI adoption?&quot;</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-[#4B8BB3]/10 border border-[#4B8BB3]/20">
                                        <p className="text-[11px] text-slate-300 leading-relaxed">
                                            In Module 3 at <span className="text-[#4B8BB3] font-medium">12:34</span>, Dr. Chen explains that resistance typically stems from fear of obsolescence. She recommends the &quot;Augmentation Narrative&quot; approach...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>

                        {/* Course Tutor */}
                        <FadeIn delay={200}>
                            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full">
                                <div className="w-12 h-12 rounded-xl bg-[#FF9300]/15 flex items-center justify-center mb-6">
                                    <GraduationCap size={22} className="text-[#FF9300]" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Course Tutor</h3>
                                <p className="text-slate-400 mb-6 leading-relaxed">
                                    A proactive coach that learns your role, industry, and experience level, then builds a completely personalized path through the content — with Socratic questioning that challenges you to apply what you learn.
                                </p>
                                {/* Mini mockup */}
                                <div className="p-4 rounded-xl bg-[#0A0D12] border border-white/[0.06]">
                                    <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.04] mb-3">
                                        <p className="text-[11px] text-slate-300 leading-relaxed">
                                            I see you manage a team of 12 at a tech startup. Based on Module 2, how would <em>you</em> introduce the new performance framework to your skeptical senior engineer?
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-[#FF9300]/10 border border-[#FF9300]/20">
                                        <p className="text-[11px] text-white leading-relaxed">
                                            I&apos;d probably start with a 1:1 to understand their concerns...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* THE INTEGRITY LEDGER */}
            <section id="integrity-ledger" className="scroll-mt-28 py-24 bg-[#0B1120]/40">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-6">
                                <Shield size={12} /> PROTOCOL: COMPLIANCE
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                                The Integrity Ledger.
                            </h2>
                            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                                Your career history should be immutable. We built an audit-proof ledger that mints SHRM &amp; HRCI credits automatically as you learn.
                            </p>
                        </FadeIn>
                        <FadeIn delay={150}>
                            <ul className="space-y-4">
                                {[
                                    'Real-time watch verification',
                                    'Instant Certificate Minting',
                                    'Immutable History',
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

                    {/* Ledger Card Mockup */}
                    <FadeIn direction="left" delay={200}>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-[#4B8BB3]/10 rounded-3xl blur-[50px] -z-10" />
                            <div className="p-8 rounded-2xl bg-[#0A0D12] border border-white/[0.08] shadow-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-[#FF9300]/15 flex items-center justify-center">
                                        <Shield size={20} className="text-[#FF9300]" />
                                    </div>
                                    <div className="ml-auto text-right">
                                        <div className="text-[10px] text-slate-600 uppercase tracking-wider font-bold">Hash</div>
                                        <div className="text-xs text-slate-500 font-mono">0x7E&hellip;302A</div>
                                    </div>
                                </div>
                                <div className="text-4xl font-bold text-white mb-2">60.0 Credits</div>
                                <div className="text-sm text-slate-500">SHRM-CP / HRCI Verified</div>
                                <div className="mt-6 pt-6 border-t border-white/[0.06] grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-lg font-bold text-white">24</div>
                                        <div className="text-[10px] text-slate-600 uppercase tracking-wider">Courses</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-white">100%</div>
                                        <div className="text-[10px] text-slate-600 uppercase tracking-wider">Verified</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-white">Audit</div>
                                        <div className="text-[10px] text-slate-600 uppercase tracking-wider">Ready</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* RECERTIFICATION */}
            <section id="recertification" className="scroll-mt-28 py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-6">
                            <Check size={12} /> SHRM &amp; HRCI APPROVED
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            Recertification without the <em className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-[#FF9300] to-[#FF2600] line-through decoration-white/30">boredom</em>.
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Need 60 credits? We make it easy, engaging, and automatic. Our audit-proof ledger tracks every second, so you don&apos;t have to.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {[
                            { title: 'Auto-Tracking', desc: 'PDCs calculated automatically as you watch.', color: '#4B8BB3' },
                            { title: 'Instant Certificates', desc: 'Download verifiable proof immediately.', color: '#4B8BB3' },
                            { title: 'Audit-Safe Ledger', desc: 'Your history is stored forever.', color: '#4B8BB3' },
                        ].map((card, i) => (
                            <FadeIn key={i} delay={i * 100}>
                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                                    <div className="w-10 h-10 rounded-full bg-[#4B8BB3]/15 flex items-center justify-center mx-auto mb-4">
                                        <Check size={18} className="text-[#4B8BB3]" />
                                    </div>
                                    <h3 className="text-base font-bold text-white mb-2">{card.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* COURSE EXPERIENCE */}
            <section id="experience" className="scroll-mt-28 py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            A Learning Experience
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">You&apos;ll Actually Enjoy</span>
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Not a 2005-era slide deck. A beautiful, modern platform that respects your time and taste.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            { icon: <PlayCircle size={22} />, title: 'HD Video Player', desc: 'Beautiful video playback with smart progress tracking across sessions.', color: '#4B8BB3' },
                            { icon: <FileText size={22} />, title: 'Lesson Notes', desc: 'Take notes directly within each lesson. They save with the course for easy reference.', color: '#78C0F0' },
                            { icon: <Target size={22} />, title: 'Quizzes & Assessments', desc: 'Test your knowledge with per-question feedback and customizable passing scores.', color: '#FF9300' },
                            { icon: <Clock size={22} />, title: 'Progress Tracking', desc: 'Visual progress across modules and lessons. Pick up exactly where you left off.', color: '#4B8BB3' },
                            { icon: <Zap size={22} />, title: 'AI Panel', desc: 'Course Assistant and Tutor live right next to your video, always one click away.', color: '#FF9300' },
                            { icon: <BookOpen size={22} />, title: 'Module Structure', desc: 'Courses organized into clear modules with drag-and-drop lesson navigation.', color: '#78C0F0' },
                        ].map((feature, i) => (
                            <FadeIn key={i} delay={i * 80}>
                                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${feature.color}15`, color: feature.color }}>
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* CTA */}
            <section className="py-24 bg-[#0B1120]/40 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 right-[10%] w-[500px] h-[400px] bg-[#4B8BB3]/6 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-[20%] w-[400px] h-[300px] bg-[#054C74]/8 rounded-full blur-[100px]" />
                </div>
                <div className="max-w-7xl mx-auto px-6 relative">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <FadeIn>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-6">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF9300]" /> HR, Oxygenated by AI
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                                    Don&apos;t just Learn.<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9300] via-[#FF2600] to-[#9333ea]">Build Knowledge.</span>
                                </h2>
                                <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-lg">
                                    The first AI-Native Academy that transforms static courses into living, conversational knowledge repositories. Tailored to you. Trained on your company.
                                </p>
                                <div className="flex flex-col sm:flex-row items-start gap-4">
                                    <Link
                                        href="/login?view=signup"
                                        className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#FF9300] text-white font-bold text-lg hover:bg-[#FFa520] transition-all shadow-[0_0_30px_rgba(255,147,0,0.3)]"
                                    >
                                        Start Free Trial <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                                    </Link>
                                    <Link
                                        href="/demo"
                                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/[0.04] text-white font-semibold text-lg border border-white/[0.08] hover:bg-white/[0.08] transition-all"
                                    >
                                        Schedule a Demo <ArrowRight size={20} className="opacity-50" />
                                    </Link>
                                </div>
                            </FadeIn>
                        </div>

                        <FadeIn direction="left" delay={150}>
                            <div className="relative">
                                {/* Blue glow behind cards */}
                                <div className="absolute inset-0 -inset-x-8">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[350px] bg-[#4B8BB3]/12 rounded-full blur-[80px]" />
                                    <div className="absolute top-1/3 left-1/3 w-[250px] h-[200px] bg-[#78C0F0]/8 rounded-full blur-[60px]" />
                                </div>
                                {/* Floating cards mockup */}
                                <div className="relative h-[380px]">
                                    {/* Advanced Leadership pill */}
                                    <div className="absolute top-0 right-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A0D12] border border-white/[0.08] shadow-xl">
                                        <GraduationCap size={14} className="text-[#4B8BB3]" />
                                        <span className="text-xs font-semibold text-white">Advanced Leadership</span>
                                    </div>

                                    {/* AI Tutor card */}
                                    <div className="absolute top-12 right-0 w-72 p-5 rounded-2xl bg-[#0A0D12] border border-white/[0.08] shadow-2xl">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-[#FF9300]/15 flex items-center justify-center">
                                                <Brain size={14} className="text-[#FF9300]" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-white">AI Tutor</div>
                                                <div className="text-[10px] text-slate-500">Context: Onboarding 101</div>
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-[#FF9300]/5 border border-[#FF9300]/15">
                                            <p className="text-[11px] text-slate-300 leading-relaxed">
                                                Based on your company handbook and the &ldquo;Culture Code&rdquo; module, here is a draft onboarding email for the new hire...
                                            </p>
                                        </div>
                                    </div>

                                    {/* Company Handbook pill */}
                                    <div className="absolute bottom-8 right-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A0D12] border border-white/[0.08] shadow-xl">
                                        <FileText size={14} className="text-[#78C0F0]" />
                                        <span className="text-xs font-semibold text-white">Company Handbook.pdf</span>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>
        </div>
    );
}
