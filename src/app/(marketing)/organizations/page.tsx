import React from 'react';
import Link from 'next/link';
import {
    ArrowRight, Check, Building2, Users, BookOpen, FolderOpen,
    BarChart3, Shield, Target, Layers, GraduationCap, Sparkles,
    Lock, Settings, UserCheck
} from 'lucide-react';
import FadeIn from '@/components/marketing/FadeIn';
import MarketingDivider from '@/components/marketing/MarketingDivider';

const anchorPills = [
    { label: 'Groups', id: 'groups' },
    { label: 'Org Courses', id: 'org-courses' },
    { label: 'Collections', id: 'org-collections' },
    { label: 'Analytics', id: 'analytics' },
    { label: 'Pricing', id: 'org-pricing' },
];

export default function OrganizationsPage() {
    return (
        <div className="overflow-hidden">

            {/* HERO */}
            <section className="relative py-24 md:py-32">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] bg-[#4B8BB3]/8 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[10%] right-[15%] w-[400px] h-[400px] bg-[#054C74]/10 rounded-full blur-[100px]" />
                </div>
                <div className="max-w-7xl mx-auto px-6 relative">
                    <FadeIn className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-6">
                            <Building2 size={12} /> FOR ORGANIZATIONS
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8">
                            Empower Your
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">Entire Team</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed">
                            Give your organization an AI-enhanced learning and knowledge management platform — with the tools to manage, measure, and grow every employee.
                        </p>
                        <Link
                            href="/login?view=signup"
                            className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#4B8BB3] text-white font-bold text-lg hover:bg-[#5a9bc3] transition-all shadow-[0_0_30px_rgba(75,139,179,0.3)]"
                        >
                            Start Free Trial <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
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

            {/* EMPLOYEE GROUPS */}
            <section id="groups" className="scroll-mt-28 py-24 bg-[#0B1120]/40">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-6">
                                <Users size={12} /> GROUPS
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                                Unlimited Custom Groups
                            </h2>
                            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                                Segment your employees any way you need. By team, department, onboarding cohort, or custom learning tiers. Assign content as required or suggested learning — then track progress.
                            </p>
                        </FadeIn>
                        <FadeIn delay={150}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    'By team or department',
                                    'By function (managers, ICs)',
                                    'Onboarding cohorts',
                                    'Learning tiers (Tier 1, 2, 3)',
                                    'Custom segments',
                                    'Dynamic auto-groups',
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                        <Check size={14} className="text-[#4B8BB3] flex-shrink-0" /> {item}
                                    </div>
                                ))}
                            </div>
                        </FadeIn>
                    </div>

                    {/* Groups Mockup */}
                    <FadeIn direction="left" delay={200}>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-[#4B8BB3]/8 rounded-3xl blur-[50px] -z-10" />
                            <div className="bg-[#0A0D12] border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
                                    <Users size={14} className="text-[#4B8BB3]" />
                                    <span className="text-sm font-bold text-white">Employee Groups</span>
                                </div>
                                <div className="space-y-2.5">
                                    {[
                                        { name: 'Engineering Team', members: 42, assigned: 3, color: '#4B8BB3' },
                                        { name: 'New Hire Onboarding', members: 8, assigned: 5, color: '#FF9300' },
                                        { name: 'Management Track', members: 15, assigned: 4, color: '#78C0F0' },
                                        { name: 'Tier 1 Learning', members: 120, assigned: 6, color: '#4B8BB3' },
                                    ].map((group, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${group.color}15`, color: group.color }}>
                                                <Users size={14} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xs font-bold text-white">{group.name}</div>
                                                <div className="text-[10px] text-slate-600">{group.members} members</div>
                                            </div>
                                            <div className="text-[10px] text-slate-500">{group.assigned} courses assigned</div>
                                        </div>
                                    ))}
                                </div>
                                {/* Dynamic Group */}
                                <div className="mt-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/15">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Sparkles size={10} className="text-purple-400" />
                                        <span className="text-[10px] font-bold text-purple-400">Dynamic Group</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-xs text-white">Most Active Learners</div>
                                        <span className="ml-auto text-[10px] text-slate-500">Auto-populated</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* ORG COURSES */}
            <section id="org-courses" className="scroll-mt-28 py-24">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <FadeIn direction="right" className="order-2 lg:order-1">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-[#78C0F0]/8 rounded-3xl blur-[50px] -z-10" />
                            <div className="bg-[#0A0D12] border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
                                    <BookOpen size={14} className="text-[#78C0F0]" />
                                    <span className="text-sm font-bold text-white">Org Course Builder</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="h-32 rounded-lg bg-gradient-to-br from-[#054C74]/30 to-[#4B8BB3]/10 border border-white/[0.06] flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                                                <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[6px] border-y-transparent ml-0.5" />
                                            </div>
                                            <div className="text-[10px] text-slate-500">Upload Video</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Module 1', 'Module 2', 'Quiz'].map((mod, i) => (
                                            <div key={i} className="p-2 rounded bg-white/[0.03] border border-white/[0.04] text-center">
                                                <div className="text-[10px] text-slate-500">{mod}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-2 rounded-lg bg-[#78C0F0]/5 border border-[#78C0F0]/15 flex items-center gap-2">
                                        <Sparkles size={10} className="text-[#78C0F0]" />
                                        <span className="text-[10px] text-slate-400">AI Assistant auto-scoped to your course content</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                    <div className="order-1 lg:order-2">
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#78C0F0]/10 border border-[#78C0F0]/20 text-xs font-medium text-[#78C0F0] tracking-wide mb-6">
                                <BookOpen size={12} /> ORG COURSES
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                                Build Your Own Courses
                            </h2>
                            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                                Use the same AI-enhanced platform to build and host your own courses. Upload existing video content or create from scratch. Every org course gets its own AI assistant, automatically scoped to your content.
                            </p>
                        </FadeIn>
                        <FadeIn delay={150}>
                            <ul className="space-y-3">
                                {[
                                    'Full course builder with modules, lessons, and quizzes',
                                    'Upload existing video content from any source',
                                    'AI assistant auto-trained on your course content',
                                    'Assign to any group as required or suggested learning',
                                    'Perfect for compliance, onboarding, and internal skills',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                        <Check size={14} className="text-[#78C0F0] flex-shrink-0" /> {item}
                                    </li>
                                ))}
                            </ul>
                        </FadeIn>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ORG COLLECTIONS */}
            <section id="org-collections" className="scroll-mt-28 py-24 bg-[#0B1120]/40">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-6">
                                <FolderOpen size={12} /> KNOWLEDGE BASE
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                                Org Knowledge Collections
                            </h2>
                            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                                Create centralized knowledge bases for your organization. Upload employee handbooks, HR policies, mission statements, procedures — anything your team needs. Prometheus learns it all, so every employee gets org-specific answers.
                            </p>
                        </FadeIn>
                        <FadeIn delay={150}>
                            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                <h4 className="text-sm font-bold text-white mb-3">When an employee asks Prometheus:</h4>
                                <div className="space-y-2">
                                    <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.04]">
                                        <p className="text-[11px] text-slate-400">&quot;What&apos;s our PTO policy for new hires?&quot;</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-[#FF9300]/10 border border-[#FF9300]/20">
                                        <p className="text-[11px] text-slate-300">
                                            Prometheus answers using your <span className="text-[#FF9300] font-medium">actual company handbook</span> — not generic information. Accurate, org-specific, instant.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                    <FadeIn direction="left" delay={200}>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-[#FF9300]/8 rounded-3xl blur-[50px] -z-10" />
                            <div className="bg-[#0A0D12] border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
                                    <FolderOpen size={14} className="text-[#FF9300]" />
                                    <span className="text-sm font-bold text-white">Org Collections</span>
                                </div>
                                <div className="space-y-2.5">
                                    {[
                                        { name: 'Employee Handbook', items: 12 },
                                        { name: 'HR Policies & Procedures', items: 24 },
                                        { name: 'New Hire Documentation', items: 8 },
                                        { name: 'Mission, Vision & Values', items: 5 },
                                        { name: 'Benefits & Compensation', items: 15 },
                                    ].map((coll, i) => (
                                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                            <div className="flex items-center gap-2">
                                                <FolderOpen size={12} className="text-[#FF9300]" />
                                                <span className="text-xs text-white">{coll.name}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-600">{coll.items} items</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* ORGANIZATION LEARNING OVERVIEW */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <FadeIn>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#4B8BB3] mb-4">
                                    Organization Learning
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                                    Build, assign, and track learning across the org.
                                </h2>
                                <p className="text-lg text-slate-400 leading-relaxed">
                                    Add to the Academy by building org-specific courses and assigning learning to groups. Segment people intelligently and give managers the clarity they&apos;ve been missing.
                                </p>
                            </FadeIn>
                        </div>

                        <FadeIn delay={150}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { icon: <Building2 size={20} />, color: '#4B8BB3', title: 'Org Courses', desc: 'Create or upload internal courses and publish to your employees\u2014fully AI-integrated.' },
                                    { icon: <Users size={20} />, color: '#4B8BB3', title: 'Groups', desc: 'Create unlimited custom groups and assign required or recommended learning.' },
                                    { icon: <Layers size={20} />, color: '#4B8BB3', title: 'Assignments', desc: 'Onboarding tiers, role-based learning paths, and targeted enablement without chaos.' },
                                    { icon: <BarChart3 size={20} />, color: '#4B8BB3', title: 'Org Analytics', desc: 'Track engagement, progress, and how learning is translating into outcomes.' },
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

            {/* ANALYTICS + REQUIRED LEARNING */}
            <section id="analytics" className="scroll-mt-28 py-24 bg-[#0B1120]/40">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Measure Everything</h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">Track engagement, prove ROI, and ensure compliance — all from one dashboard.</p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            { icon: <BarChart3 size={22} />, title: 'Analytics Dashboard', desc: 'Track learning metrics, engagement trends, and credit accumulation across your entire organization.', color: '#4B8BB3' },
                            { icon: <Sparkles size={22} />, title: 'Analytics Assistant', desc: 'An AI agent trained on your org data. Ask questions about learning patterns, what teams are asking about, and training effectiveness.', color: '#FF9300' },
                            { icon: <Shield size={22} />, title: 'Required Learning', desc: 'Assign mandatory courses to any group and track completion. Perfect for compliance training and onboarding.', color: '#78C0F0' },
                        ].map((feature, i) => (
                            <FadeIn key={i} delay={i * 100}>
                                <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: `${feature.color}15`, color: feature.color }}>{feature.icon}</div>
                                    <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ANALYTICS CTA */}
            <section className="py-20">
                <div className="max-w-5xl mx-auto px-6">
                    <FadeIn>
                        <div className="p-10 md:p-14 rounded-2xl bg-[#0B1120]/80 border border-white/[0.06]">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#4B8BB3] mb-4">
                                        Analytics
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-5 tracking-tight">
                                        Visibility without surveillance.
                                    </h2>
                                    <p className="text-base text-slate-400 leading-relaxed mb-8">
                                        Understand engagement trends, learning activity, and progress across your org. Then use the Analytics Assistant to summarize what it means and what to do next.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Link
                                            href="/pricing"
                                            className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors"
                                        >
                                            See Team Pricing <ArrowRight size={16} className="opacity-70" />
                                        </Link>
                                        <Link
                                            href="/login?view=signup"
                                            className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/[0.08] px-6 py-3 text-sm font-semibold text-white hover:bg-white/[0.1] transition-colors"
                                        >
                                            Get Started <ArrowRight size={16} className="opacity-70" />
                                        </Link>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        'Engagement + learning trends',
                                        'Segment by groups',
                                        'Usage patterns across AI tools',
                                        'Actionable summaries for HR leaders',
                                    ].map((item, i) => (
                                        <div key={i} className="px-5 py-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-300">
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* PRICING */}
            <section id="org-pricing" className="scroll-mt-28 py-24 bg-[#0B1120]/40">
                <div className="max-w-3xl mx-auto px-6">
                    <FadeIn>
                        <div className="p-10 rounded-2xl bg-[#4B8BB3]/5 border border-[#4B8BB3]/20 text-center relative overflow-hidden">
                            <div className="relative">
                                <div className="text-xs font-bold text-[#4B8BB3] uppercase tracking-wider mb-4">Organization Plan</div>
                                <div className="flex items-baseline justify-center gap-1 mb-2">
                                    <span className="text-5xl font-bold text-white">$30</span>
                                    <span className="text-slate-500">/user/month</span>
                                </div>
                                <p className="text-sm text-slate-500 mb-8">Everything in Individual, plus full organization tools.</p>
                                <ul className="space-y-3 text-left max-w-md mx-auto mb-10">
                                    {[
                                        'All Academy courses + AI agents for every employee',
                                        'Unlimited custom employee groups',
                                        'Build and host org-specific courses',
                                        'Organizational knowledge collections',
                                        'Required learning assignments & tracking',
                                        'Analytics dashboard + Analytics Assistant',
                                        'Dynamic auto-segmentation groups',
                                        'SHRM & HRCI credit tracking per employee',
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                                            <Check size={14} className="text-[#4B8BB3] mt-0.5 flex-shrink-0" /> {item}
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Link
                                        href="/login?view=signup"
                                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#4B8BB3] text-white font-bold text-lg hover:bg-[#5a9bc3] transition-all shadow-[0_0_20px_rgba(75,139,179,0.25)]"
                                    >
                                        Start Free Trial <ArrowRight size={20} />
                                    </Link>
                                    <Link
                                        href="/demo"
                                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/[0.04] text-white font-semibold text-lg border border-white/[0.08] hover:bg-white/[0.08] transition-all"
                                    >
                                        Schedule a Demo <ArrowRight size={20} className="opacity-50" />
                                    </Link>
                                </div>
                                <p className="text-xs text-slate-500 mt-4">7-day free trial. No credit card required.</p>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>
        </div>
    );
}
