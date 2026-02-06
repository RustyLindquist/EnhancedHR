import React from 'react';
import Link from 'next/link';
import {
    ArrowRight, Check, UserCheck, DollarSign, BookOpen,
    Star, Sparkles, BarChart3, GraduationCap, Zap, Users,
    PlayCircle, Award, Clock, Trophy
} from 'lucide-react';
import FadeIn from '@/components/marketing/FadeIn';
import HeroBackground from '@/components/marketing/HeroBackground';
import MarketingDivider from '@/components/marketing/MarketingDivider';

const anchorPills = [
    { label: 'Why Build Here', id: 'why-build' },
    { label: 'Earnings', id: 'earnings' },
    { label: 'What You Get', id: 'what-you-get' },
    { label: 'Get Started', id: 'get-started' },
];

export default function ForExpertsPage() {
    return (
        <div className="overflow-hidden">

            {/* HERO */}
            <section className="relative -mt-[72px] bg-[#0A0D12]">
                <HeroBackground />
                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-[120px] pb-20">
                    <FadeIn className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-6">
                            <UserCheck size={12} /> FOR EXPERTS
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8">
                            Build Courses on a
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">Legendary Platform</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed">
                            Join a growing community of thought leaders shaping the future of HR. Your expertise, amplified by AI, reaching the professionals who need it most.
                        </p>
                        <Link
                            href="/join/expert"
                            className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#4B8BB3] text-white font-bold text-lg hover:bg-[#5a9bc3] transition-all shadow-[0_0_30px_rgba(75,139,179,0.3)] hover:shadow-[0_0_50px_rgba(75,139,179,0.5)]"
                        >
                            Create Your Expert Account Today <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
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

            {/* WHY ENHANCEDHR */}
            <section id="why-build" className="scroll-mt-28 py-24 bg-[#0B1120]/40">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center mb-16">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#4B8BB3] mb-4">
                            Why EnhancedHR
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            A creator ecosystem built for credibility.
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            We&apos;re building the Academy as a premium library: beautiful learning experiences, AI-enhanced usage, and a platform that makes your expertise feel high-status.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[
                            {
                                icon: <Sparkles size={22} />,
                                title: 'AI Amplifies Your Content',
                                desc: 'Every course automatically gets a Course Assistant and Course Tutor. Your content becomes an interactive, personalized experience — no extra work from you.',
                                color: '#4B8BB3'
                            },
                            {
                                icon: <Zap size={22} />,
                                title: 'Your Reach Expands',
                                desc: 'Your material feeds the platform AI. When learners ask Prometheus questions, your content powers the answers — expanding your influence beyond just your course.',
                                color: '#FF9300'
                            },
                            {
                                icon: <Star size={22} />,
                                title: 'Premium Presentation',
                                desc: 'Your courses are presented in a stunning, modern interface. No clunky LMS vibes. A platform you\'ll be proud to send people to.',
                                color: '#78C0F0'
                            },
                            {
                                icon: <Users size={22} />,
                                title: 'Targeted Audience',
                                desc: 'A growing community of HR professionals and leaders who actively seek and value exactly the expertise you offer.',
                                color: '#4B8BB3'
                            },
                            {
                                icon: <Award size={22} />,
                                title: 'SHRM & HRCI Eligible',
                                desc: 'Your courses can offer SHRM PDCs and HRCI recertification credits — making them significantly more valuable to your audience.',
                                color: '#FF9300'
                            },
                            {
                                icon: <BookOpen size={22} />,
                                title: 'Powerful Course Builder',
                                desc: 'Full course builder with drag-and-drop modules, video upload, quiz builder, and AI-powered transcript generation.',
                                color: '#78C0F0'
                            },
                        ].map((item, i) => (
                            <FadeIn key={i} delay={i * 80}>
                                <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                                        {item.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* HOW YOU EARN */}
            <section id="earnings" className="scroll-mt-28 py-24">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-6">
                                <DollarSign size={12} /> EARNINGS
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                                Earn From
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9300] to-[#FF2600]">Watch Time</span>
                            </h2>
                            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                                You earn commissions based on how much time learners spend with your content. The more valuable your courses, the more they&apos;re consumed, the more you earn.
                            </p>
                        </FadeIn>
                        <FadeIn delay={150}>
                            <ul className="space-y-4">
                                {[
                                    { label: 'Watch Time Revenue', detail: 'Earn for every minute learners spend in your courses' },
                                    { label: 'AI Usage Revenue', detail: 'Earn when AI uses your content to answer learner questions' },
                                    { label: 'Passive Income', detail: 'Upload existing content and earn from day one' },
                                    { label: 'Growing Audience', detail: 'As the platform grows, so does your reach and revenue' },
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#FF9300]/15 flex items-center justify-center mt-0.5 flex-shrink-0">
                                            <Check size={11} className="text-[#FF9300]" />
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

                    {/* Earnings Mockup */}
                    <FadeIn direction="left" delay={200}>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-[#FF9300]/8 rounded-3xl blur-[50px] -z-10" />
                            <div className="bg-[#0A0D12] border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
                                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/[0.06]">
                                    <BarChart3 size={14} className="text-[#FF9300]" />
                                    <span className="text-sm font-bold text-white">Expert Dashboard</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                                        <div className="text-[10px] text-slate-600 mb-1">This Month</div>
                                        <div className="text-xl font-bold text-white">$1,240</div>
                                        <div className="text-[10px] text-green-400">+18% vs last month</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                                        <div className="text-[10px] text-slate-600 mb-1">Watch Hours</div>
                                        <div className="text-xl font-bold text-white">342</div>
                                        <div className="text-[10px] text-slate-500">Across 3 courses</div>
                                    </div>
                                </div>
                                {/* Mini chart */}
                                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                    <div className="text-[10px] text-slate-600 mb-3">6-Month Trend</div>
                                    <div className="flex items-end gap-1.5 h-16">
                                        {[35, 42, 55, 48, 68, 82].map((h, i) => (
                                            <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-[#FF9300] to-[#FF9300]/40" style={{ height: `${h}%` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* THE EXPERT EXPERIENCE */}
            <section id="what-you-get" className="scroll-mt-28 py-24 bg-[#0B1120]/40">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">What You Get</h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">Everything you need to build, publish, and grow your courses.</p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
                        {[
                            { icon: <BookOpen size={20} />, title: 'Expert Console', desc: 'Your command center — manage courses, track performance, view analytics and earnings.', color: '#4B8BB3' },
                            { icon: <PlayCircle size={20} />, title: 'Full Course Builder', desc: 'Drag-and-drop modules, video upload via Mux, quiz builder, and automatic transcript generation.', color: '#78C0F0' },
                            { icon: <GraduationCap size={20} />, title: 'Expert Resources', desc: 'Platform-curated resources, guides, and best practices to help you create outstanding courses.', color: '#FF9300' },
                            { icon: <Trophy size={20} />, title: 'Public Profile', desc: 'Featured in the Expert Directory with your bio, credentials, photo, and published courses.', color: '#4B8BB3' },
                        ].map((item, i) => (
                            <FadeIn key={i} delay={i * 100}>
                                <div className="flex gap-5 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
                                        <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* HOW TO GET STARTED */}
            <section id="get-started" className="scroll-mt-28 py-24">
                <div className="max-w-4xl mx-auto px-6">
                    <FadeIn className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Get Started in 4 Steps</h2>
                    </FadeIn>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { step: '01', title: 'Create Account', desc: 'Create a trial account, once published your subscription is free.', color: '#4B8BB3' },
                            { step: '02', title: 'Build Your Course', desc: 'Use our beautiful course builder to create your course.', color: '#78C0F0' },
                            { step: '03', title: 'Submit Your Course', desc: 'Once you\u2019re done, simply submit your course for review.', color: '#FF9300' },
                            { step: '04', title: 'Start Earning', desc: 'Once approved, your course is published and you start earning!', color: '#FF2600' },
                        ].map((step, i) => (
                            <FadeIn key={i} delay={i * 120}>
                                <div className="text-center">
                                    <div className="text-3xl font-bold mb-3" style={{ color: step.color }}>{step.step}</div>
                                    <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                                    <p className="text-sm text-slate-500">{step.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* CTA */}
            <section className="py-24 bg-[#0B1120]/40">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <FadeIn>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            Your Expertise Deserves
                            <br />
                            a Better Platform
                        </h2>
                        <p className="text-lg text-slate-400 mb-10">
                            Join the growing community of thought leaders who are building the future of HR education.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/join/expert"
                                className="group px-10 py-5 rounded-full bg-[#FF9300] text-white font-bold text-xl hover:bg-[#FFa520] transition-all shadow-[0_0_30px_rgba(255,147,0,0.3)] hover:shadow-[0_0_50px_rgba(255,147,0,0.5)] flex items-center gap-2"
                            >
                                Apply to Become an Expert <ArrowRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
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
