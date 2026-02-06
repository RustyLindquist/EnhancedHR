import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Users, Zap, Shield, Star, PlayCircle, Globe, Award, Database, Layout, Lock } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Features — EnhancedHR.ai',
    description: 'Deep dive into the EnhancedHR platform. Expert-led courses, AI assistants, integrity ledger, and comprehensive learning ecosystem.',
};

export default function FeaturesPage() {
    return (
        <div className="overflow-hidden pt-20">

            {/* --- HERO --- */}
            <section className="relative py-20 bg-[#0A0D12]">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                        Platform <span className="text-brand-blue-light">Deep Dive</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                        EnhancedHR isn't just a video player. It's a comprehensive learning ecosystem built for the modern enterprise. Here's exactly how it works.
                    </p>
                </div>
            </section>

            {/* --- FEATURE 1: AI ARCHITECTURE --- */}
            <section className="py-20 bg-[#05080a] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold uppercase tracking-wider mb-6">
                            <Zap size={14} /> The Brain
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                            Dual-Layer AI Architecture.
                        </h2>
                        <p className="text-lg text-slate-400 mb-6">
                            We use a sophisticated RAG (Retrieval-Augmented Generation) system to ensure accuracy and relevance.
                        </p>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white flex-shrink-0 border border-white/10">1</div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">Course Assistant (Reactive)</h4>
                                    <p className="text-slate-400 text-sm">Restricted to the specific course transcript. It acts as a librarian, finding exact quotes and timestamps.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white flex-shrink-0 border border-white/10">2</div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">Platform Assistant (Global)</h4>
                                    <p className="text-slate-400 text-sm">Has access to the entire library. It can connect dots between courses, suggesting a Leadership module to help with a Conflict Resolution problem.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                        {/* Abstract Representation of RAG */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between text-slate-500 text-xs uppercase tracking-widest font-bold">
                                <span>User Query</span>
                                <span>Vector DB</span>
                                <span>Response</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-12 flex-1 bg-white/10 rounded-lg animate-pulse"></div>
                                <ArrowRight size={16} className="text-slate-600" />
                                <div className="h-12 w-12 bg-brand-blue/20 rounded-lg border border-brand-blue/50 flex items-center justify-center">
                                    <Database size={20} className="text-brand-blue-light" />
                                </div>
                                <ArrowRight size={16} className="text-slate-600" />
                                <div className="h-12 flex-1 bg-brand-blue-light/10 rounded-lg border border-brand-blue-light/20"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FEATURE 2: CREDIT MATH --- */}
            <section className="py-20 bg-[#0A0D12] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1 bg-white/5 rounded-2xl p-8 border border-white/10">
                        <div className="space-y-4 font-mono text-sm text-slate-300">
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span>Session A</span>
                                <span>15 mins</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span>Session B</span>
                                <span>35 mins</span>
                            </div>
                            <div className="flex justify-between text-white font-bold pt-2">
                                <span>Total Watch Time</span>
                                <span>50 mins</span>
                            </div>
                            <div className="mt-6 p-4 bg-brand-orange/10 rounded-lg border border-brand-orange/20 text-brand-orange">
                                <div className="flex justify-between font-bold">
                                    <span>SHRM PDCs Awarded</span>
                                    <span>0.75</span>
                                </div>
                                <div className="text-xs opacity-70 mt-1">Rounded down to nearest 0.25</div>
                            </div>
                        </div>
                    </div>
                    <div className="order-1 lg:order-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-bold uppercase tracking-wider mb-6">
                            <Award size={14} /> The Math
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                            Precision Credit Tracking.
                        </h2>
                        <p className="text-lg text-slate-400 mb-6">
                            We don't guess. We track every second of video playback to ensure your credits are audit-proof.
                        </p>
                        <ul className="space-y-4 text-slate-400">
                            <li className="flex items-start gap-3">
                                <Check size={18} className="text-brand-orange mt-1" />
                                <span><strong>SHRM:</strong> 60 minutes = 1 PDC. We aggregate all your sessions and round down to the nearest 0.25 PDC.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check size={18} className="text-brand-orange mt-1" />
                                <span><strong>HRCI:</strong> Requires a minimum of 45 minutes to qualify. We handle the complex "Business" vs "General" credit types automatically.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* --- FEATURE 3: ADMIN TOOLS --- */}
            <section className="py-20 bg-[#05080a] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
                            <Shield size={14} /> For Leaders
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                            The Admin Command Center.
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Prove ROI and manage your team with ease.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                            <Layout size={32} className="text-brand-blue-light mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Seat Management</h3>
                            <p className="text-slate-400 text-sm">
                                Add or remove users instantly. We integrate directly with Stripe to pro-rate your billing to the day. You never pay for unused seats.
                            </p>
                        </div>
                        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                            <Database size={32} className="text-brand-blue-light mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">ROI Dashboard</h3>
                            <p className="text-slate-400 text-sm">
                                Track "Upskilling Pulse" and "Certification Health". See exactly how many PDCs your team has earned this quarter.
                            </p>
                        </div>
                        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                            <Lock size={32} className="text-brand-blue-light mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Curated Paths</h3>
                            <p className="text-slate-400 text-sm">
                                Create custom "Learning Paths" for your team (e.g., "New Manager Onboarding") and assign them as required learning.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CTA --- */}
            <section className="py-20 bg-[#0A0D12] border-t border-white/5 text-center">
                <h2 className="text-3xl font-bold text-white mb-8">Ready to see it in action?</h2>
                <Link
                    href="/join"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-brand-blue-light text-brand-black font-bold text-lg hover:bg-white transition-all shadow-lg hover:scale-105"
                >
                    Start Your Free Trial <ArrowRight size={20} />
                </Link>
            </section>

        </div>
    );
}
