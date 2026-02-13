import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, Info, Lightbulb, Megaphone, Search, Target } from 'lucide-react';
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

type LinkedInVariant = {
    variant: 'A' | 'B';
    headline: string;
    primaryText?: string;
    introductoryText?: string;
    description: string;
    cta: string;
};

type GoogleVariant = {
    variant: 'A' | 'B';
    headlines: string[];
    descriptions: string[];
    path: string;
};

type AdSet = {
    id: string;
    label: string;
    targetUrl: string;
    heroHeadline: string;
    linkedin: LinkedInVariant[];
    google: GoogleVariant[];
    rationale: string[];
};

const adSets: AdSet[] = [
    {
        id: '1',
        label: 'Features & Value Page',
        targetUrl: '/lp/1',
        heroHeadline: 'Learn Faster. Know More. Stay Certified.',
        linkedin: [
            {
                variant: 'A',
                primaryText:
                    'HR leaders are expected to move faster with better decisions and cleaner execution. EnhancedHR combines expert courses, 5 specialized AI agents, scoped collections, org learning tools, and analytics in one platform built for teams like yours.',
                headline: 'One Platform for HR Capability at Scale',
                description: 'Built for 100-1000 employee organizations.',
                cta: 'Learn More',
            },
            {
                variant: 'B',
                headline: 'The AI-Native Knowledge Platform Built for HR Teams',
                introductoryText:
                    '5 scoped AI agents. Expert-led courses. SHRM/HRCI credits. One platform built for how HR actually works. Try it free for 7 days.',
                description:
                    'AI tutors, course assistants, collections, and org tools. SHRM approved. Start your free trial.',
                cta: 'Learn More',
            },
        ],
        google: [
            {
                variant: 'A',
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
            {
                variant: 'B',
                headlines: [
                    'AI-Native Platform for HR',
                    '5 AI Agents. SHRM Approved.',
                    'HR Learning, Reimagined',
                ],
                descriptions: [
                    '5 scoped AI agents, expert-led courses, and SHRM/HRCI credits. 7-day free trial.',
                    'Collections, AI tutors, and org tools in one platform. SHRM approved. Try free.',
                ],
                path: 'enhancedhr.ai/lp/1',
            },
        ],
        rationale: [
            'Ads lead with tangible specifics (5 AI agents, SHRM/HRCI credits) to attract intent-driven searchers looking for HR learning platforms.',
            'Google headlines front-load "AI-Native" and "SHRM Approved" since these are the highest-signal terms for the target buyer.',
            'LinkedIn copy leans into the breadth of the platform to appeal to leaders evaluating tools for their teams.',
            'Hero headline resolves the ad promise into outcomes while a pre-headline badge immediately reinforces ad specifics.',
        ],
    },
    {
        id: '2',
        label: 'Challenger Narrative Page',
        targetUrl: '/lp/2',
        heroHeadline: 'AI Won\u2019t Save You. Your People Will.',
        linkedin: [
            {
                variant: 'A',
                primaryText:
                    'AI is table stakes. The real advantage is decision velocity. If your knowledge is fragmented, your teams move slower and decisions drift. See the challenger blueprint for turning HR knowledge into scoped, decision-grade context.',
                headline: 'Decision Velocity Is the New Moat',
                description: 'A 14-day pilot model for HR leaders.',
                cta: 'Learn More',
            },
            {
                variant: 'B',
                headline: 'AI Is Table Stakes. Decision Velocity Is the Real Moat.',
                introductoryText:
                    'When every org has AI, speed alone won\u2019t differentiate you. The winners will be the ones whose people find truth and act on it fastest.',
                description:
                    'Scoped AI agents turn scattered knowledge into decision-grade context. 7-day free trial.',
                cta: 'Learn More',
            },
        ],
        google: [
            {
                variant: 'A',
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
            {
                variant: 'B',
                headlines: [
                    'AI Is a Commodity. Now What?',
                    'Your People Are the Moat',
                    'Boost Decision Velocity',
                ],
                descriptions: [
                    '47% of workers can\u2019t find what they need. Fix knowledge fragmentation. 7-day free trial.',
                    'AI alone won\u2019t differentiate you. Decision velocity will. See how. Try free for 7 days.',
                ],
                path: 'enhancedhr.ai/lp/2',
            },
        ],
        rationale: [
            'Ads use the provocative reframe from the challenger narrative: AI is a commodity, people are the differentiator.',
            'Google description D1 uses the Gartner stat (47% of workers struggle to find information) as a pattern interrupt in search results.',
            'LinkedIn copy speaks directly to the strategic HR leader who thinks beyond tool adoption to organizational capability.',
        ],
    },
    {
        id: '3',
        label: 'Original Page (Human Velocity OS)',
        targetUrl: '/lp/3',
        heroHeadline: 'From Human Resources to Human Relevance.',
        linkedin: [
            {
                variant: 'A',
                primaryText:
                    'Most companies have content. Few have a capability operating system. EnhancedHR helps HR teams convert learning, policy, and institutional knowledge into faster execution through scoped AI workflows.',
                headline: 'Build Your Human Velocity OS',
                description: 'Turn knowledge into aligned action.',
                cta: 'Learn More',
            },
            {
                variant: 'B',
                headline: 'Your Role Is Evolving. Your Platform Should Too.',
                introductoryText:
                    'HR is no longer about resources. It\u2019s about relevance. A platform built for the leaders guiding their people through the biggest shift in work history.',
                description:
                    '5 AI agents, expert courses, and SHRM/HRCI credits. Built for modern HR leaders. Try free.',
                cta: 'Learn More',
            },
        ],
        google: [
            {
                variant: 'A',
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
            {
                variant: 'B',
                headlines: [
                    'From HR to Human Relevance',
                    'Lead the AI Transformation',
                    'HR Leaders Deserve Better',
                ],
                descriptions: [
                    'AI is transforming your workforce. Lead the change with 5 scoped AI agents. Try free.',
                    'Built for the HR leader navigating AI-era complexity. SHRM approved. 7-day free trial.',
                ],
                path: 'enhancedhr.ai/lp/3',
            },
        ],
        rationale: [
            'Ads center the buyer\u2019s identity and the "Human Resources to Human Relevance" reframe.',
            'Google headlines lead with the transformation narrative to resonate emotionally with HR leaders who feel the pressure of AI disruption.',
            'LinkedIn copy mirrors the empathy-first tone of the landing page, validating the buyer\u2019s situation before introducing the platform.',
        ],
    },
];

const generalNotes = [
    'All ads include the 7-day free trial offer to reduce friction.',
    'SHRM and HRCI are referenced by name (not generically as "certifications") for credibility and search relevance.',
    'No exclamation marks or ALL CAPS used outside of brand names.',
    'Character counts verified for each variant.',
];

function LinkedInVariantCard({ data }: { data: LinkedInVariant }) {
    return (
        <div className="space-y-4 text-sm">
            {data.primaryText && (
                <div>
                    <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                        Primary Text
                    </div>
                    <p className="text-slate-300 leading-relaxed">{data.primaryText}</p>
                </div>
            )}
            {data.introductoryText && (
                <div>
                    <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                        Introductory Text
                    </div>
                    <p className="text-slate-300 leading-relaxed">{data.introductoryText}</p>
                </div>
            )}
            <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                    Headline
                </div>
                <p className="text-white font-medium">{data.headline}</p>
            </div>
            <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                    Description
                </div>
                <p className="text-slate-300">{data.description}</p>
            </div>
            <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">CTA</div>
                <p className="text-slate-200">{data.cta}</p>
            </div>
        </div>
    );
}

function GoogleVariantCard({ data }: { data: GoogleVariant }) {
    return (
        <div className="space-y-5 text-sm">
            <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                    Headlines
                </div>
                <ul className="space-y-2">
                    {data.headlines.map((headline) => (
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
                    {data.descriptions.map((description) => (
                        <li key={description} className="text-slate-300">
                            {description}
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Path</div>
                <p className="text-slate-200">{data.path}</p>
            </div>
        </div>
    );
}

function VariantLabel({ variant }: { variant: 'A' | 'B' }) {
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                variant === 'A'
                    ? 'bg-[#4B8BB3]/15 text-[#78C0F0] border border-[#4B8BB3]/25'
                    : 'bg-purple-500/15 text-purple-300 border border-purple-500/25'
            }`}
        >
            Variant {variant}
        </span>
    );
}

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
                            Shareable campaign creative mapped one-to-one with each landing page for
                            HR leaders in 100-1000 employee organizations.
                        </p>
                    </FadeIn>

                    <FadeIn delay={120}>
                        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-5xl">
                            {adSets.map((set) => (
                                <a
                                    key={set.id}
                                    href={`#ad-set-${set.id}`}
                                    className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-colors"
                                >
                                    <div className="text-xs text-slate-500 mb-1">
                                        Ad Set {set.id}
                                    </div>
                                    <div className="text-sm font-semibold text-white">
                                        {set.label}
                                    </div>
                                    <Link
                                        href={set.targetUrl}
                                        className="mt-2 inline-flex items-center gap-1 text-xs text-[#78C0F0] hover:text-white transition-colors"
                                    >
                                        {set.targetUrl} <ExternalLink size={12} />
                                    </Link>
                                </a>
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
                            <article
                                id={`ad-set-${set.id}`}
                                className="rounded-2xl bg-white/[0.02] border border-white/[0.08] overflow-hidden scroll-mt-8"
                            >
                                {/* Header */}
                                <div className="px-6 md:px-8 py-6 border-b border-white/[0.08] bg-white/[0.01]">
                                    <div className="text-xs uppercase tracking-wider text-[#4B8BB3] mb-2">
                                        Ad Set {set.id}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                                        {set.label}
                                    </h2>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                                        <Link
                                            href={set.targetUrl}
                                            className="inline-flex items-center gap-1 text-sm text-[#78C0F0] hover:text-white transition-colors"
                                        >
                                            Target URL: {set.targetUrl}{' '}
                                            <ExternalLink size={14} />
                                        </Link>
                                    </div>
                                    <div className="mt-4 pl-4 border-l-2 border-[#4B8BB3]/30">
                                        <p className="text-lg md:text-xl text-slate-300 italic leading-relaxed">
                                            &ldquo;{set.heroHeadline}&rdquo;
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Hero Headline
                                        </p>
                                    </div>
                                </div>

                                {/* LinkedIn Ads */}
                                <div className="border-b border-white/[0.08]">
                                    <div className="px-6 md:px-8 pt-6 pb-2">
                                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                                            <Target size={16} className="text-[#FF9300]" />
                                            LinkedIn Ads
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2">
                                        {set.linkedin.map((li, liIndex) => (
                                            <div
                                                key={li.variant}
                                                className={`p-6 md:p-8 ${
                                                    liIndex === 0
                                                        ? 'border-b lg:border-b-0 lg:border-r border-white/[0.08]'
                                                        : ''
                                                }`}
                                            >
                                                <div className="mb-4">
                                                    <VariantLabel variant={li.variant} />
                                                </div>
                                                <LinkedInVariantCard data={li} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Google Ads */}
                                <div className="border-b border-white/[0.08]">
                                    <div className="px-6 md:px-8 pt-6 pb-2">
                                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                                            <Search size={16} className="text-[#4B8BB3]" />
                                            Google Search Ads
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2">
                                        {set.google.map((g, gIndex) => (
                                            <div
                                                key={g.variant}
                                                className={`p-6 md:p-8 ${
                                                    gIndex === 0
                                                        ? 'border-b lg:border-b-0 lg:border-r border-white/[0.08]'
                                                        : ''
                                                }`}
                                            >
                                                <div className="mb-4">
                                                    <VariantLabel variant={g.variant} />
                                                </div>
                                                <GoogleVariantCard data={g} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Message-Match Rationale */}
                                <div className="px-6 md:px-8 py-6 bg-amber-500/[0.03]">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300/90 mb-4">
                                        <Lightbulb size={16} />
                                        Message-Match Rationale
                                    </div>
                                    <ul className="space-y-2.5">
                                        {set.rationale.map((point) => (
                                            <li
                                                key={point}
                                                className="flex gap-3 text-sm text-slate-400 leading-relaxed"
                                            >
                                                <span className="text-amber-400/60 mt-1.5 shrink-0">
                                                    &bull;
                                                </span>
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </article>
                        </FadeIn>
                    ))}

                    {/* General Notes */}
                    <FadeIn delay={adSets.length * 80}>
                        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.08] overflow-hidden">
                            <div className="px-6 md:px-8 py-6">
                                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#78C0F0] mb-4">
                                    <Info size={16} />
                                    General Notes
                                </div>
                                <ul className="space-y-2.5">
                                    {generalNotes.map((note) => (
                                        <li
                                            key={note}
                                            className="flex gap-3 text-sm text-slate-400 leading-relaxed"
                                        >
                                            <span className="text-[#4B8BB3]/60 mt-1.5 shrink-0">
                                                &bull;
                                            </span>
                                            <span>{note}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>
        </div>
    );
}
