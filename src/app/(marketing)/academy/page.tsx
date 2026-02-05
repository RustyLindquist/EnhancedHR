import React from 'react';
import Link from 'next/link';
import {
    ArrowRight, Check, BookOpen, GraduationCap, Brain, Zap,
    Award, MessageSquare, Sparkles, Clock, Shield, PlayCircle,
    Users, Target, FileText
} from 'lucide-react';
import FadeIn from '@/components/marketing/FadeIn';

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
                        <Link
                            href="/login?view=signup"
                            className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#4B8BB3] text-white font-bold text-lg hover:bg-[#5a9bc3] transition-all shadow-[0_0_30px_rgba(75,139,179,0.3)] hover:shadow-[0_0_50px_rgba(75,139,179,0.5)]"
                        >
                            Explore Courses <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </FadeIn>
                </div>
            </section>

            {/* EXPERT-LED LEARNING */}
            <section className="py-24 bg-[#0B1120]/40 border-t border-white/[0.04]">
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
            <section className="py-24 relative">
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

            {/* SHRM & HRCI CREDITS */}
            <section className="py-24 bg-[#0B1120]/40 border-t border-white/[0.04]">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Certificate Visual */}
                    <FadeIn direction="right">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-[#FF9300]/10 rounded-3xl blur-[50px] -z-10" />
                            <div className="bg-white text-[#0A0D12] rounded-2xl p-8 shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-700">
                                <div className="border-2 border-slate-200 rounded-xl p-6 text-center">
                                    <Award size={40} className="text-[#FF9300] mx-auto mb-3" />
                                    <div className="text-xl font-bold mb-1">Certificate of Completion</div>
                                    <div className="text-sm text-slate-500 mb-4">Leading Through AI Disruption</div>
                                    <div className="flex justify-center gap-3 mb-4">
                                        <span className="px-3 py-1 bg-[#054C74]/10 rounded text-xs font-bold text-[#054C74]">1.5 SHRM PDCs</span>
                                        <span className="px-3 py-1 bg-[#FF9300]/10 rounded text-xs font-bold text-[#FF9300]">1.5 HRCI Credits</span>
                                    </div>
                                    <div className="text-xs text-slate-400">Verified Watch Time: 94 minutes</div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    <div>
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-6">
                                <Shield size={12} /> RECERTIFICATION
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                                Earn Credits
                                <br />
                                While You Learn
                            </h2>
                            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                                Most courses offer SHRM and HRCI recertification credits. Our system tracks your exact watch time and automatically calculates credits — no spreadsheets, no manual entry.
                            </p>
                        </FadeIn>
                        <FadeIn delay={150}>
                            <ul className="space-y-4">
                                {[
                                    { label: 'SHRM PDCs', detail: '60 minutes = 1 PDC, rounded to nearest 0.25' },
                                    { label: 'HRCI Credits', detail: '45-minute minimum to qualify' },
                                    { label: 'Multi-Session', detail: 'Pick up where you left off — all sessions aggregate' },
                                    { label: 'Instant Certificates', detail: 'Generated the moment you complete a course' },
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-green-500/15 flex items-center justify-center text-green-400 mt-0.5 flex-shrink-0">
                                            <Check size={11} />
                                        </div>
                                        <div>
                                            <span className="text-white font-medium text-sm">{item.label}</span>
                                            <span className="text-slate-500 text-sm"> — {item.detail}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* COURSE EXPERIENCE */}
            <section className="py-24">
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

            {/* CTA */}
            <section className="py-24 bg-[#0B1120]/40 border-t border-white/[0.04]">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <FadeIn>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            Ready to Start Learning?
                        </h2>
                        <p className="text-lg text-slate-400 mb-10">
                            7-day free trial. All courses. All AI agents. All credits tracked automatically.
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
