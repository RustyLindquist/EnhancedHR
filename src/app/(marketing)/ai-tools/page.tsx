import React from 'react';
import Link from 'next/link';
import {
    ArrowRight, Wrench, Target, Brain, TrendingUp, Check,
    Sparkles, MessageSquare, Users, Shield, BarChart3, Zap,
    AlertTriangle, BookOpen, Swords
} from 'lucide-react';
import FadeIn from '@/components/marketing/FadeIn';

export default function ToolsPage() {
    return (
        <div className="overflow-hidden">

            {/* HERO */}
            <section className="relative py-24 md:py-32">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[20%] right-[20%] w-[400px] h-[400px] bg-[#FF2600]/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-[10%] w-[500px] h-[500px] bg-[#4B8BB3]/8 rounded-full blur-[100px]" />
                </div>
                <div className="max-w-7xl mx-auto px-6 relative">
                    <FadeIn className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF2600]/10 border border-[#FF2600]/20 text-xs font-medium text-[#FF2600] tracking-wide mb-6">
                            <Wrench size={12} /> AI TOOLS
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8">
                            AI Tools Built
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9300] to-[#FF2600]">for HR</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed">
                            Purpose-built AI tools designed for the challenges HR professionals and leaders face every day. A growing inventory that keeps expanding.
                        </p>
                    </FadeIn>
                </div>
            </section>

            {/* ROLE DISRUPTION FORECASTING */}
            <section className="py-24 bg-[#0B1120]/40 border-t border-white/[0.04]">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9300]/10 border border-[#FF9300]/20 text-xs font-medium text-[#FF9300] tracking-wide mb-6">
                                <TrendingUp size={12} /> FORECASTING
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                                Role Disruption
                                <br />
                                Forecasting
                            </h2>
                            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                                Understand how AI and automation will impact specific roles in your organization. Get actionable intelligence to future-proof your workforce before disruption hits.
                            </p>
                        </FadeIn>
                        <FadeIn delay={150}>
                            <ul className="space-y-4">
                                {[
                                    'Disruption risk scoring for any role',
                                    'Timeline forecasts for automation impact',
                                    'Actionable reskilling recommendations',
                                    'Role-specific mitigation strategies',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                                        <Check size={14} className="text-[#FF9300] flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </FadeIn>
                    </div>

                    {/* Mockup */}
                    <FadeIn direction="left" delay={200}>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-[#FF9300]/8 rounded-3xl blur-[50px] -z-10" />
                            <div className="bg-[#0A0D12] border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
                                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/[0.06]">
                                    <TrendingUp size={16} className="text-[#FF9300]" />
                                    <span className="text-sm font-bold text-white">Role Analysis: HR Coordinator</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">Disruption Risk</span>
                                        <span className="text-sm font-bold text-[#FF9300]">Medium-High</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                        <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-[#FF9300] to-[#FF2600]" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                                            <div className="text-[10px] text-slate-600 mb-1">Timeline</div>
                                            <div className="text-sm font-bold text-white">2-4 years</div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                                            <div className="text-[10px] text-slate-600 mb-1">Tasks at Risk</div>
                                            <div className="text-sm font-bold text-white">63%</div>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-[#4B8BB3]/5 border border-[#4B8BB3]/15 mt-2">
                                        <div className="text-[10px] font-bold text-[#4B8BB3] mb-1">Recommended Reskilling</div>
                                        <div className="text-[11px] text-slate-400">Shift toward strategic HR advisory, employee experience design, and AI-augmented talent analytics.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ROLEPLAY DOJO */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Mockup */}
                    <FadeIn direction="right" className="order-2 lg:order-1">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-[#FF2600]/8 rounded-3xl blur-[50px] -z-10" />
                            <div className="bg-[#0A0D12] border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
                                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/[0.06]">
                                    <Swords size={16} className="text-[#FF2600]" />
                                    <span className="text-sm font-bold text-white">RolePlay Dojo</span>
                                    <span className="ml-auto text-[10px] text-slate-600">Performance Discussion</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.04]">
                                        <div className="text-[10px] text-[#FF2600] font-bold mb-1">AI as: Senior Engineer (Defensive)</div>
                                        <p className="text-[11px] text-slate-300">&quot;I&apos;ve been on this team for 5 years and my code quality metrics are fine. I don&apos;t understand why you&apos;re bringing this up now.&quot;</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 ml-4">
                                        <div className="text-[10px] text-[#4B8BB3] font-bold mb-1">You (Manager)</div>
                                        <p className="text-[11px] text-white">&quot;I appreciate your tenure and technical skills. This isn&apos;t about code quality — it&apos;s about how we collaborate as a team...&quot;</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-[#FF9300]/5 border border-[#FF9300]/15">
                                        <div className="flex items-center gap-1 mb-1">
                                            <Sparkles size={10} className="text-[#FF9300]" />
                                            <span className="text-[10px] font-bold text-[#FF9300]">Coach Feedback</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">Strong opening — you acknowledged their value before the redirect. Try using a specific example next to ground the conversation.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    <div className="order-1 lg:order-2">
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF2600]/10 border border-[#FF2600]/20 text-xs font-medium text-[#FF2600] tracking-wide mb-6">
                                <Swords size={12} /> PRACTICE
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                                The RolePlay
                                <br />
                                Dojo
                            </h2>
                            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                                Practice the conversations that matter most before they happen. An AI trained to play the other side — complete with coaching feedback to sharpen your approach.
                            </p>
                        </FadeIn>
                        <FadeIn delay={150}>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    'Termination conversations',
                                    'Performance reviews',
                                    'Conflict resolution',
                                    'Salary negotiations',
                                    'Delivering tough feedback',
                                    'Role-reversal perspective',
                                ].map((scenario, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                        <Check size={14} className="text-[#FF2600] flex-shrink-0" />
                                        {scenario}
                                    </div>
                                ))}
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* SKILLS GAP + MORE */}
            <section className="py-24 bg-[#0B1120]/40 border-t border-white/[0.04]">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">And Growing</h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Our AI tools inventory is constantly expanding. Each tool is designed for a specific HR challenge.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            { icon: <BarChart3 size={22} />, title: 'Skills Gap Analysis', desc: 'Identify capability gaps across your team. AI-powered analysis with recommendations that connect directly to Academy courses.', color: '#4B8BB3' },
                            { icon: <AlertTriangle size={22} />, title: 'Workforce Planning', desc: 'Scenario modeling for organizational changes. Understand the people impact before you make the decision.', color: '#FF9300', coming: true },
                            { icon: <Brain size={22} />, title: 'AI Readiness Assessment', desc: 'Evaluate your organization\'s readiness for AI adoption across teams, processes, and culture.', color: '#78C0F0', coming: true },
                        ].map((tool, i) => (
                            <FadeIn key={i} delay={i * 100}>
                                <div className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full relative">
                                    {tool.coming && (
                                        <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-white/[0.06] text-[10px] font-medium text-slate-500">Coming Soon</span>
                                    )}
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: `${tool.color}15`, color: tool.color }}>
                                        {tool.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-3">{tool.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{tool.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <FadeIn>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            Try Every Tool Free
                        </h2>
                        <p className="text-lg text-slate-400 mb-10">
                            All AI tools are included with every plan. Start your 7-day free trial.
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
