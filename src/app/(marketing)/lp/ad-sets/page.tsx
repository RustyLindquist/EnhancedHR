import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, Megaphone, Search, Target } from 'lucide-react';
import FadeIn from '@/components/marketing/FadeIn';
import HeroBackground from '@/components/marketing/HeroBackground';
import MarketingDivider from '@/components/marketing/MarketingDivider';

export const metadata: Metadata = {
    title: 'Landing Page Ad Sets -- EnhancedHR.ai',
    description:
        'Shareable review page for LinkedIn and Google ad sets mapped to EnhancedHR landing pages.',
    robots: {
        index: false,
        follow: false,
    },
};

type AdSet = {
    id: string;
    label: string;
    targetUrl: string;
    linkedin: {
        primaryText: string;
        headline: string;
        description: string;
        cta: string;
    };
    google: {
        headlines: string[];
        descriptions: string[];
        path: string;
    };
};

const adSets: AdSet[] = [
    {
        id: '1',
        label: 'Features & Value Page',
        targetUrl: '/lp/1',
        linkedin: {
            primaryText:
                'HR leaders are expected to move faster with better decisions and cleaner execution. EnhancedHR combines expert courses, 5 specialized AI agents, scoped collections, org learning tools, and analytics in one platform built for teams like yours.',
            headline: 'One Platform for HR Capability at Scale',
            description: 'Built for 100-1000 employee organizations.',
            cta: 'Learn More',
        },
        google: {
            headlines: [
                'AI-Native HR Learning Platform',
                'Courses, AI Agents, & Collections',
                'Built for 100-1000 Employee Teams',
            ],
            descriptions: [
                'Expert-led HR learning with scoped AI, org tools, and analytics in one platform.',
                'Start a free trial or schedule a demo for your team.',
            ],
            path: 'enhancedhr.ai/lp/1',
        },
    },
    {
        id: '2',
        label: 'Challenger Narrative Page',
        targetUrl: '/lp/2',
        linkedin: {
            primaryText:
                'AI is table stakes. The real advantage is decision velocity. If your knowledge is fragmented, your teams move slower and decisions drift. See the challenger blueprint for turning HR knowledge into scoped, decision-grade context.',
            headline: 'Decision Velocity Is the New Moat',
            description: 'A 14-day pilot model for HR leaders.',
            cta: 'Learn More',
        },
        google: {
            headlines: [
                'Decision Velocity for HR Teams',
                'AI Is Table Stakes. Context Wins.',
                'Fix Knowledge Fragmentation Fast',
            ],
            descriptions: [
                'Build scoped knowledge operations for faster, more aligned decisions.',
                'See the 14-day pilot framework for 100-1000 employee orgs.',
            ],
            path: 'enhancedhr.ai/lp/2',
        },
    },
    {
        id: '3',
        label: 'Original Page (Human Velocity OS)',
        targetUrl: '/lp/3',
        linkedin: {
            primaryText:
                'Most companies have content. Few have a capability operating system. EnhancedHR helps HR teams convert learning, policy, and institutional knowledge into faster execution through scoped AI workflows.',
            headline: 'Build Your Human Velocity OS',
            description: 'Turn knowledge into aligned action.',
            cta: 'Learn More',
        },
        google: {
            headlines: [
                'Build an HR Capability Engine',
                'Turn Knowledge Into Action',
                'AI-Enhanced Platform for HR Leaders',
            ],
            descriptions: [
                'Operationalize learning, context, and execution in one system.',
                'Start free or book a guided demo.',
            ],
            path: 'enhancedhr.ai/lp/3',
        },
    },
];

export default function LandingPageAdSetsPage() {
    return (
        <div className="overflow-hidden">
            <section className="relative bg-[#0A0D12]">
                <HeroBackground />
                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-[200px] pb-[120px]">
                    <FadeIn className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-6">
                            <Megaphone size={12} /> AD REVIEW PAGE
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.05] mb-6">
                            Landing Page Ad Sets
                        </h1>
                        <p className="text-lg text-slate-400 leading-relaxed max-w-3xl">
                            Shareable campaign creative mapped one-to-one with each landing page for HR leaders in 100-1000 employee organizations.
                        </p>
                    </FadeIn>

                    <FadeIn delay={120}>
                        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-5xl">
                            {adSets.map((set) => (
                                <div
                                    key={set.id}
                                    className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08]"
                                >
                                    <div className="text-xs text-slate-500 mb-1">Ad Set {set.id}</div>
                                    <div className="text-sm font-semibold text-white">{set.label}</div>
                                    <Link
                                        href={set.targetUrl}
                                        className="mt-2 inline-flex items-center gap-1 text-xs text-[#78C0F0] hover:text-white transition-colors"
                                    >
                                        {set.targetUrl} <ExternalLink size={12} />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6 space-y-10">
                    {adSets.map((set, index) => (
                        <FadeIn key={set.id} delay={index * 80}>
                            <article className="rounded-2xl bg-white/[0.02] border border-white/[0.08] overflow-hidden">
                                <div className="px-6 md:px-8 py-6 border-b border-white/[0.08] bg-white/[0.01]">
                                    <div className="text-xs uppercase tracking-wider text-[#4B8BB3] mb-2">
                                        Ad Set {set.id}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                        {set.label}
                                    </h2>
                                    <Link
                                        href={set.targetUrl}
                                        className="inline-flex items-center gap-1 text-sm text-[#78C0F0] hover:text-white transition-colors"
                                    >
                                        Target URL: {set.targetUrl} <ExternalLink size={14} />
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2">
                                    <div className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-white/[0.08]">
                                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-white mb-5">
                                            <Target size={16} className="text-[#FF9300]" />
                                            LinkedIn Ad
                                        </div>
                                        <div className="space-y-4 text-sm">
                                            <div>
                                                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                                                    Primary Text
                                                </div>
                                                <p className="text-slate-300 leading-relaxed">
                                                    {set.linkedin.primaryText}
                                                </p>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                                                    Headline
                                                </div>
                                                <p className="text-white font-medium">
                                                    {set.linkedin.headline}
                                                </p>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                                                    Description
                                                </div>
                                                <p className="text-slate-300">
                                                    {set.linkedin.description}
                                                </p>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                                                    CTA
                                                </div>
                                                <p className="text-slate-200">{set.linkedin.cta}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 md:p-8">
                                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-white mb-5">
                                            <Search size={16} className="text-[#4B8BB3]" />
                                            Google Search Ad
                                        </div>
                                        <div className="space-y-5 text-sm">
                                            <div>
                                                <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                                                    Headlines
                                                </div>
                                                <ul className="space-y-2">
                                                    {set.google.headlines.map((headline) => (
                                                        <li key={headline} className="text-white">
                                                            {headline}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                                                    Descriptions
                                                </div>
                                                <ul className="space-y-2">
                                                    {set.google.descriptions.map((description) => (
                                                        <li
                                                            key={description}
                                                            className="text-slate-300"
                                                        >
                                                            {description}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                                                    Path
                                                </div>
                                                <p className="text-slate-200">{set.google.path}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </FadeIn>
                    ))}
                </div>
            </section>
        </div>
    );
}
