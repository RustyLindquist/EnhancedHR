
import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Users, Zap, Shield, Star, PlayCircle, Globe, Award } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function MarketingHomePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="overflow-hidden">

            {/* --- HERO SECTION --- */}
            <section className="relative min-h-[90vh] flex items-center justify-center pt-20">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-blue-light/10 rounded-full blur-[120px] opacity-50 animate-pulse-slow"></div>
                    <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-brand-blue/10 rounded-full blur-[100px] opacity-30"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse"></span>
                        <span className="text-sm font-medium text-slate-300">The Future of HR Learning is Here</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight mb-8 leading-tight">
                        Human <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue-light to-white">Relevance</span>
                        <br />
                        in the Age of AI.
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
                        EnhancedHR is the world-class learning platform designed to help HR professionals and leaders master the skills they need to stay relevant, lead with confidence, and drive organizational success.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                        <Link
                            href={user ? "/dashboard" : "/login?view=signup"}
                            className="px-8 py-4 rounded-full bg-brand-blue-light text-brand-black font-bold text-lg hover:bg-white transition-all shadow-[0_0_30px_rgba(120,192,240,0.4)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] hover:-translate-y-1 flex items-center gap-2"
                        >
                            {user ? "Go to Dashboard" : "Start Learning Now"} <ArrowRight size={20} />
                        </Link>
                        <Link
                            href="/features"
                            className="px-8 py-4 rounded-full bg-white/5 text-white font-bold text-lg border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-1"
                        >
                            Explore Features
                        </Link>
                    </div>

                    {/* Hero Visual / Dashboard Preview */}
                    <div className="mt-20 relative mx-auto max-w-5xl perspective-container">
                        <div className="relative rounded-xl border border-white/10 bg-[#0f172a]/80 backdrop-blur-xl shadow-2xl overflow-hidden transform rotate-x-12 hover:rotate-x-0 transition-transform duration-1000 ease-out group">
                            {/* Mock UI Header */}
                            <div className="h-12 border-b border-white/10 bg-white/5 flex items-center px-4 gap-2">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                                </div>
                                <div className="ml-4 w-64 h-6 rounded-full bg-white/5"></div>
                            </div>
                            {/* Mock UI Body */}
                            <div className="p-8 grid grid-cols-3 gap-6 h-[400px]">
                                <div className="col-span-2 space-y-4">
                                    <div className="h-48 rounded-lg bg-gradient-to-br from-brand-blue/20 to-brand-blue-light/5 border border-white/5 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
                                        <div className="absolute bottom-4 left-4">
                                            <div className="px-3 py-1 rounded-full bg-brand-orange text-white text-xs font-bold mb-2 w-max">NEW COURSE</div>
                                            <div className="text-xl font-bold text-white">AI for People Operations</div>
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                            <PlayCircle size={48} className="text-white drop-shadow-lg" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="h-32 rounded-lg bg-white/5 border border-white/5"></div>
                                        <div className="h-32 rounded-lg bg-white/5 border border-white/5"></div>
                                    </div>
                                </div>
                                <div className="col-span-1 space-y-4">
                                    <div className="h-full rounded-lg bg-white/5 border border-white/5 p-4">
                                        <div className="flex items-center gap-2 mb-4 text-brand-blue-light">
                                            <Zap size={16} /> <span className="text-xs font-bold uppercase">AI Assistant</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="w-full h-2 bg-white/10 rounded-full"></div>
                                            <div className="w-2/3 h-2 bg-white/10 rounded-full"></div>
                                            <div className="w-5/6 h-2 bg-white/10 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Glow behind dashboard */}
                        <div className="absolute -inset-10 bg-brand-blue-light/20 blur-[100px] -z-10"></div>
                    </div>
                </div>
            </section>

            {/* --- SECTION 1: THE AI ADVANTAGE --- */}
            <section className="py-32 bg-[#05080a] relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue-light/10 text-brand-blue-light text-xs font-bold uppercase tracking-wider mb-6">
                                <Zap size={14} /> The Secret Sauce
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                                Don't just watch. <br />
                                <span className="text-brand-blue-light">Practice.</span>
                            </h2>
                            <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                                Static video courses are dead. You need a partner. EnhancedHR pairs every expert-led course with a <strong>Dual-Layer AI</strong> system.
                            </p>

                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-brand-blue/20 flex items-center justify-center text-brand-blue-light flex-shrink-0">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">The Course Tutor</h3>
                                        <p className="text-slate-400">
                                            A proactive coach that knows your role and industry. It doesn't just answer; it challenges you with Socratic role-play scenarios to ensure you can apply what you learn.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-brand-orange/20 flex items-center justify-center text-brand-orange flex-shrink-0">
                                        <Zap size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">The Course Assistant</h3>
                                        <p className="text-slate-400">
                                            Your instant librarian. Ask "What did the instructor say about conflict resolution?" and get an immediate, cited answer from the transcript.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visual: AI Chat Interface Mockup */}
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-brand-blue to-purple-500 rounded-full blur-[80px] opacity-20"></div>
                            <div className="relative bg-[#0A0D12] border border-white/10 rounded-2xl p-6 shadow-2xl">
                                <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                                    <div className="w-10 h-10 rounded-full bg-brand-blue-light flex items-center justify-center text-brand-black font-bold">AI</div>
                                    <div>
                                        <div className="text-white font-bold">Course Tutor</div>
                                        <div className="text-xs text-brand-blue-light">Proactive Coaching Mode</div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-white/5 rounded-lg p-4 rounded-tl-none border border-white/5">
                                        <p className="text-slate-300 text-sm">
                                            "I see you're a Director of People Ops. Before we move on, how would you handle a situation where a high-performer refuses to adopt this new policy?"
                                        </p>
                                    </div>
                                    <div className="bg-brand-blue-light/10 rounded-lg p-4 rounded-tr-none border border-brand-blue-light/20 ml-auto max-w-[80%]">
                                        <p className="text-white text-sm">
                                            "I'd probably start by having a 1:1 to understand their resistance..."
                                        </p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 rounded-tl-none border border-white/5">
                                        <p className="text-slate-300 text-sm">
                                            "Excellent start. Now, let's refine that using the 'Empathy First' framework we just discussed in Module 2..."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECTION 2: THE LIQUID INTERFACE --- */}
            <section className="py-32 bg-[#0A0D12] relative">
                <div className="max-w-7xl mx-auto px-6 text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        A Learning Experience <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">You'll Actually Enjoy.</span>
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        We ditched the clunky LMS for a "Liquid Interface" designed for flow. Beautiful card stacks, intuitive collections, and a design that respects your taste.
                    </p>
                </div>

                {/* Visual: Card Stacks */}
                <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: "Liquid Cards", desc: "Content lives in beautiful, glass-morphism cards that stack to show depth.", icon: <Star size={24} /> },
                        { title: "Collection Portals", desc: "Organize content into Favorites, Research, or Custom Collections with a drag-and-drop 'portal' interface.", icon: <Globe size={24} /> },
                        { title: "Dopamine Design", desc: "Subtle animations and micro-interactions make every click feel rewarding.", icon: <Award size={24} /> }
                    ].map((item, i) => (
                        <div key={i} className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group text-center">
                            <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform border border-white/10">
                                {item.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                            <p className="text-slate-400">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- SECTION 3: AUTOMATED RECERTIFICATION --- */}
            <section className="py-32 bg-[#05080a] relative border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    {/* Visual: Certificate */}
                    <div className="relative order-2 lg:order-1">
                        <div className="absolute -inset-4 bg-brand-orange/20 rounded-full blur-[80px]"></div>
                        <div className="relative bg-white text-black rounded-xl p-8 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                            <div className="border-4 border-double border-slate-200 h-full p-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 mb-4 text-brand-orange">
                                    <Award size={64} />
                                </div>
                                <h3 className="font-serif text-3xl font-bold mb-2">Certificate of Completion</h3>
                                <p className="text-slate-500 mb-6">Awarded to <span className="font-bold text-black">Jane Doe</span></p>
                                <div className="flex gap-4 text-sm font-bold text-slate-600">
                                    <span className="px-3 py-1 bg-slate-100 rounded">1.5 SHRM PDCs</span>
                                    <span className="px-3 py-1 bg-slate-100 rounded">1.5 HRCI Credits</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="order-1 lg:order-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-bold uppercase tracking-wider mb-6">
                            <Check size={14} /> Audit-Proof Tracking
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            Recertification on Autopilot.
                        </h2>
                        <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                            Never manually track a credit again. Our system automatically calculates SHRM PDCs and HRCI credits based on your precise watch time.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-slate-300">
                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500"><Check size={14} /></div>
                                <span>Automatic calculation of PDCs and Credits</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500"><Check size={14} /></div>
                                <span>Instant certificate generation upon completion</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500"><Check size={14} /></div>
                                <span>Audit-proof ledger of your learning history</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* --- PRICING SECTION --- */}
            <section id="pricing" className="py-32 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-brand-blue/5 rounded-full blur-[120px] -z-10"></div>

                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                        {/* Left: Pitch */}
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                Simple, Transparent Pricing for Everyone.
                            </h2>
                            <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                                Whether you're an individual looking to level up, or an organization empowering your entire HR team, we have one simple plan.
                            </p>

                            <div className="space-y-4 mb-8">
                                {[
                                    "Unlimited access to all courses",
                                    "AI Tutor & Course Assistant",
                                    "SHRM & HRCI Credit Tracking",
                                    "New content added monthly",
                                    "Cancel anytime"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 text-slate-300">
                                        <div className="w-6 h-6 rounded-full bg-brand-blue-light/20 flex items-center justify-center text-brand-blue-light">
                                            <Check size={14} />
                                        </div>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Card */}
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-light to-brand-blue rounded-3xl blur opacity-30"></div>
                            <div className="relative bg-[#0f172a] border border-white/10 rounded-3xl p-10 text-center">
                                <div className="inline-block px-4 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-bold uppercase tracking-wider mb-6">
                                    All-Access Pass
                                </div>

                                <div className="flex items-baseline justify-center gap-2 mb-2">
                                    <span className="text-6xl font-bold text-white">$30</span>
                                    <span className="text-slate-400 text-xl">/month</span>
                                </div>
                                <p className="text-slate-500 text-sm mb-8">per user</p>

                                <Link
                                    href="/login?view=signup"
                                    className="block w-full py-4 rounded-xl bg-brand-blue-light text-brand-black font-bold text-lg hover:bg-white transition-all shadow-lg hover:shadow-brand-blue-light/20 mb-6"
                                >
                                    Start Your Free Trial
                                </Link>

                                <p className="text-xs text-slate-500">
                                    7-day free trial. No commitment required.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* --- CTA SECTION --- */}
            <section className="py-32 bg-gradient-to-b from-[#05080a] to-[#0A0D12] border-t border-white/5">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
                        Ready to lead the future of work?
                    </h2>
                    <p className="text-xl text-slate-400 mb-12">
                        Join thousands of HR professionals who are upgrading their skills with EnhancedHR.
                    </p>
                    <Link
                        href={user ? "/dashboard" : "/login?view=signup"}
                        className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-white text-brand-black font-bold text-xl hover:bg-brand-blue-light transition-all shadow-2xl hover:scale-105"
                    >
                        {user ? "Go to Dashboard" : "Get Started Now"} <ArrowRight size={24} />
                    </Link>
                </div>
            </section>

        </div>
    );
}
