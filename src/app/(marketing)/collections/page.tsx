import type { Metadata } from 'next';
import Link from 'next/link';
import {
    ArrowRight,
    BookOpen,
    Building2,
    FileText,
    FolderOpen,
    Layers,
    MessageSquare,
    NotebookPen,
    PlayCircle,
    Sparkles,
    Target,
    User,
    Zap,
} from 'lucide-react';
import MarketingDivider from '@/components/marketing/MarketingDivider';
import HeroBackground from '@/components/marketing/HeroBackground';
import FadeIn from '@/components/marketing/FadeIn';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
    title: 'Collections — EnhancedHR.ai',
    description:
        'Collections turn learning and knowledge into a reusable workspace. Add lessons, notes, docs, videos, and conversations—then use the Collection Assistant for grounded answers and artifacts.',
};

function ItemTag({ icon, label }: { icon: ReactNode; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
            {icon}
            {label}
        </span>
    );
}

function ConceptCard({ title, body, accent = '#4B8BB3' }: { title: string; body: string; accent?: string }) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
            <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full blur-[80px]" style={{ backgroundColor: `${accent}10` }} />
            <div className="relative">
                <div className="text-white font-semibold">{title}</div>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
            </div>
        </div>
    );
}

function WorkflowCard({ number, title, body }: { number: string; title: string; body: string }) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#4B8BB3]/5 blur-[60px]" />
            <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 flex items-center justify-center text-xs font-bold text-[#4B8BB3]">
                        {number}
                    </div>
                    <div className="text-white font-semibold">{title}</div>
                </div>
                <p className="text-sm leading-relaxed text-slate-400">{body}</p>
            </div>
        </div>
    );
}

const anchorPills = [
    { label: 'At a Glance', id: 'at-a-glance' },
    { label: 'The Big Idea', id: 'big-idea' },
    { label: 'Builder', id: 'builder' },
    { label: 'Use Cases', id: 'use-cases' },
    { label: 'Org vs Personal', id: 'org-personal' },
];

export default function CollectionsPage() {
    return (
        <div className="overflow-hidden">

            {/* ═══════════════════════════════════════════
                HERO
            ═══════════════════════════════════════════ */}
            <section className="relative bg-[#0A0D12]">
                <HeroBackground />
                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-[200px] pb-[160px]">
                    <FadeIn className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-6">
                            <FolderOpen size={12} /> COLLECTIONS
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8 leading-[1.05]">
                            Build Your<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">
                                Knowledge Brain.
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 mb-6 leading-relaxed">
                            Collections are portable, AI-powered knowledge workspaces. Save what matters from across the platform and add your own context. The Collection Assistant gives you grounded answers without re-explaining everything.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-10 text-slate-500">
                            <ItemTag icon={<Layers size={14} className="text-[#4B8BB3]" />} label="Courses & Lessons" />
                            <span className="text-white/10">|</span>
                            <ItemTag icon={<FileText size={14} className="text-[#4B8BB3]" />} label="Docs & Files" />
                            <span className="text-white/10">|</span>
                            <ItemTag icon={<NotebookPen size={14} className="text-[#4B8BB3]" />} label="Notes" />
                            <span className="text-white/10">|</span>
                            <ItemTag icon={<MessageSquare size={14} className="text-[#4B8BB3]" />} label="Conversations" />
                            <span className="text-white/10">|</span>
                            <ItemTag icon={<PlayCircle size={14} className="text-[#4B8BB3]" />} label="Videos" />
                            <span className="text-white/10">|</span>
                            <ItemTag icon={<Sparkles size={14} className="text-[#4B8BB3]" />} label="AI Tools" />
                        </div>
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
                        <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto mt-[82px]">
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
                AT A GLANCE — Org vs Personal
            ═══════════════════════════════════════════ */}
            <section id="at-a-glance" className="scroll-mt-28 py-20 bg-[#0B1120]/40">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FadeIn>
                            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full flex flex-col">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#4B8BB3] mb-4">
                                    Organization Collections
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
                                    Org knowledge becomes a shared assistant.
                                </h3>
                                <p className="text-slate-400 leading-relaxed mb-8 flex-1">
                                    Build org collections for onboarding, policies, benefits, performance, or any team playbook. Employees can ask questions and get grounded answers — aligned to your org&apos;s reality.
                                </p>
                                <div>
                                    <Link
                                        href="/organizations"
                                        className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors"
                                    >
                                        Org Learning Features <ArrowRight size={16} className="opacity-70" />
                                    </Link>
                                </div>
                            </div>
                        </FadeIn>

                        <FadeIn delay={100}>
                            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full flex flex-col">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#FF9300] mb-4">
                                    Personal Collections
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
                                    Every employee gets their own knowledge system.
                                </h3>
                                <p className="text-slate-400 leading-relaxed mb-8 flex-1">
                                    People can create collections for role transitions, manager moments, compensation projects, or whatever they&apos;re building. Add context once — then use the assistant as often as needed.
                                </p>
                                <div>
                                    <Link
                                        href="/login?view=signup"
                                        className="inline-flex items-center gap-2 rounded-full bg-[#4B8BB3]/15 border border-[#4B8BB3]/30 px-6 py-3 text-sm font-semibold text-white hover:bg-[#4B8BB3]/25 transition-colors"
                                    >
                                        Get Started Today <ArrowRight size={16} className="opacity-70" />
                                    </Link>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                THE BIG IDEA — Object-Oriented Context
            ═══════════════════════════════════════════ */}
            <section id="big-idea" className="scroll-mt-28 relative py-20">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
                        <div className="lg:col-span-5">
                            <FadeIn>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#4B8BB3]">
                                    The Big Idea
                                </div>
                                <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    Object-oriented context engineering.
                                </h2>
                                <p className="mt-5 text-base leading-relaxed text-slate-300">
                                    EnhancedHR treats content as portable &ldquo;context objects&rdquo; you can move into any collection. That makes your learning and your knowledge reusable across projects — without copy/pasting, re-uploading, or re-explaining.
                                </p>
                                <p className="mt-4 text-sm leading-relaxed text-slate-500">
                                    Collections can be personal (your projects) or organizational (policies, onboarding, playbooks). The AI assistant uses the correct scope automatically.
                                </p>
                            </FadeIn>
                        </div>

                        <div className="lg:col-span-7">
                            <FadeIn direction="left" delay={150}>
                                <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-[#0B1120]/55 p-8 backdrop-blur-xl">
                                    <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#4B8BB3]/8 blur-[110px]" />
                                    <div className="absolute -bottom-28 -right-28 h-[420px] w-[420px] rounded-full bg-[#FF9300]/6 blur-[120px]" />

                                    <div className="relative">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <ConceptCard
                                                title="Context Objects"
                                                body="Lessons, resources, notes, files, conversations, tools."
                                            />
                                            <ConceptCard
                                                title="Collections"
                                                body="A workspace that can contain any context objects."
                                            />
                                            <ConceptCard
                                                title="Portability"
                                                body="The same object can live in multiple collections."
                                            />
                                            <ConceptCard
                                                title="AI Scope"
                                                body="The assistant answers using only what's inside."
                                                accent="#FF9300"
                                            />
                                        </div>

                                        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-black/20 p-6">
                                            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                                Why it matters
                                            </div>
                                            <p className="mt-3 text-sm leading-relaxed text-slate-300">
                                                If learning stays trapped in a course player, it dies. Collections make learning portable — and make AI useful — because it finally has a clean, scoped, permissioned source of truth.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                COLLECTION BUILDER MOCKUP
            ═══════════════════════════════════════════ */}
            <section id="builder" className="scroll-mt-28 py-20 bg-[#0B1120]/40 relative">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Mockup */}
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
                                            { type: 'Doc', name: 'New Hire Buddy Program Template', color: '#78C0F0', icon: <FileText size={12} /> },
                                            { type: 'Conversation', name: 'Chat: Onboarding timeline brainstorm', color: '#4B8BB3', icon: <MessageSquare size={12} /> },
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
                                            Based on the courses and your handbook, I&apos;d recommend structuring Week 1 around cultural immersion before any role-specific training. Want me to draft the full 30/60/90 plan?
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>

                        {/* Copy */}
                        <div>
                            <FadeIn>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#FF9300] mb-3">
                                    How It Works
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                                    Curate. Combine.<br />
                                    <span className="text-[#FF9300]">Let AI connect the dots.</span>
                                </h2>
                                <p className="mt-5 text-base leading-relaxed text-slate-300">
                                    Add any mix of courses, lessons, documents, notes, videos, and conversations to a collection. The Collection Assistant sees everything inside — and only what&apos;s inside — so its answers are grounded, relevant, and scoped to your actual project.
                                </p>
                                <ul className="mt-6 space-y-3">
                                    {[
                                        'Drag in courses, lessons, PDFs, videos, notes, and saved chats',
                                        'Add your own notes and goals for project-specific context',
                                        'Ask the assistant to synthesize, plan, draft, or summarize',
                                        'Update the collection anytime — the assistant stays current',
                                    ].map((t) => (
                                        <li key={t} className="flex items-start gap-3 text-sm text-slate-300">
                                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#FF9300] flex-shrink-0" />
                                            {t}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-8">
                                    <Link
                                        href="/login?view=signup"
                                        className="inline-flex items-center gap-2 rounded-full bg-[#FF9300] px-6 py-3 text-sm font-bold text-[#0A0D12] hover:bg-white transition-colors shadow-[0_0_20px_rgba(255,147,0,0.25)]"
                                    >
                                        Start Building <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                USE CASE — Strategic Onboarding
            ═══════════════════════════════════════════ */}
            <section id="use-cases" className="scroll-mt-28 relative py-20">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
                        <div className="lg:col-span-5">
                            <FadeIn>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#4B8BB3]">
                                    Use Case
                                </div>
                                <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    Strategic onboarding — done in a day, not a quarter.
                                </h2>
                                <p className="mt-5 text-base leading-relaxed text-slate-300">
                                    Create a collection called &ldquo;Onboarding.&rdquo; Add the best Academy lessons, your handbook, prior onboarding docs, and a note with goals and constraints. Now ask the Collection Assistant to produce the plan, checklist, comms, and milestones.
                                </p>
                                <div className="mt-7">
                                    <Link
                                        href="/login?view=signup"
                                        className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors"
                                    >
                                        Try It Yourself <ArrowRight size={16} className="opacity-70" />
                                    </Link>
                                </div>
                            </FadeIn>
                        </div>

                        <div className="lg:col-span-7">
                            <FadeIn direction="left" delay={100}>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <WorkflowCard
                                        number="1"
                                        title="Create Collection"
                                        body="A portable context space where everything relevant can live together."
                                    />
                                    <WorkflowCard
                                        number="2"
                                        title="Add Inputs"
                                        body="Courses, lessons, PDFs, policies, notes, and videos you trust."
                                    />
                                    <WorkflowCard
                                        number="3"
                                        title="Ask the Assistant"
                                        body="A rollout plan, 30/60/90 checklist, stakeholder comms, and meeting agendas."
                                    />
                                    <WorkflowCard
                                        number="4"
                                        title="Reuse & Update"
                                        body="The collection becomes a living asset — update it and the assistant stays current."
                                    />
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                KNOWLEDGE MANAGEMENT
            ═══════════════════════════════════════════ */}
            <section className="py-20 bg-[#0B1120]/40">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <FadeIn>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#4B8BB3] mb-4">
                                    Knowledge Management
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                                    Your handbook becomes a live assistant.
                                </h2>
                                <p className="text-lg text-slate-400 leading-relaxed mb-8">
                                    Create org collections for policies, playbooks, onboarding docs, and internal knowledge. Employees can ask questions and get answers grounded in your organization&apos;s reality.
                                </p>
                                <Link
                                    href="/collections"
                                    className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors"
                                >
                                    Explore Collections <ArrowRight size={16} className="opacity-70" />
                                </Link>
                            </FadeIn>
                        </div>

                        <FadeIn delay={150}>
                            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                        <div className="flex items-center gap-2.5 mb-3">
                                            <div className="w-9 h-9 rounded-lg bg-[#4B8BB3]/15 flex items-center justify-center">
                                                <Layers size={18} className="text-[#4B8BB3]" />
                                            </div>
                                            <h3 className="text-sm font-bold text-white">Org Collections</h3>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            A shared, AI-usable knowledge base&mdash;built for how employees actually ask questions.
                                        </p>
                                    </div>
                                    <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                        <div className="flex items-center gap-2.5 mb-3">
                                            <div className="w-9 h-9 rounded-lg bg-[#FF9300]/15 flex items-center justify-center">
                                                <User size={18} className="text-[#FF9300]" />
                                            </div>
                                            <h3 className="text-sm font-bold text-white">Personal Collections</h3>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Individuals can build their own knowledge collections for projects, topics, and goals.
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    The assistant&apos;s context is scoped: org collections for org knowledge, personal context for personalization, course scope for course accuracy.
                                </p>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                ORG vs PERSONAL COLLECTIONS
            ═══════════════════════════════════════════ */}
            <section id="org-personal" className="scroll-mt-28 relative py-20">
                <div className="mx-auto max-w-7xl px-6">
                    <FadeIn>
                        <div className="text-center mb-12">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-[#4B8BB3]">
                                Two Modes
                            </div>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                Shared knowledge. Personal workspaces.
                            </h2>
                            <p className="mt-4 max-w-2xl mx-auto text-base leading-relaxed text-slate-400">
                                Collections flex to serve the organization and the individual — each with AI that respects the right scope.
                            </p>
                        </div>
                    </FadeIn>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <FadeIn delay={100}>
                            <div className="h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-5">
                                    <Layers size={12} /> ORGANIZATION
                                </div>
                                <h3 className="text-2xl font-bold tracking-tight text-white">
                                    Org knowledge becomes a shared assistant.
                                </h3>
                                <p className="mt-4 text-base leading-relaxed text-slate-300">
                                    Build org collections for onboarding, policies, benefits, performance, or any team playbook. Employees can ask questions and get grounded answers — aligned to your org&apos;s reality.
                                </p>
                                <ul className="mt-5 space-y-2">
                                    {['Policy & compliance playbooks', 'Onboarding programs', 'Benefits guides', 'Performance frameworks'].map((t) => (
                                        <li key={t} className="flex items-center gap-2 text-sm text-slate-400">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#4B8BB3]" />
                                            {t}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-7">
                                    <Link
                                        href="/organizations"
                                        className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors"
                                    >
                                        Org Learning Features <ArrowRight size={16} className="opacity-70" />
                                    </Link>
                                </div>
                            </div>
                        </FadeIn>

                        <FadeIn delay={200}>
                            <div className="relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0B1120]/55 p-8 backdrop-blur-xl">
                                <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#FF9300]/6 blur-[110px]" />
                                <div className="relative">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-5">
                                        <FolderOpen size={12} /> PERSONAL
                                    </div>
                                    <h3 className="text-2xl font-bold tracking-tight text-white">
                                        Every employee gets their own knowledge system.
                                    </h3>
                                    <p className="mt-4 text-base leading-relaxed text-slate-300">
                                        People can create collections for role transitions, manager moments, compensation projects, or whatever they&apos;re building. Add context once — then use the assistant as often as needed.
                                    </p>
                                    <ul className="mt-5 space-y-2">
                                        {['Career development plans', 'Project research hubs', 'Manager toolkit collections', 'Interview prep workspaces'].map((t) => (
                                            <li key={t} className="flex items-center gap-2 text-sm text-slate-400">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#FF9300]" />
                                                {t}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-7">
                                        <Link
                                            href="/pricing"
                                            className="inline-flex items-center gap-2 rounded-full bg-[#FF9300] px-6 py-3 text-sm font-bold text-[#0A0D12] hover:bg-white transition-colors shadow-[0_0_20px_rgba(255,147,0,0.25)]"
                                        >
                                            View Pricing <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            <MarketingDivider />

            {/* ═══════════════════════════════════════════
                FINAL CTA
            ═══════════════════════════════════════════ */}
            <section className="relative py-24 bg-[#0B1120]/40">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FF9300]/8 rounded-full blur-[140px]" />
                </div>

                <div className="mx-auto max-w-7xl px-6 text-center">
                    <FadeIn>
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                            Your knowledge deserves<br />
                            <span className="text-[#FF9300]">a workspace that works.</span>
                        </h2>
                        <p className="mt-6 max-w-2xl mx-auto text-lg leading-relaxed text-slate-300">
                            Start a collection around a real initiative. Add what you know. Let the Collection Assistant turn scattered context into structured, actionable output.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/login?view=signup"
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF9300] px-8 py-4 text-base font-bold text-[#0A0D12] hover:bg-white transition-colors shadow-[0_0_30px_rgba(255,147,0,0.3)]"
                            >
                                Get Started Free <ArrowRight size={18} />
                            </Link>
                            <Link
                                href="/demo"
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-8 py-4 text-base font-semibold text-white hover:bg-white/[0.08] transition-colors"
                            >
                                Schedule a Demo <ArrowRight size={18} className="opacity-70" />
                            </Link>
                        </div>
                    </FadeIn>
                </div>
            </section>

        </div>
    );
}
