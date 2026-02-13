import type { Metadata } from 'next';
import Link from 'next/link';
import {
    Award,
    BarChart3,
    CheckCircle,
    ExternalLink,
    Info,
    Lightbulb,
    Megaphone,
    Search,
    Star,
    Target,
    TrendingUp,
    Trophy,
    Zap,
    AlertTriangle,
    ArrowUpRight,
} from 'lucide-react';
import FadeIn from '@/components/marketing/FadeIn';
import HeroBackground from '@/components/marketing/HeroBackground';
import MarketingDivider from '@/components/marketing/MarketingDivider';

export const metadata: Metadata = {
    title: 'Optimized Landing Page Ad Sets — EnhancedHR.ai',
    description:
        'Round 2 optimized landing pages and ad campaigns. LP7, LP8, LP9 — each built from the best of two predecessors. Scored and ranked.',
    robots: {
        index: false,
        follow: false,
    },
};

/* ─── Types ─── */

type LinkedInAd = {
    primaryText?: string;
    introductoryText?: string;
    headline: string;
    description: string;
    cta: string;
};

type GoogleAd = {
    headlines: string[];
    descriptions: string[];
    path: string;
};

type LandingPage = {
    id: string;
    url: string;
    heroHeadline: string;
    linkedin: LinkedInAd;
    google: GoogleAd;
    rationale: string[];
    sourcePages: string;
};

type Category = {
    id: string;
    label: string;
    pages: LandingPage[];
};

type CriterionScore = {
    criterion: string;
    weight: number;
    score: number;
};

type AdScore = {
    platform: 'LinkedIn' | 'Google';
    scores: CriterionScore[];
    weighted: number;
};

type LandingPageScore = {
    pageId: string;
    lpScores: CriterionScore[];
    lpWeighted: number;
    adScores: AdScore[];
    combined: number;
    rank: number;
    expertAssessment: string;
};

type RubricRow = {
    criterion: string;
    weight: string;
    fiveLooksLike: string;
};

/* ─── Data ─── */

const categories: Category[] = [
    {
        id: '1',
        label: 'Features & Value',
        pages: [
            {
                id: '7',
                url: '/lp/7',
                heroHeadline: 'Learn Faster. Know More. Stay Certified.',
                sourcePages: 'LP4 foundation + LP1 strengths',
                linkedin: {
                    introductoryText:
                        'Your team is Googling policies that should be instantly findable. Your managers are making decisions with outdated playbooks. Your AI tools answer questions nobody asked. Here\u2019s what happens when HR teams get a platform built for how they actually work.',
                    headline: 'AI-Native HR Learning for 100\u20131,000 Employee Teams',
                    description:
                        '5 scoped AI agents, expert-led courses, SHRM & HRCI credits. 7-day free trial, no credit card.',
                    cta: 'Learn More',
                },
                google: {
                    headlines: [
                        'AI HR Learning Platform',
                        '5 AI Agents. SHRM Approved.',
                        'Built for 100\u20131,000 Employees',
                    ],
                    descriptions: [
                        '5 scoped AI agents, expert courses, knowledge collections, and SHRM/HRCI credits. No credit card. Try free.',
                        'Replace your fragmented LMS. AI tutors, course assistant, collections, org tools. 7-day free trial.',
                    ],
                    path: 'enhancedhr.ai/lp/7',
                },
                rationale: [
                    'LinkedIn introductory text opens with a pain-point pattern interrupt — three specific frustrations the buyer will recognize — before introducing the platform. This replaces the generic benefit-first opener from LP4.',
                    'Headline adds "100\u20131,000 Employee Teams" as ICP qualifier (strongest qualifying signal from LP1\u2019s ads) to reduce unqualified clicks.',
                    'Google H1 front-loads "AI HR Learning Platform" for search intent. H3 adds org-size qualifier. D2 adds "No credit card" for friction reduction (missing from LP4 ads).',
                    'All ad copy preserves LP4\u2019s strongest specifics (5 agents, SHRM/HRCI, 7-day trial) while adding LP1\u2019s ICP precision.',
                ],
            },
        ],
    },
    {
        id: '2',
        label: 'Challenger Narrative',
        pages: [
            {
                id: '8',
                url: '/lp/8',
                heroHeadline: 'AI Won\u2019t Save You. Your People Will.',
                sourcePages: 'LP5 foundation + LP2 strengths',
                linkedin: {
                    introductoryText:
                        'When every org has AI, speed alone won\u2019t differentiate you. The winners will be the ones whose people find truth and act on it fastest. 5 scoped AI agents turn scattered knowledge into decision-grade context. See what happens in 14 days.',
                    headline: 'AI Is Table Stakes. Decision Velocity Is the Real Moat.',
                    description:
                        'Expert courses, knowledge collections, and SHRM/HRCI credits for HR teams at 100\u20131,000 employee orgs. 7-day free trial.',
                    cta: 'Learn More',
                },
                google: {
                    headlines: [
                        'AI Is a Commodity. Now What?',
                        'Decision Velocity for HR',
                        'Built for 100\u20131,000 Employee Teams',
                    ],
                    descriptions: [
                        '47% of workers can\u2019t find what they need. Fix knowledge fragmentation with 5 scoped AI agents. No credit card required.',
                        'Expert courses, AI tutors, collections & org tools. SHRM approved. Start your free trial today.',
                    ],
                    path: 'enhancedhr.ai/lp/8',
                },
                rationale: [
                    'LinkedIn preserves LP5\u2019s best-in-set provocative reframe ("AI is table stakes") while adding specificity: "5 scoped AI agents" and "7-day free trial" were missing from the original.',
                    'The introductory text adds the 14-day proof concept from LP2 ("See what happens in 14 days") as a tangible commitment frame.',
                    'Google H1 keeps "AI Is a Commodity. Now What?" — the highest scroll-stop headline. H3 adds ICP qualifier. D1 adds "No credit card required" (missing from LP5 Google ads).',
                    'The Gartner stat ("47%") is retained in Google D1 because it provides instant credibility in search results.',
                ],
            },
        ],
    },
    {
        id: '3',
        label: 'Creative / Identity-First',
        pages: [
            {
                id: '9',
                url: '/lp/9',
                heroHeadline: 'You carry the weight of every person in your organization.',
                sourcePages: 'LP6 foundation + LP3 strengths',
                linkedin: {
                    introductoryText:
                        'Nobody built a platform for the people who build everyone else. Until now. AI-native learning and knowledge management designed for the HR leaders navigating the biggest shift in work history. 5 AI agents. SHRM approved.',
                    headline: 'Built for the HR Leaders Who Hold It All Together',
                    description:
                        'Expert courses, 5 scoped AI agents, knowledge collections, SHRM & HRCI credits. 7-day free trial.',
                    cta: 'Learn More',
                },
                google: {
                    headlines: [
                        'AI HR Learning Platform',
                        'SHRM Approved. 5 AI Agents.',
                        'Built for 100\u20131,000 Employee Teams',
                    ],
                    descriptions: [
                        'AI-native learning and knowledge platform for HR leaders. Expert courses, 5 AI agents, SHRM credits. Try free.',
                        'Built for 100\u20131,000 employee orgs. Collections, AI tutors, org tools. No credit card. 7-day trial.',
                    ],
                    path: 'enhancedhr.ai/lp/9',
                },
                rationale: [
                    'LinkedIn introductory text replaces LP6\u2019s bland opener with the most emotionally provocative hook in the set: "Nobody built a platform for the people who build everyone else." This directly validates the buyer\u2019s identity.',
                    'Specificity injected: "5 AI agents. SHRM approved." was missing from LP6\u2019s LinkedIn ads. This grounds the emotional appeal with concrete proof.',
                    'Google ads completely rethought — LP6\u2019s "From HR to Human Relevance" is not a search query. Now leads with "AI HR Learning Platform" for search intent while keeping "SHRM Approved" and "7-day trial".',
                    'The identity resonance is preserved in LinkedIn (where it belongs) while Google is restructured for intent matching (where features and credentials win).',
                ],
            },
        ],
    },
];

const generalNotes = [
    'All ads include the 7-day free trial and "no credit card" to maximize friction reduction.',
    'SHRM and HRCI are referenced by name for credibility and search relevance.',
    'ICP qualifier (100\u20131,000 employees) now appears in every ad set across both platforms.',
    'LinkedIn copy is feed-native (thought leadership tone). Google copy is intent-optimized (front-loaded keywords).',
    'Each LP inherits conversion mechanics (TrustBar, LandingCTA, pricing) from LP4 while preserving its category\u2019s messaging strategy.',
];

/* ─── Scoring Data ─── */

const scores: LandingPageScore[] = [
    {
        pageId: '7',
        lpScores: [
            { criterion: 'Speed-to-Value Clarity', weight: 25, score: 5 },
            { criterion: 'CTA Architecture', weight: 20, score: 5 },
            { criterion: 'Persona Specificity', weight: 15, score: 5 },
            { criterion: 'Proof & Credibility', weight: 15, score: 4 },
            { criterion: 'Cognitive Load vs. Length', weight: 15, score: 4 },
            { criterion: 'Differentiation', weight: 10, score: 5 },
        ],
        lpWeighted: 4.70,
        adScores: [
            {
                platform: 'LinkedIn',
                scores: [
                    { criterion: 'Pattern Interrupt', weight: 20, score: 4 },
                    { criterion: 'Message-Match', weight: 20, score: 5 },
                    { criterion: 'Value Prop Specificity', weight: 15, score: 5 },
                    { criterion: 'CTA & Friction Reduction', weight: 15, score: 5 },
                    { criterion: 'Platform Optimization', weight: 15, score: 4 },
                    { criterion: 'Qualified Click Targeting', weight: 15, score: 4 },
                ],
                weighted: 4.50,
            },
            {
                platform: 'Google',
                scores: [
                    { criterion: 'Pattern Interrupt', weight: 20, score: 4 },
                    { criterion: 'Message-Match', weight: 20, score: 5 },
                    { criterion: 'Value Prop Specificity', weight: 15, score: 5 },
                    { criterion: 'CTA & Friction Reduction', weight: 15, score: 5 },
                    { criterion: 'Platform Optimization', weight: 15, score: 5 },
                    { criterion: 'Qualified Click Targeting', weight: 15, score: 4 },
                ],
                weighted: 4.65,
            },
        ],
        combined: 4.62,
        rank: 1,
        expertAssessment:
            'LP7 is the best all-around page in the entire portfolio (LP1\u2013LP9). It inherits LP4\u2019s conversion machine mechanics \u2014 hero mockup, TrustBar, multiple CTAs, pricing, SHRM badges \u2014 while fixing LP4\u2019s two weaknesses: differentiation (now explicitly names LinkedIn Learning, generic LMS, and ChatGPT as what\u2019s broken) and persona specificity (now opens with "100\u20131,000 Employee Teams" in the badge). The "Why Teams Switch" section from LP1 adds outcome proof that LP4 lacked. Cognitive load is reduced from 842 to ~530 lines without losing any conversion-critical content. The ads are the strongest in the set: pain-point opener on LinkedIn, front-loaded keywords on Google, ICP qualifier on both, and "no credit card" added everywhere. This should be the highest-confidence bet across all channels.',
    },
    {
        pageId: '8',
        lpScores: [
            { criterion: 'Speed-to-Value Clarity', weight: 25, score: 5 },
            { criterion: 'CTA Architecture', weight: 20, score: 5 },
            { criterion: 'Persona Specificity', weight: 15, score: 4 },
            { criterion: 'Proof & Credibility', weight: 15, score: 4 },
            { criterion: 'Cognitive Load vs. Length', weight: 15, score: 4 },
            { criterion: 'Differentiation', weight: 10, score: 5 },
        ],
        lpWeighted: 4.55,
        adScores: [
            {
                platform: 'LinkedIn',
                scores: [
                    { criterion: 'Pattern Interrupt', weight: 20, score: 5 },
                    { criterion: 'Message-Match', weight: 20, score: 4 },
                    { criterion: 'Value Prop Specificity', weight: 15, score: 5 },
                    { criterion: 'CTA & Friction Reduction', weight: 15, score: 4 },
                    { criterion: 'Platform Optimization', weight: 15, score: 5 },
                    { criterion: 'Qualified Click Targeting', weight: 15, score: 4 },
                ],
                weighted: 4.50,
            },
            {
                platform: 'Google',
                scores: [
                    { criterion: 'Pattern Interrupt', weight: 20, score: 5 },
                    { criterion: 'Message-Match', weight: 20, score: 4 },
                    { criterion: 'Value Prop Specificity', weight: 15, score: 5 },
                    { criterion: 'CTA & Friction Reduction', weight: 15, score: 4 },
                    { criterion: 'Platform Optimization', weight: 15, score: 4 },
                    { criterion: 'Qualified Click Targeting', weight: 15, score: 4 },
                ],
                weighted: 4.35,
            },
        ],
        combined: 4.47,
        rank: 2,
        expertAssessment:
            'LP8 is what LP5 should have been. It keeps the provocative thesis ("AI Won\u2019t Save You. Your People Will.") and the third-party statistics (Gartner 47%, Atlassian 25%) that made LP5\u2019s ads the best in Round 1. But it fixes LP5\u2019s critical flaw: the product reveal was buried in section 6 of 7. Now it\u2019s section 3. The page adds pricing (missing from LP5), the 14-day pilot concept from LP2 (which gives skeptics a structured commitment frame), and the full CTA architecture. Cognitive load drops from 658 to ~490 lines. The ads retain their scroll-stopping power while adding the specifics (5 agents, no credit card, 100\u20131K employees) that LP5\u2019s ads lacked. Best bet for LinkedIn where the feed rewards thought leadership and pattern interrupts.',
    },
    {
        pageId: '9',
        lpScores: [
            { criterion: 'Speed-to-Value Clarity', weight: 25, score: 5 },
            { criterion: 'CTA Architecture', weight: 20, score: 5 },
            { criterion: 'Persona Specificity', weight: 15, score: 4 },
            { criterion: 'Proof & Credibility', weight: 15, score: 4 },
            { criterion: 'Cognitive Load vs. Length', weight: 15, score: 3 },
            { criterion: 'Differentiation', weight: 10, score: 5 },
        ],
        lpWeighted: 4.40,
        adScores: [
            {
                platform: 'LinkedIn',
                scores: [
                    { criterion: 'Pattern Interrupt', weight: 20, score: 4 },
                    { criterion: 'Message-Match', weight: 20, score: 5 },
                    { criterion: 'Value Prop Specificity', weight: 15, score: 4 },
                    { criterion: 'CTA & Friction Reduction', weight: 15, score: 4 },
                    { criterion: 'Platform Optimization', weight: 15, score: 3 },
                    { criterion: 'Qualified Click Targeting', weight: 15, score: 4 },
                ],
                weighted: 4.05,
            },
            {
                platform: 'Google',
                scores: [
                    { criterion: 'Pattern Interrupt', weight: 20, score: 4 },
                    { criterion: 'Message-Match', weight: 20, score: 4 },
                    { criterion: 'Value Prop Specificity', weight: 15, score: 3 },
                    { criterion: 'CTA & Friction Reduction', weight: 15, score: 4 },
                    { criterion: 'Platform Optimization', weight: 15, score: 4 },
                    { criterion: 'Qualified Click Targeting', weight: 15, score: 4 },
                ],
                weighted: 3.85,
            },
        ],
        combined: 4.10,
        rank: 3,
        expertAssessment:
            'LP9 solves LP6\u2019s biggest problem without destroying its magic. The hero still validates the buyer\u2019s identity (\u201cYou carry the weight\u201d), but now the subheadline immediately names the product (\u201cthe AI-native learning and knowledge platform\u201d). The product reveal moves from section 4 to section 3 with a Gartner stat. The shift from 6 weight cards to 4 tightens the emotional opening. LP3\u2019s implementation rhythm concept (\u201cDay 1 / Week 1 / Month 1\u201d) replaces LP6\u2019s generic pricing closer with something actionable. The Google ads are completely restructured \u2014 LP6\u2019s "From HR to Human Relevance" was emotionally resonant but not a search query. Now H1 is "AI HR Learning Platform" for intent matching. LinkedIn keeps the identity resonance where it belongs. The ceiling is still high-risk \u2014 emotional approaches can dramatically outperform or dramatically underperform \u2014 but the floor is much higher than LP6.',
    },
];

const top3 = [
    {
        rank: 1,
        pageId: '7',
        headline: 'Learn Faster. Know More. Stay Certified.',
        category: 'Features & Value',
        combined: 4.62,
        url: '/lp/7',
        sourcePages: 'LP4 + LP1',
        why: 'Strongest conversion mechanics + highest combined score. LP4\u2019s clarity and proof density with LP1\u2019s ICP precision and differentiation. Best all-around candidate for both Google and LinkedIn.',
    },
    {
        rank: 2,
        pageId: '8',
        headline: 'AI Won\u2019t Save You. Your People Will.',
        category: 'Challenger Narrative',
        combined: 4.47,
        url: '/lp/8',
        sourcePages: 'LP5 + LP2',
        why: 'Best ad copy in the portfolio with scroll-stopping provocative framing. LP5\u2019s thought-leadership power with LP2\u2019s tactical proof (14-day pilot). Best bet for LinkedIn.',
    },
    {
        rank: 3,
        pageId: '9',
        headline: 'You carry the weight of every person in your organization.',
        category: 'Creative / Identity-First',
        combined: 4.10,
        url: '/lp/9',
        sourcePages: 'LP6 + LP3',
        why: 'Deepest persona resonance with a higher floor. LP6\u2019s emotional identity validation with LP3\u2019s systems thinking and implementation rhythm. High-risk, high-reward.',
    },
];

const lpRubric: RubricRow[] = [
    {
        criterion: 'Speed-to-Value Clarity',
        weight: '25%',
        fiveLooksLike:
            'Visitor understands what this is, who it\u2019s for, and what they get in 5 seconds from the hero alone. Concrete language, specific features, audience named.',
    },
    {
        criterion: 'CTA Architecture',
        weight: '20%',
        fiveLooksLike:
            '3+ CTA placements, "7-day free trial, no credit card" adjacent to CTAs, TrustBar with SHRM/HRCI, primary/secondary hierarchy.',
    },
    {
        criterion: 'Persona Specificity',
        weight: '15%',
        fiveLooksLike:
            'Explicitly names org size (100\u20131K), uses CHRO/VP-level language, names role-specific pain points (AI strategy, compliance, manager coaching). Reader thinks "this was built for me."',
    },
    {
        criterion: 'Proof & Credibility',
        weight: '15%',
        fiveLooksLike:
            'SHRM/HRCI badges prominent, product mockups, transparent pricing, external statistics with sources, specific quantified claims.',
    },
    {
        criterion: 'Cognitive Load vs. Length',
        weight: '15%',
        fiveLooksLike:
            'Concise or every section adds conversion value (features, pricing, mockups). Product-first, not narrative-first. No filler.',
    },
    {
        criterion: 'Differentiation',
        weight: '10%',
        fiveLooksLike:
            'Explicitly contrasts against alternatives (generic LMS, unscoped AI). Visitor can articulate "this is different because\u2026"',
    },
];

const adRubric: RubricRow[] = [
    {
        criterion: 'Pattern Interrupt',
        weight: '20%',
        fiveLooksLike:
            'Creates cognitive dissonance, challenges a belief, or states something provocative. Contains specific stats or numbers. Forces the reader to click.',
    },
    {
        criterion: 'Message-Match',
        weight: '20%',
        fiveLooksLike:
            'Ad headline mirrors landing page hero. Vocabulary, framing, and emotional tone are continuous. Click feels like turning a page.',
    },
    {
        criterion: 'Value Prop Specificity',
        weight: '15%',
        fiveLooksLike:
            '3+ specific elements: named features (5 AI agents), credentials (SHRM/HRCI), statistics, trial terms. Every phrase carries information.',
    },
    {
        criterion: 'CTA & Friction Reduction',
        weight: '15%',
        fiveLooksLike:
            '"7-day free trial" prominent, "no credit card" present, CTA is specific ("Start your free trial"). Reader knows what happens after clicking.',
    },
    {
        criterion: 'Platform Optimization',
        weight: '15%',
        fiveLooksLike:
            'LinkedIn: reads like thought-leadership, feed-native. Google: front-loaded keywords, efficient characters, matches search intent.',
    },
    {
        criterion: 'Qualified Click Targeting',
        weight: '15%',
        fiveLooksLike:
            'Includes ICP signals: org size, seniority language, strategic framing. Attracts HR leaders, repels junior/enterprise/non-HR clicks.',
    },
];

/* ─── Sub-components ─── */

function ScoreDots({ score, max = 5 }: { score: number; max?: number }) {
    return (
        <div className="flex gap-1">
            {Array.from({ length: max }).map((_, i) => (
                <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                        i < score ? 'bg-[#4B8BB3]' : 'bg-white/[0.08]'
                    }`}
                />
            ))}
        </div>
    );
}

function RankBadge({ rank }: { rank: number }) {
    return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-emerald-400/15 text-emerald-400 border border-emerald-400/30">
            #{rank}
        </div>
    );
}

function ScoreTable({
    title,
    icon,
    scores: criteriaScores,
    weighted,
}: {
    title: string;
    icon: React.ReactNode;
    scores: CriterionScore[];
    weighted: number;
}) {
    return (
        <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300">
                {icon}
                {title}
            </div>
            <div className="space-y-2">
                {criteriaScores.map((s) => (
                    <div
                        key={s.criterion}
                        className="flex items-center justify-between gap-3"
                    >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-[11px] text-slate-500 truncate">
                                {s.criterion}
                            </span>
                            <span className="text-[10px] text-slate-600 shrink-0">
                                {s.weight}%
                            </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <ScoreDots score={s.score} />
                            <span className="text-[11px] text-slate-400 w-4 text-right">
                                {s.score}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                <span className="text-[11px] font-medium text-slate-400">
                    Weighted Score
                </span>
                <span className="text-sm font-bold text-white">{weighted.toFixed(2)}</span>
            </div>
        </div>
    );
}

function ScorecardSection({ pageId }: { pageId: string }) {
    const scoreData = scores.find((s) => s.pageId === pageId);
    if (!scoreData) return null;

    return (
        <div className="border-t border-white/[0.06]">
            {/* Score header */}
            <div className="px-5 md:px-6 py-4 bg-white/[0.01] border-b border-white/[0.06]">
                <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-3">
                        <RankBadge rank={scoreData.rank} />
                        <div>
                            <div className="text-xs font-semibold text-white">
                                Conversion Scorecard
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                                Rank #{scoreData.rank} of 3
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                            {scoreData.combined.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                            Combined / 5.00
                        </div>
                    </div>
                </div>
            </div>

            {/* Score breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
                <div className="p-5 md:p-6">
                    <ScoreTable
                        title="Landing Page"
                        icon={<Target size={12} className="text-[#FF9300]" />}
                        scores={scoreData.lpScores}
                        weighted={scoreData.lpWeighted}
                    />
                </div>
                {scoreData.adScores.map((ad) => (
                    <div key={ad.platform} className="p-5 md:p-6">
                        <ScoreTable
                            title={`${ad.platform} Ad`}
                            icon={
                                ad.platform === 'LinkedIn' ? (
                                    <Target size={12} className="text-[#0A66C2]" />
                                ) : (
                                    <Search size={12} className="text-[#4B8BB3]" />
                                )
                            }
                            scores={ad.scores}
                            weighted={ad.weighted}
                        />
                    </div>
                ))}
            </div>

            {/* Expert assessment */}
            <div className="px-5 md:px-6 py-4 bg-emerald-500/[0.02] border-t border-white/[0.06]">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400/90 mb-2">
                    <Award size={12} />
                    Expert Assessment
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                    {scoreData.expertAssessment}
                </p>
            </div>
        </div>
    );
}

function RubricTable({ rows }: { rows: RubricRow[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-white/[0.06]">
                        <th className="text-left text-[11px] uppercase tracking-wider text-slate-500 pb-3 pr-4">
                            Criterion
                        </th>
                        <th className="text-left text-[11px] uppercase tracking-wider text-slate-500 pb-3 pr-4 w-16">
                            Weight
                        </th>
                        <th className="text-left text-[11px] uppercase tracking-wider text-slate-500 pb-3">
                            What a 5 Looks Like
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr
                            key={row.criterion}
                            className="border-b border-white/[0.03] last:border-0"
                        >
                            <td className="py-3 pr-4 text-white font-medium text-[13px] align-top">
                                {row.criterion}
                            </td>
                            <td className="py-3 pr-4 text-[#4B8BB3] font-semibold text-[13px] align-top">
                                {row.weight}
                            </td>
                            <td className="py-3 text-slate-400 text-[13px] leading-relaxed align-top">
                                {row.fiveLooksLike}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function LinkedInAdCard({ data }: { data: LinkedInAd }) {
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

function GoogleAdCard({ data }: { data: GoogleAd }) {
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

function LandingPageCard({ page }: { page: LandingPage }) {
    return (
        <div
            id={`lp-${page.id}`}
            className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden scroll-mt-8"
        >
            {/* Page header */}
            <div className="px-5 md:px-6 py-5 border-b border-white/[0.06] bg-white/[0.01]">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#4B8BB3]">
                            Landing Page {page.id}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                            {page.sourcePages}
                        </span>
                    </div>
                    <Link
                        href={page.url}
                        className="inline-flex items-center gap-1 text-xs text-[#78C0F0] hover:text-white transition-colors"
                    >
                        {page.url} <ExternalLink size={12} />
                    </Link>
                </div>
                <div className="pl-4 border-l-2 border-[#4B8BB3]/30">
                    <p className="text-base md:text-lg text-slate-300 italic leading-relaxed">
                        &ldquo;{page.heroHeadline}&rdquo;
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                        Hero Headline
                    </p>
                </div>
            </div>

            {/* Ad content: LinkedIn + Google side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-5 md:p-6 border-b lg:border-b-0 lg:border-r border-white/[0.06]">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-white mb-5">
                        <Target size={16} className="text-[#FF9300]" />
                        LinkedIn Ad
                    </div>
                    <LinkedInAdCard data={page.linkedin} />
                </div>

                <div className="p-5 md:p-6">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-white mb-5">
                        <Search size={16} className="text-[#4B8BB3]" />
                        Google Search Ad
                    </div>
                    <GoogleAdCard data={page.google} />
                </div>
            </div>

            {/* Rationale */}
            <div className="px-5 md:px-6 py-4 bg-amber-500/[0.03] border-t border-white/[0.06]">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-300/90 mb-3">
                    <Lightbulb size={14} />
                    Optimization Rationale
                </div>
                <ul className="space-y-2">
                    {page.rationale.map((point) => (
                        <li
                            key={point}
                            className="flex gap-3 text-sm text-slate-400 leading-relaxed"
                        >
                            <span className="text-amber-400/60 mt-1.5 shrink-0">&bull;</span>
                            <span>{point}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Scorecard */}
            <ScorecardSection pageId={page.id} />
        </div>
    );
}

/* ─── Page ─── */

export default function OptimizedAdSetsPage() {
    return (
        <div className="overflow-hidden">
            {/* ── Hero ── */}
            <section className="relative bg-[#0A0D12]">
                <HeroBackground />
                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-[200px] pb-[120px]">
                    <FadeIn className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-xs font-medium text-emerald-400 tracking-wide mb-6">
                            <TrendingUp size={12} /> ROUND 2 &mdash; OPTIMIZED
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.05] mb-6">
                            Optimized Landing Page
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#78C0F0]">
                                Ad Sets
                            </span>
                        </h1>
                        <p className="text-lg text-slate-400 leading-relaxed max-w-3xl">
                            Three optimized landing pages, each built from the strongest
                            elements of two predecessors. LP7, LP8, and LP9 preserve what worked
                            while fixing what didn&apos;t. Scored against the same rubrics for
                            direct comparison.
                        </p>
                        <div className="mt-4">
                            <Link
                                href="/lp/ad-sets"
                                className="inline-flex items-center gap-1.5 text-sm text-[#78C0F0] hover:text-white transition-colors"
                            >
                                View Round 1 (LP1&ndash;LP6) <ArrowUpRight size={14} />
                            </Link>
                        </div>
                    </FadeIn>

                    <FadeIn delay={120}>
                        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-5xl">
                            {categories.map((cat) => (
                                <a
                                    key={cat.id}
                                    href={`#category-${cat.id}`}
                                    className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-colors"
                                >
                                    <div className="text-xs text-slate-500 mb-1">
                                        Category {cat.id}
                                    </div>
                                    <div className="text-sm font-semibold text-white mb-2">
                                        {cat.label}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {cat.pages.map((page) => (
                                            <div key={page.id} className="flex items-center gap-2">
                                                <span className="text-xs text-[#78C0F0]">
                                                    {page.url}
                                                </span>
                                                <span className="text-[10px] text-slate-600">
                                                    ({page.sourcePages})
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </a>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* ── Top 3 Recommendation ── */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn>
                        <div className="mb-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-xs font-medium text-emerald-400 tracking-wide mb-5">
                                <Trophy size={12} /> LAUNCH RECOMMENDATION
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                All Three Are Launch-Ready
                            </h2>
                            <p className="text-slate-400">
                                Ranked by combined landing page + ad copy conversion probability.
                                Every page scores above 4.0 &mdash; a significant improvement
                                from Round 1 where only LP4 cleared that bar.
                            </p>
                        </div>
                    </FadeIn>

                    <FadeIn delay={80}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {top3.map((item) => (
                                <div
                                    key={item.pageId}
                                    className={`rounded-xl overflow-hidden border ${
                                        item.rank === 1
                                            ? 'border-emerald-400/30 bg-emerald-500/[0.04]'
                                            : item.rank === 2
                                              ? 'border-emerald-400/20 bg-emerald-500/[0.02]'
                                              : 'border-emerald-400/10 bg-white/[0.02]'
                                    }`}
                                >
                                    {/* Rank header */}
                                    <div className="px-5 py-4 border-b border-white/[0.06]">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                                    item.rank === 1
                                                        ? 'bg-emerald-400/20 text-emerald-400'
                                                        : item.rank === 2
                                                          ? 'bg-emerald-400/10 text-emerald-400/80'
                                                          : 'bg-emerald-400/[0.06] text-emerald-400/60'
                                                }`}
                                            >
                                                {item.rank}
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase tracking-wider">
                                                    {item.category}
                                                </div>
                                                <div className="text-sm font-semibold text-white">
                                                    LP{item.pageId}{' '}
                                                    <span className="text-xs font-normal text-slate-500">
                                                        ({item.sourcePages})
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-auto text-right">
                                                <div className="text-xl font-bold text-white">
                                                    {item.combined.toFixed(2)}
                                                </div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                                                    / 5.00
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="px-5 py-4 space-y-3">
                                        <p className="text-sm text-slate-300 italic leading-relaxed">
                                            &ldquo;{item.headline}&rdquo;
                                        </p>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            {item.why}
                                        </p>
                                        <Link
                                            href={item.url}
                                            className="inline-flex items-center gap-1 text-xs text-[#78C0F0] hover:text-white transition-colors"
                                        >
                                            View landing page{' '}
                                            <ExternalLink size={10} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </FadeIn>

                    {/* Strategic note */}
                    <FadeIn delay={160}>
                        <div className="mt-8 max-w-4xl mx-auto p-5 rounded-xl bg-emerald-500/[0.03] border border-emerald-400/10">
                            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400/90 mb-3">
                                <Zap size={12} />
                                Optimization Summary
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Round 1&apos;s top 3 scored 4.21 (LP4), 3.80 (LP5), and 3.51
                                (LP6). Round 2 scores 4.62 (LP7), 4.47 (LP8), and 4.10 (LP9)
                                &mdash; an average improvement of +0.69 points. The biggest gain
                                is LP8 (+0.67), where moving the product reveal from section 6 to
                                section 3 and adding pricing solved LP5&apos;s core structural
                                weakness. LP9&apos;s Google ads (+0.55 over LP6) show the largest
                                single-ad improvement from restructuring emotional copy into
                                intent-matching search ads.
                            </p>
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* ── Scoring Methodology ── */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn>
                        <div className="mb-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-5">
                                <BarChart3 size={12} /> SCORING METHODOLOGY
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                Rubric Definitions
                            </h2>
                            <p className="text-slate-400">
                                Same rubrics used in Round 1 for direct comparison. Each landing
                                page and ad set is scored on a 1&ndash;5 scale across weighted
                                criteria.
                            </p>
                        </div>
                    </FadeIn>

                    {/* Landing Page Rubric */}
                    <FadeIn delay={60}>
                        <div className="mb-10 rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.01]">
                                <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                                    <Target size={14} className="text-[#FF9300]" />
                                    Landing Page Rubric
                                </div>
                            </div>
                            <div className="px-6 py-4">
                                <RubricTable rows={lpRubric} />
                            </div>
                        </div>
                    </FadeIn>

                    {/* Ad Copy Rubric */}
                    <FadeIn delay={120}>
                        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.01]">
                                <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                                    <Megaphone size={14} className="text-[#4B8BB3]" />
                                    Ad Copy Rubric
                                </div>
                            </div>
                            <div className="px-6 py-4">
                                <RubricTable rows={adRubric} />
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            <MarketingDivider />

            {/* ── Categories with Landing Pages ── */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6 space-y-16">
                    {categories.map((cat, catIndex) => (
                        <FadeIn key={cat.id} delay={catIndex * 80}>
                            <div
                                id={`category-${cat.id}`}
                                className="scroll-mt-8"
                            >
                                {/* Category header */}
                                <div className="mb-6">
                                    <div className="text-xs uppercase tracking-wider text-[#4B8BB3] mb-2">
                                        Category {cat.id}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                                        {cat.label}
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Optimized landing page with matched ad creative
                                    </p>
                                </div>

                                {/* Landing pages within this category */}
                                <div className="space-y-6">
                                    {cat.pages.map((page) => (
                                        <LandingPageCard key={page.id} page={page} />
                                    ))}
                                </div>
                            </div>
                        </FadeIn>
                    ))}

                    {/* General Notes */}
                    <FadeIn delay={categories.length * 80}>
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

            <MarketingDivider />

            {/* ── Expert Analysis ── */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn>
                        <div className="mb-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-xs font-medium text-emerald-400 tracking-wide mb-5">
                                <Award size={12} /> EXPERT ANALYSIS
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white">
                                Overall Commentary
                            </h2>
                        </div>
                    </FadeIn>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Optimization Assessment */}
                        <FadeIn delay={60}>
                            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden h-full">
                                <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.01]">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                                        <Star size={14} className="text-emerald-400" />
                                        Optimization Assessment
                                    </div>
                                </div>
                                <div className="px-6 py-5">
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        Round 2 proves the thesis: you can preserve a page&apos;s
                                        core messaging strategy while dramatically improving its
                                        conversion mechanics. LP7 shows that feature-first
                                        messaging works best when paired with explicit
                                        differentiation. LP8 shows that provocative thought
                                        leadership works when the product reveal comes early. LP9
                                        shows that identity resonance works when backed by concrete
                                        proof. Every page now has full CTA architecture (TrustBar,
                                        multiple placements, trial terms), pricing, and ICP
                                        qualification &mdash; the three elements that separated LP4
                                        from the rest in Round 1.
                                    </p>
                                </div>
                            </div>
                        </FadeIn>

                        {/* What Changed */}
                        <FadeIn delay={120}>
                            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden h-full">
                                <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.01]">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                                        <TrendingUp size={14} className="text-emerald-400" />
                                        What Changed vs. Round 1
                                    </div>
                                </div>
                                <div className="px-6 py-5">
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        Round 1 showed that LP4 (Features &amp; Value) dominated
                                        because of superior conversion mechanics, not because
                                        feature-first messaging is inherently better. Round 2
                                        equalizes the mechanics so the messaging strategies compete
                                        on a level playing field. Now if LP8 outperforms LP7, it
                                        genuinely proves that challenger narratives resonate more
                                        than feature lists. If LP9 outperforms both, emotional
                                        identity validation is the key. The answer shapes not just
                                        ad strategy but the entire brand voice.
                                    </p>
                                </div>
                            </div>
                        </FadeIn>

                        {/* Budget Allocation */}
                        <FadeIn delay={180}>
                            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden h-full">
                                <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.01]">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                                        <CheckCircle size={14} className="text-emerald-400" />
                                        Budget Allocation
                                    </div>
                                </div>
                                <div className="px-6 py-5">
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        Equal $25 per page across LinkedIn and Google. LP7 should
                                        lean Google ($15 Google / $10 LinkedIn) where its
                                        feature-rich, intent-matching ads excel. LP8 should lean
                                        LinkedIn ($15 LinkedIn / $10 Google) where thought
                                        leadership resonates in-feed. LP9 should lean LinkedIn ($15
                                        LinkedIn / $10 Google) where identity messaging drives
                                        engagement. This allocation plays to each page&apos;s
                                        channel strength.
                                    </p>
                                </div>
                            </div>
                        </FadeIn>

                        {/* Key Risk */}
                        <FadeIn delay={240}>
                            <div className="rounded-xl bg-white/[0.02] border border-amber-400/10 overflow-hidden h-full">
                                <div className="px-6 py-4 border-b border-amber-400/10 bg-amber-500/[0.03]">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                                        <AlertTriangle size={14} className="text-amber-400" />
                                        Key Risk
                                    </div>
                                </div>
                                <div className="px-6 py-5">
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        The ceiling is higher but so is the complexity. With Round
                                        1, the pages had deliberately different conversion
                                        mechanics, which meant results were partly about execution
                                        quality. Round 2 equalizes execution, so results will be
                                        a purer signal about messaging preference &mdash; but that
                                        also means smaller differences in performance. Be prepared
                                        for tighter results that may need a larger budget to reach
                                        statistical significance. If Round 1&apos;s $25/page
                                        produced directional signals, Round 2 may need
                                        $50&ndash;100/page for the same clarity.
                                    </p>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>
        </div>
    );
}
