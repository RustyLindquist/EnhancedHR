import { createClient } from '@/lib/supabase/server';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, Users, Shield, Zap, Globe, Menu, X } from 'lucide-react';

export default async function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="min-h-screen bg-[#0A0D12] text-white font-sans selection:bg-brand-blue-light selection:text-brand-black">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-[#0A0D12]/80 backdrop-blur-lg border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <Image
                            src="/images/logos/EnhancedHR-logo.png"
                            alt="EnhancedHR"
                            width={180}
                            height={40}
                            className="w-[180px] h-auto"
                        />
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/instructors" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                            Instructors
                        </Link>
                        <Link href="/#pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                            Pricing
                        </Link>

                        {user ? (
                            <Link
                                href="/dashboard"
                                className="px-5 py-2.5 rounded-full bg-brand-blue-light text-brand-black text-sm font-bold hover:bg-white transition-all shadow-[0_0_20px_rgba(120,192,240,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                            >
                                My Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="text-sm font-medium text-white hover:text-brand-blue-light transition-colors">
                                    Log In
                                </Link>
                                <Link
                                    href="/join"
                                    className="px-5 py-2.5 rounded-full bg-brand-blue-light text-brand-black text-sm font-bold hover:bg-white transition-all shadow-[0_0_20px_rgba(120,192,240,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button (Placeholder) */}
                    <button className="md:hidden text-white">
                        <Menu size={24} />
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-20">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-[#05080a] border-t border-white/5 pt-24 pb-12 mt-20 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-brand-blue/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

                        {/* Brand Column */}
                        <div className="md:col-span-5 space-y-8">
                            <Link href="/" className="block">
                                <Image
                                    src="/images/logos/EnhancedHR-logo-full-vertical.png"
                                    alt="EnhancedHR"
                                    width={200}
                                    height={80}
                                    className="w-[200px] h-auto opacity-90 hover:opacity-100 transition-opacity"
                                />
                            </Link>
                            <p className="text-slate-400 text-lg leading-relaxed max-w-md font-light">
                                Empowering HR professionals with world-class learning and AI-driven insights to shape the future of work.
                            </p>
                        </div>

                        {/* Spacer */}
                        <div className="hidden md:block md:col-span-1"></div>

                        {/* Links Column 1 */}
                        <div className="md:col-span-3">
                            <h4 className="text-white font-bold mb-6 tracking-wide">Platform</h4>
                            <ul className="space-y-4 text-slate-400">
                                <li><Link href="/instructors" className="hover:text-brand-blue-light transition-colors flex items-center gap-2"><ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 transition-all" /> Instructors</Link></li>
                                <li><Link href="/login" className="hover:text-brand-blue-light transition-colors">Login</Link></li>
                                <li><Link href="/#pricing" className="hover:text-brand-blue-light transition-colors">Pricing</Link></li>
                                <li><Link href="/join" className="hover:text-brand-blue-light transition-colors">Get Started</Link></li>
                            </ul>
                        </div>

                        {/* Links Column 2 */}
                        <div className="md:col-span-3">
                            <h4 className="text-white font-bold mb-6 tracking-wide">Company</h4>
                            <ul className="space-y-4 text-slate-400">
                                <li><Link href="#" className="hover:text-brand-blue-light transition-colors">About Us</Link></li>
                                <li><Link href="#" className="hover:text-brand-blue-light transition-colors">Contact</Link></li>
                                <li><Link href="#" className="hover:text-brand-blue-light transition-colors">Privacy Policy</Link></li>
                                <li><Link href="#" className="hover:text-brand-blue-light transition-colors">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-600 text-sm">
                        <p>© {new Date().getFullYear()} EnhancedHR. All rights reserved.</p>
                        <div className="flex gap-6">
                            {/* Socials could go here in a minimal way if needed later */}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
