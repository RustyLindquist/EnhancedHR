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
} from 'lucide-react';
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
                id: '1',
                url: '/lp/1',
                heroHeadline: 'One Platform for HR Capability at Scale',
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
                rationale: [
                    'LinkedIn primary text leads with the buyer\u2019s context (faster decisions, cleaner execution) before listing platform capabilities.',
                    'Google headlines are broad and category-defining to capture intent-driven searches for HR learning platforms.',
                    'Designed for searchers who already know they need a platform and are comparing options.',
                ],
            },
            {
                id: '4',
                url: '/lp/4',
                heroHeadline: 'Learn Faster. Know More. Stay Certified.',
                linkedin: {
                    headline: 'The AI-Native Knowledge Platform Built for HR Teams',
                    introductoryText:
                        '5 scoped AI agents. Expert-led courses. SHRM/HRCI credits. One platform built for how HR actually works. Try it free for 7 days.',
                    description:
                        'AI tutors, course assistants, collections, and org tools. SHRM approved. Start your free trial.',
                    cta: 'Learn More',
                },
                google: {
                    headlines: [
                        'AI-Native Platform for HR',
                        '5 AI Agents. SHRM Approved.',
                        'HR Learning, Reimagined',
                    ],
                    descriptions: [
                        '5 scoped AI agents, expert-led courses, and SHRM/HRCI credits. 7-day free trial.',
                        'Collections, AI tutors, and org tools in one platform. SHRM approved. Try free.',
                    ],
                    path: 'enhancedhr.ai/lp/4',
                },
                rationale: [
                    'Ads lead with tangible specifics (5 AI agents, SHRM/HRCI credits) to attract intent-driven searchers looking for HR learning platforms.',
                    'Google headlines front-load "AI-Native" and "SHRM Approved" since these are the highest-signal terms for the target buyer.',
                    'LinkedIn copy leans into the breadth of the platform to appeal to leaders evaluating tools for their teams.',
                    'Hero headline resolves the ad promise into outcomes ("Learn Faster. Know More. Stay Certified.") while a pre-headline badge immediately reinforces ad specifics ("5 AI Agents \u00b7 SHRM & HRCI Approved").',
                ],
            },
        ],
    },
    {
        id: '2',
        label: 'Challenger Narrative',
        pages: [
            {
                id: '2',
                url: '/lp/2',
                heroHeadline: 'AI Is Table Stakes. Decision Velocity Is the Advantage.',
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
                rationale: [
                    'LinkedIn primary text builds the challenger argument step-by-step before introducing the solution.',
                    'Google headlines use the "decision velocity" framing and the operational language of the 14-day pilot.',
                    'Designed for HR leaders who think in terms of organizational capability, not just tool adoption.',
                ],
            },
            {
                id: '5',
                url: '/lp/5',
                heroHeadline: 'AI Won\u2019t Save You. Your People Will.',
                linkedin: {
                    headline: 'AI Is Table Stakes. Decision Velocity Is the Real Moat.',
                    introductoryText:
                        'When every org has AI, speed alone won\u2019t differentiate you. The winners will be the ones whose people find truth and act on it fastest.',
                    description:
                        'Scoped AI agents turn scattered knowledge into decision-grade context. 7-day free trial.',
                    cta: 'Learn More',
                },
                google: {
                    headlines: [
                        'AI Is a Commodity. Now What?',
                        'Your People Are the Moat',
                        'Boost Decision Velocity',
                    ],
                    descriptions: [
                        '47% of workers can\u2019t find what they need. Fix knowledge fragmentation. 7-day free trial.',
                        'AI alone won\u2019t differentiate you. Decision velocity will. See how. Try free for 7 days.',
                    ],
                    path: 'enhancedhr.ai/lp/5',
                },
                rationale: [
                    'Ads use the provocative reframe from the challenger narrative: AI is a commodity, people are the differentiator.',
                    'Google description D1 uses the Gartner stat (47% of workers struggle to find information) as a pattern interrupt in search results.',
                    'LinkedIn copy speaks directly to the strategic HR leader who thinks beyond tool adoption to organizational capability.',
                ],
            },
        ],
    },
    {
        id: '3',
        label: 'Creative / Identity-First',
        pages: [
            {
                id: '3',
                url: '/lp/3',
                heroHeadline: 'Build the Capability Operating System Your Org Lacks',
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
                rationale: [
                    'LinkedIn primary text uses the "content vs. operating system" distinction to earn attention.',
                    'Google headlines lead with action verbs ("Build", "Turn", "Operationalize") to signal capability-building.',
                    'Designed for the leader who resonates with systems thinking over feature lists.',
                ],
            },
            {
                id: '6',
                url: '/lp/6',
                heroHeadline: 'You carry the weight of every person in your organization.',
                linkedin: {
                    headline: 'Your Role Is Evolving. Your Platform Should Too.',
                    introductoryText:
                        'HR is no longer about resources. It\u2019s about relevance. A platform built for the leaders guiding their people through the biggest shift in work history.',
                    description:
                        '5 AI agents, expert courses, and SHRM/HRCI credits. Built for modern HR leaders. Try free.',
                    cta: 'Learn More',
                },
                google: {
                    headlines: [
                        'From HR to Human Relevance',
                        'Lead the AI Transformation',
                        'HR Leaders Deserve Better',
                    ],
                    descriptions: [
                        'AI is transforming your workforce. Lead the change with 5 scoped AI agents. Try free.',
                        'Built for the HR leader navigating AI-era complexity. SHRM approved. 7-day free trial.',
                    ],
                    path: 'enhancedhr.ai/lp/6',
                },
                rationale: [
                    'Ads center the buyer\u2019s identity and the "Human Resources to Human Relevance" reframe.',
                    'Google headlines lead with the transformation narrative to resonate emotionally with HR leaders who feel the pressure of AI disruption.',
                    'LinkedIn copy mirrors the empathy-first tone of the landing page, validating the buyer\u2019s situation before introducing the platform.',
                ],
            },
        ],
    },
];

const generalNotes = [
    'All ads include the 7-day free trial offer to reduce friction.',
    'SHRM and HRCI are referenced by name (not generically as "certifications") for credibility and search relevance.',
    'No exclamation marks or ALL CAPS used outside of brand names.',
    'Character counts verified for each variant.',
];

/* ─── Scoring Data ─── */

const scores: LandingPageScore[] = [
    {
        pageId: '1',
        lpScores: [
            { criterion: 'Speed-to-Value Clarity', weight: 25, score: 4 },
            { criterion: 'CTA Architecture', weight: 20, score: 2 },
            { criterion: 'Persona Specificity', weight: 15, score: 4 },
            { criterion: 'Proof & Credibility', weight: 15, score: 3 },
            { criterion: 'Cognitive Load vs. Length', weight: 15, score: 4 },
            { criterion: 'Differentiation', weight: 10, score: 3 },
        ],
        lpWeighted: 3.35,
        adScores: [
            {
                platform: 'LinkedIn',
                scores: [
                    { criterion: 'Pattern Interrupt', weight: 20, score: 2 },
                    { criterion: 'Message-Match', weight: 20, score: 5 },
                    { criterion: 'Value Prop Specificity', weight: 15, score: 4 },
                    { criterion: 'CTA & Friction Reduction', weight: 15, score: 2 },
                    { criterion: 'Platform Optimization', weight: 15, score: 3 },
                    { criterion: 'Qualified Click Targeting', weight: 15, score: 3 },
                ],
                weighted: 3.20,
            },
            {
                platform: 'Google',
                scores: [
                    { criterion: 'Pattern Interrupt', weight: 20, score: 2 },
                    { criterion: 'Message-Match', weight: 20, score: 4 },
                    { criterion: 'Value Prop Specificity', weight: 15, score: 3 },
                    { criterion: 'CTA & Friction Reduction', weight: 15, score: 3 },
                    { criterion: 'Platform Optimization', weight: 15, score: 3 },
                    { criterion: 'Qualified Click Targeting', weight: 15, score: 4 },
                ],
                weighted: 3.15,
            },
        ],
        combined: 3.26,
        rank: 5,
        expertAssessment:
            'LP1 is a solid, clear page that tells you exactly what the product does. Its weakness is conversion mechanics \u2014 only two CTA placements, no TrustBar, and no trial terms near the buttons. The ads are competent but forgettable. Google H3 ("Built for 100-1000 Employee Teams") is the best qualifying headline in the entire set \u2014 consider incorporating that level of specificity into ads for LP4.',
    },
    {
        pageId: '2',
        lpScores: [
            { criterion: 'Speed-to-Value Clarity', weight: 25, score: 3 },
            { criterion: 'CTA Architecture', weight: 20, score: 2 },
            { criterion: 'Persona Specificity', weight: 15, score: 4 },
            { criterion: 'Proof & Credibility', weight: 15, score: 3 },
            { criterion: 'Cognitive Load vs. Length', weight: 15, score: 4 },
            { criterion: 'Differentiation', weight: 10, score: 5 },
        ],
        lpWeighted: 3.30,
        adScores: [
            {
                platform: 'LinkedIn',
                scores: [
                    { criterion: 'Pattern Interrupt', weight: 20, score: 4 },
                    { criterion: 'Message-Match', weight: 20, score: 5 },
                    { criterion: 'Value Prop Specificity', weight: 15, score: 2 },
                    { criterion: 'CTA & Friction Reduction', weight: 15, score: 1 },
                    { criterion: 'Platform Optimization', weight: 15, score: 4 },
                    { criterion: 'Qualified Click Targeting', weight: 15, score: 4 },
                ],
                weighted: 3.45,
            },
            {
                platform: 'Google',
                scores: [
                    { criterion: 'Pattern Interrupt', weight: 20, score: 3 },
                    { criterion: 'Message-Match', weight: 20, score: 4 },
                    { criterion: 'Value Prop Specificity', weight: 15, score: 2 },
                    { criterion: 'CTA & Friction Reduction', weight: 15, score: 2 },
                    { criterion: 'Platform Optimization', weight: 15, score: 3 },
                    { criterion: 'Qualified Click Targeting', weight: 15, score: 5 },
                ],
                weighted: 3.20,
            },
        ],
        combined: 3.31,
        rank: 4,
        expertAssessment:
            'LP2 has the strongest differentiation story of any page \u2014 the challenger framing is intellectually compelling. But compelling arguments don\u2019t convert without conversion mechanics. The ads are thought-provoking but lack specifics and friction reducers. The "14-day pilot" framing sounds like work, not a trial. LP5 took the same challenger thesis and paired it with better ads. If LP5 wins in testing, LP2\u2019s narrative ideas should be harvested into LP5\u2019s stronger execution.',
    },
    {
        pageId: '3',
        lpScores: [
            { criterion: 'Speed-to-Value Clarity', weight: 25, score: 2 },
            { criterion: 'CTA Architecture', weight: 20, score: 2 },
            { criterion: 'Persona Specificity', weight: 15, score: 3 },
            { criterion: 'Proof & Credibility', weight: 15, score: 2 },
            { criterion: 'Cognitive Load vs. Length', weight: 15, score: 2 },
            { criterion: 'Differentiation', weight: 10, score: 4 },
        ],
        lpWeighted: 2.35,
        adScores: [
            {
                platform: 'LinkedIn',
                scores: [
                    { criterion: 'Pattern Interrupt', weight: 20, score: 3 },
                    { criterion: 'Message-Match', weight: 20, score: 5 },
                    { criterion: 'Value Prop Specificity', weight: 15, score: 2 },
                    { criterion: 'CTA & Friction Reduction', weight: 15, score: 1 },
                    { criterion: 'Platform Optimization', weight: 15, score: 3 },
                    { criterion: 'Qualified Click Targeting', weight: 15, score: 2 },
                ],
                weighted: 2.80,
            },
            {
                platform: 'Google',
                scores: [
                    { criterion: 'Pattern Interrupt', weight: 20, score: 2 },
                    { criterion: 'Message-Match', weight: 20, score: 4 },
                    { criterion: 'Value Prop Specificity', weight: 15, score: 1 },
                    { criterion: 'CTA & Friction Reduction', weight: 15, score: 3 },
                    { criterion: 'Platform Optimization', weight: 15, score: 2 },
                    { criterion: 'Qualified Click Targeting', weight: 15, score: 2 },
                ],
                weighted: 2.40,
            },
        ],
        combined: 2.48,
        rank: 6,
        expertAssessment:
            'LP3 is the most intellectually ambitious page but the worst conversion candidate. "Capability Operating System" and "Mission Rooms" require the visitor to learn a new vocabulary before understanding the product. The ads inherit this abstraction problem \u2014 "Operationalize learning, context, and execution" is the kind of copy that sounds smart in a strategy deck but dies in a LinkedIn feed. The architectural thinking here is valuable for long-form content marketing (blog posts, webinars) but wrong for paid traffic conversion.',
    },
    {
        pageId: '4',
        lpScores: [
            { criterion: 'Speed-to-Value Clarity', weight: 25, score: 5 },
            { criterion: 'CTA Architecture', weight: 20, score: 5 },
            { criterion: 'Persona Specificity', weight: 15, score: 4 },
            { criterion: 'Proof & Credibility', weight: 15, score: 5 },
            { criterion: 'Cognitive Load vs. Length', weight: 15, score: 3 },
            { criterion: 'Differentiation', weight: 10, score: 3 },
        ],
        lpWeighted: 4.35,
        adScores: [
            {
                platform: 'LinkedIn',
                scores: [
                    { criterion: 'Pattern Interrupt', weight: 20, score: 3 },
                    { criterion: 'Message-Match', weight: 20, score: 5 },
                    { criterion: 'Value Prop Specificity', weight: 15, score: 5 },
                    { criterion: 'CTA & Friction Reduction', weight: 15, score: 4 },
                    { criterion: 'Platform Optimization', weight: 15, score: 4 },
                    { criterion: 'Qualified Click Targeting', weight: 15, score: 3 },
                ],
                weighted: 4.0,
            },
            {
                platform: 'Google',
                scores: [
                    { criterion: 'Pattern Interrupt', weight: 20, score: 3 },
                    { criterion: 'Message-Match', weight: 20, score: 5 },
                    { criterion: 'Value Prop Specificity', weight: 15, score: 5 },
                    { criterion: 'CTA & Friction Reduction', weight: 15, score: 4 },
                    { criterion: 'Platform Optimization', weight: 15, score: 5 },
                    { criterion: 'Qualified Click Targeting', weight: 15, score: 3 },
                ],
                weighted: 4.15,
            },
        ],
        combined: 4.21,
        rank: 1,
        expertAssessment:
            'LP4 is the conversion machine of the set. It does everything right mechanically: hero that instantly communicates what you get, multiple CTAs with friction reducers, TrustBar, pricing, mockups. The Google ads are the best-optimized for search intent \u2014 front-loaded keywords, specific features, trial terms. Its weakness is undifferentiation: the page could be any good SaaS product. But for paid traffic, clarity and conversion mechanics beat clever positioning. This should be your highest-confidence bet.',
    },
    {
        pageId: '5',
        lpScores: [
            { criterion: 'Speed-to-Value Clarity', weight: 25, score: 3 },
            { criterion: 'CTA Architecture', weight: 20, score: 4 },
            { criterion: 'Persona Specificity', weight: 15, score: 4 },
            { criterion: 'Proof & Credibility', weight: 15, score: 4 },
            { criterion: 'Cognitive Load vs. Length', weight: 15, score: 2 },
            { criterion: 'Differentiation', weight: 10, score: 5 },
        ],
        lpWeighted: 3.55,
        adScores: [
            {
                platform: 'LinkedIn',
                scores: [
                    { criterion: 'Pattern Interrupt', weight: 20, score: 5 },
                    { criterion: 'Message-Match', weight: 20, score: 4 },
                    { criterion: 'Value Prop Specificity', weight: 15, score: 3 },
                    { criterion: 'CTA & Friction Reduction', weight: 15, score: 3 },
                    { criterion: 'Platform Optimization', weight: 15, score: 5 },
                    { criterion: 'Qualified Click Targeting', weight: 15, score: 4 },
                ],
                weighted: 4.05,
            },
            {
                platform: 'Google',
                scores: [
                    { criterion: 'Pattern Interrupt', weight: 20, score: 5 },
                    { criterion: 'Message-Match', weight: 20, score: 4 },
                    { criterion: 'Value Prop Specificity', weight: 15, score: 4 },
                    { criterion: 'CTA & Friction Reduction', weight: 15, score: 4 },
                    { criterion: 'Platform Optimization', weight: 15, score: 4 },
                    { criterion: 'Qualified Click Targeting', weight: 15, score: 3 },
                ],
                weighted: 4.05,
            },
        ],
        combined: 3.8,
        rank: 2,
        expertAssessment:
            'LP5 has the best ads in the entire set. "AI Is a Commodity. Now What?" is the kind of headline that makes an HR leader stop scrolling. The Gartner statistic ("47% of workers can\u2019t find what they need") provides instant credibility in Google results. The page itself is longer than ideal for paid traffic \u2014 the narrative arc delays the product reveal. But the provocative framing creates enough curiosity that visitors may tolerate the build. Best bet for LinkedIn where the feed rewards thought leadership. If this outperforms LP4, it proves that challenging the buyer\u2019s assumptions is more powerful than listing features.',
    },
    {
        pageId: '6',
        lpScores: [
            { criterion: 'Speed-to-Value Clarity', weight: 25, score: 2 },
            { criterion: 'CTA Architecture', weight: 20, score: 5 },
            { criterion: 'Persona Specificity', weight: 15, score: 5 },
            { criterion: 'Proof & Credibility', weight: 15, score: 4 },
            { criterion: 'Cognitive Load vs. Length', weight: 15, score: 2 },
            { criterion: 'Differentiation', weight: 10, score: 4 },
        ],
        lpWeighted: 3.55,
        adScores: [
            {
                platform: 'LinkedIn',
                scores: [
                    { criterion: 'Pattern Interrupt', weight: 20, score: 3 },
                    { criterion: 'Message-Match', weight: 20, score: 4 },
                    { criterion: 'Value Prop Specificity', weight: 15, score: 4 },
                    { criterion: 'CTA & Friction Reduction', weight: 15, score: 3 },
                    { criterion: 'Platform Optimization', weight: 15, score: 4 },
                    { criterion: 'Qualified Click Targeting', weight: 15, score: 4 },
                ],
                weighted: 3.65,
            },
            {
                platform: 'Google',
                scores: [
                    { criterion: 'Pattern Interrupt', weight: 20, score: 3 },
                    { criterion: 'Message-Match', weight: 20, score: 3 },
                    { criterion: 'Value Prop Specificity', weight: 15, score: 4 },
                    { criterion: 'CTA & Friction Reduction', weight: 15, score: 4 },
                    { criterion: 'Platform Optimization', weight: 15, score: 3 },
                    { criterion: 'Qualified Click Targeting', weight: 15, score: 3 },
                ],
                weighted: 3.3,
            },
        ],
        combined: 3.51,
        rank: 3,
        expertAssessment:
            'LP6 is the emotional wildcard. It scores highest on persona specificity because it directly validates the invisible weight HR leaders carry \u2014 a message no competitor is sending. The CTA architecture is excellent (strong mechanics despite the emotional approach). But the hero tells the visitor nothing about the product \u2014 it\u2019s pure identity validation. This is a high-risk, high-reward play: if the target audience is emotionally exhausted (likely), this page could dramatically outperform expectations. If they\u2019re in analytical buying mode, it will underperform. Google ads are the weakest link \u2014 "From HR to Human Relevance" is not a search query. Worth testing specifically on LinkedIn where identity-resonance drives engagement.',
    },
];

const top3 = [
    {
        rank: 1,
        pageId: '4',
        headline: 'Learn Faster. Know More. Stay Certified.',
        category: 'Features & Value',
        combined: 4.21,
        url: '/lp/4',
        why: 'Strongest conversion mechanics. Maximum proof density (mockups, pricing, SHRM badges, TrustBar). Ads are specific and friction-reducing. Best for Google Search where intent-driven buyers compare options.',
    },
    {
        rank: 2,
        pageId: '5',
        headline: 'AI Won\u2019t Save You. Your People Will.',
        category: 'Challenger Narrative',
        combined: 3.8,
        url: '/lp/5',
        why: 'Best ad copy in the set \u2014 highest scroll-stopping power on both platforms. Strong differentiation backed by third-party statistics (Gartner, Atlassian). Best for LinkedIn where thought-leadership resonates.',
    },
    {
        rank: 3,
        pageId: '6',
        headline: 'You carry the weight of every person in your organization.',
        category: 'Creative / Identity-First',
        combined: 3.51,
        url: '/lp/6',
        why: 'Deepest persona resonance. HR leaders will feel genuinely seen. Tests whether empathy-first messaging outperforms feature-first or challenger-first. One from each category gives maximum learning value.',
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
    const isTop3 = rank <= 3;
    return (
        <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                isTop3
                    ? 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/30'
                    : 'bg-white/[0.04] text-slate-500 border border-white/[0.08]'
            }`}
        >
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
                                Rank #{scoreData.rank} of 6
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
                    <span className="text-xs font-bold uppercase tracking-wider text-[#4B8BB3]">
                        Landing Page {page.id}
                    </span>
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
                    Message-Match Rationale
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

export default function LandingPageAdSetsPage() {
    return (
        <div className="overflow-hidden">
            {/* ── Hero ── */}
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
                            Three campaign angles, each with two landing page variants and
                            corresponding ad creative for LinkedIn and Google. Scored and ranked
                            by conversion probability.
                        </p>
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
                                            <span
                                                key={page.id}
                                                className="text-xs text-[#78C0F0]"
                                            >
                                                {page.url}
                                            </span>
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
                                <Trophy size={12} /> TOP 3 RECOMMENDATION
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                Launch These Three
                            </h2>
                            <p className="text-slate-400">
                                Ranked by combined landing page + ad copy conversion probability.
                                One from each category for maximum learning value.
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
                                                    LP{item.pageId}
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
                                Strategic Note
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                The top 3 represent one page from each category, creating a natural
                                A/B/C test across messaging strategies (feature-led vs. challenger
                                vs. identity-first). This maximizes what you learn from the initial
                                $75 spend. If LP4 wins, double down on feature-specificity. If LP5
                                wins, the market wants thought leadership. If LP6 wins, emotional
                                resonance is the key.
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
                                Each landing page and ad set is scored on a 1&ndash;5 scale across
                                weighted criteria. Scores are combined into a single composite to
                                enable ranking.
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
                                        Two landing pages with matched ad creative
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
                        {/* Portfolio Assessment */}
                        <FadeIn delay={60}>
                            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden h-full">
                                <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.01]">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                                        <Star size={14} className="text-emerald-400" />
                                        Portfolio Assessment
                                    </div>
                                </div>
                                <div className="px-6 py-5">
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        This is a well-structured test portfolio. The three
                                        categories (Features &amp; Value, Challenger Narrative,
                                        Creative/Identity) represent the three fundamental
                                        approaches to B2B SaaS conversion: tell them what you have,
                                        tell them what&apos;s wrong with what they have, and tell
                                        them you understand who they are. Each pair within a
                                        category shows meaningful variation &mdash; LP1 vs LP4
                                        demonstrates how conversion mechanics (CTAs, proof, mockups)
                                        transform the same features-first message from adequate to
                                        excellent.
                                    </p>
                                </div>
                            </div>
                        </FadeIn>

                        {/* What This Test Will Reveal */}
                        <FadeIn delay={120}>
                            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden h-full">
                                <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.01]">
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                                        <TrendingUp size={14} className="text-emerald-400" />
                                        What This Test Will Reveal
                                    </div>
                                </div>
                                <div className="px-6 py-5">
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        Running LP4, LP5, and LP6 simultaneously answers the most
                                        important strategic question: does this market respond
                                        better to features, intellectual challenge, or emotional
                                        validation? The answer determines not just which ads to
                                        scale, but how to position the entire brand. If LP4 wins,
                                        your marketing should be product-led. If LP5 wins, invest in
                                        thought leadership content. If LP6 wins, your brand voice
                                        should center empathy and identity.
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
                                        Budget Allocation Recommendation
                                    </div>
                                </div>
                                <div className="px-6 py-5">
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        With $25 per ad, split between LinkedIn and Google for each
                                        of the top 3. Consider allocating $15 to LinkedIn and $10 to
                                        Google for LP5 and LP6 (where the messaging is more suited
                                        to social than search), and $10 to LinkedIn and $15 to
                                        Google for LP4 (where the specific, feature-rich ads are
                                        optimized for search intent).
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
                                        The biggest risk is insufficient data from $25 budgets. At
                                        $5&ndash;15 per LinkedIn click, you may get only 2&ndash;5
                                        clicks per ad. This is enough to gauge initial CTR (which
                                        reveals ad quality) but not enough for statistically
                                        significant conversion rate comparisons. Treat the first
                                        round as a directional signal, not a definitive answer.
                                        Double down on the top performer in round two with
                                        $50&ndash;100 to validate.
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
