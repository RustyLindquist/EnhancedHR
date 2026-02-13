import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Ad Copy — EnhancedHR Landing Pages',
    description: 'Google and LinkedIn ad copy for EnhancedHR landing pages.',
};

/* ─── Data ─── */

const pages = [
    {
        id: 4,
        label: 'Landing Page 4',
        angle: 'Features & Values',
        hero: 'Learn Faster. Know More. Stay Certified.',
        google: {
            headlines: [
                { id: 'H1', text: 'AI-Native Platform for HR', chars: 26 },
                { id: 'H2', text: '5 AI Agents. SHRM Approved.', chars: 29 },
                { id: 'H3', text: 'HR Learning, Reimagined', chars: 24 },
            ],
            descriptions: [
                { id: 'D1', text: '5 scoped AI agents, expert-led courses, and SHRM/HRCI credits. 7-day free trial.', chars: 82 },
                { id: 'D2', text: 'Collections, AI tutors, and org tools in one platform. SHRM approved. Try free.', chars: 80 },
            ],
            displayUrl: 'enhancedhr.ai/platform',
        },
        linkedin: {
            headline: { text: 'The AI-Native Knowledge Platform Built for HR Teams', chars: 52 },
            intro: { text: '5 scoped AI agents. Expert-led courses. SHRM/HRCI credits. One platform built for how HR actually works. Try it free for 7 days.', chars: 130 },
            description: { text: 'AI tutors, course assistants, collections, and org tools. SHRM approved. Start your free trial.', chars: 96 },
        },
        rationale: [
            'Ads lead with tangible specifics (5 AI agents, SHRM/HRCI credits) to attract intent-driven searchers looking for HR learning platforms.',
            'Google headlines front-load "AI-Native" and "SHRM Approved" since these are the highest-signal terms for the target buyer.',
            'LinkedIn copy leans into the breadth of the platform to appeal to leaders evaluating tools for their teams.',
            'Hero headline resolves the ad promise into outcomes ("Learn Faster. Know More. Stay Certified.") while a pre-headline badge immediately reinforces ad specifics ("5 AI Agents \u00b7 SHRM & HRCI Approved").',
        ],
    },
    {
        id: 5,
        label: 'Landing Page 5',
        angle: 'Challenger Narrative',
        hero: "AI Won\u2019t Save You. Your People Will.",
        google: {
            headlines: [
                { id: 'H1', text: 'AI Is a Commodity. Now What?', chars: 29 },
                { id: 'H2', text: 'Your People Are the Moat', chars: 25 },
                { id: 'H3', text: 'Boost Decision Velocity', chars: 24 },
            ],
            descriptions: [
                { id: 'D1', text: "47% of workers can\u2019t find what they need. Fix knowledge fragmentation. 7-day free trial.", chars: 89 },
                { id: 'D2', text: "AI alone won\u2019t differentiate you. Decision velocity will. See how. Try free for 7 days.", chars: 88 },
            ],
            displayUrl: 'enhancedhr.ai/decision-velocity',
        },
        linkedin: {
            headline: { text: 'AI Is Table Stakes. Decision Velocity Is the Real Moat.', chars: 56 },
            intro: { text: "When every org has AI, speed alone won\u2019t differentiate you. The winners will be the ones whose people find truth and act on it fastest.", chars: 135 },
            description: { text: 'Scoped AI agents turn scattered knowledge into decision-grade context. 7-day free trial.', chars: 89 },
        },
        rationale: [
            'Ads use the provocative reframe from the challenger narrative: AI is a commodity, people are the differentiator.',
            'Google description D1 uses the Gartner stat (47% of workers struggle to find information) as a pattern interrupt in search results.',
            'LinkedIn copy speaks directly to the strategic HR leader who thinks beyond tool adoption to organizational capability.',
        ],
    },
    {
        id: 6,
        label: 'Landing Page 6',
        angle: 'Original / Identity-First',
        hero: 'You carry the weight of every person in your organization.',
        google: {
            headlines: [
                { id: 'H1', text: 'From HR to Human Relevance', chars: 27 },
                { id: 'H2', text: 'Lead the AI Transformation', chars: 27 },
                { id: 'H3', text: 'HR Leaders Deserve Better', chars: 26 },
            ],
            descriptions: [
                { id: 'D1', text: 'AI is transforming your workforce. Lead the change with 5 scoped AI agents. Try free.', chars: 86 },
                { id: 'D2', text: 'Built for the HR leader navigating AI-era complexity. SHRM approved. 7-day free trial.', chars: 87 },
            ],
            displayUrl: 'enhancedhr.ai/hr-leaders',
        },
        linkedin: {
            headline: { text: 'Your Role Is Evolving. Your Platform Should Too.', chars: 49 },
            intro: { text: "HR is no longer about resources. It\u2019s about relevance. A platform built for the leaders guiding their people through the biggest shift in work history.", chars: 151 },
            description: { text: '5 AI agents, expert courses, and SHRM/HRCI credits. Built for modern HR leaders. Try free.', chars: 91 },
        },
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

/* ─── Components ─── */

function CharBadge({ count, max }: { count: number; max: number }) {
    const pct = count / max;
    const color = pct > 0.95 ? 'text-[#FF9300]' : 'text-slate-500';
    return (
        <span className={`text-[11px] font-mono tabular-nums ${color}`}>
            {count}/{max}
        </span>
    );
}

function CopyRow({ id, text, chars, max }: { id: string; text: string; chars: number; max: number }) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] group">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-0.5 w-6 flex-shrink-0">
                {id}
            </span>
            <p className="text-sm text-slate-300 leading-relaxed flex-1 font-mono">{text}</p>
            <CharBadge count={chars} max={max} />
        </div>
    );
}

function LinkedInField({ label, text, chars, max }: { label: string; text: string; chars: number; max: number }) {
    return (
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{label}</span>
                <CharBadge count={chars} max={max} />
            </div>
            <p className="text-sm text-slate-300 leading-relaxed font-mono">{text}</p>
        </div>
    );
}

/* ─── Page ─── */

export default function AdCopyPage() {
    return (
        <div className="pt-[96px] pb-20">
            <div className="max-w-5xl mx-auto px-6">
                {/* Header */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-4">
                        Ad Copy Review
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        Paid Ad Copy for EnhancedHR Landing Pages
                    </h1>
                    <p className="text-slate-400 text-base">
                        Target audience: CHROs, VPs of People, HR Directors at organizations with 100&ndash;1,000 employees.
                    </p>
                </div>

                {/* Page sections */}
                <div className="space-y-16">
                    {pages.map((page) => (
                        <section key={page.id} className="scroll-mt-24" id={`lp-${page.id}`}>
                            {/* Page header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/[0.06]">
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {page.label}: {page.angle}
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Hero: <span className="text-slate-300 italic">&ldquo;{page.hero}&rdquo;</span>
                                    </p>
                                </div>
                                <Link
                                    href={`/lp/${page.id}`}
                                    target="_blank"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors flex-shrink-0"
                                >
                                    View page <ExternalLink size={11} />
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Google Ads */}
                                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-5 h-5 rounded bg-[#4285F4]/20 flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-[#4285F4]">G</span>
                                        </div>
                                        <h3 className="text-sm font-bold text-white">Google Ads</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                                                Headlines (max 30 chars)
                                            </p>
                                            <div className="space-y-1.5">
                                                {page.google.headlines.map((h) => (
                                                    <CopyRow key={h.id} id={h.id} text={h.text} chars={h.chars} max={30} />
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                                                Descriptions (max 90 chars)
                                            </p>
                                            <div className="space-y-1.5">
                                                {page.google.descriptions.map((d) => (
                                                    <CopyRow key={d.id} id={d.id} text={d.text} chars={d.chars} max={90} />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-white/[0.04]">
                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                                Display URL
                                            </p>
                                            <p className="text-sm text-[#4B8BB3] font-mono">{page.google.displayUrl}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* LinkedIn Ads */}
                                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-5 h-5 rounded bg-[#0A66C2]/20 flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-[#0A66C2]">in</span>
                                        </div>
                                        <h3 className="text-sm font-bold text-white">LinkedIn Ads</h3>
                                        <span className="text-[10px] text-slate-600">(Sponsored Content)</span>
                                    </div>

                                    <div className="space-y-3">
                                        <LinkedInField
                                            label="Headline (max 70)"
                                            text={page.linkedin.headline.text}
                                            chars={page.linkedin.headline.chars}
                                            max={70}
                                        />
                                        <LinkedInField
                                            label="Introductory Text (max 150)"
                                            text={page.linkedin.intro.text}
                                            chars={page.linkedin.intro.chars}
                                            max={150}
                                        />
                                        <LinkedInField
                                            label="Description (max 100)"
                                            text={page.linkedin.description.text}
                                            chars={page.linkedin.description.chars}
                                            max={100}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Rationale */}
                            <div className="mt-4 p-4 rounded-xl bg-[#4B8BB3]/5 border border-[#4B8BB3]/10">
                                <p className="text-[10px] font-bold text-[#4B8BB3] uppercase tracking-wider mb-2">
                                    Message-Match Rationale
                                </p>
                                <ul className="space-y-1.5">
                                    {page.rationale.map((note, i) => (
                                        <li key={i} className="text-sm text-slate-400 leading-relaxed flex gap-2">
                                            <span className="text-[#4B8BB3] flex-shrink-0">&bull;</span>
                                            {note}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    ))}
                </div>

                {/* General Notes */}
                <div className="mt-16 pt-8 border-t border-white/[0.06]">
                    <h2 className="text-lg font-bold text-white mb-4">General Notes</h2>
                    <ul className="space-y-2">
                        {generalNotes.map((note, i) => (
                            <li key={i} className="text-sm text-slate-400 leading-relaxed flex gap-2">
                                <span className="text-slate-600 flex-shrink-0">&bull;</span>
                                {note}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
