import { createClient } from '@/lib/supabase/server';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import MobileNav from '@/components/marketing/MobileNav';
import MarketingDivider from '@/components/marketing/MarketingDivider';

const navLinks = [
    { href: '/academy', label: 'Academy' },
    { href: '/platform', label: 'Platform' },
    { href: '/ai-tools', label: 'AI Tools' },
    { href: '/collections', label: 'Collections' },
    { href: '/organizations', label: 'Organizations' },
    { href: '/pricing', label: 'Pricing' },
];

export default async function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="min-h-screen bg-[#0A0D12] text-white font-sans selection:bg-[#4B8BB3]/30 selection:text-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-[#0A0D12]/70 backdrop-blur-2xl">
                <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
                        <Image
                            src="/images/logos/EnhancedHR-logo.png"
                            alt="EnhancedHR"
                            width={160}
                            height={36}
                            className="w-[140px] md:w-[160px] h-auto"
                            priority
                        />
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/[0.04]"
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        <Link
                            href="/for-experts"
                            className="text-[13px] font-medium text-[#FF9300]/80 hover:text-[#FF9300] transition-colors px-4 py-2 rounded-lg hover:bg-[#FF9300]/[0.06]"
                        >
                            For Experts
                        </Link>
                    </div>

                    {/* Desktop Auth Buttons */}
                    <div className="hidden lg:flex items-center gap-3">
                        {user ? (
                            <Link
                                href="/dashboard"
                                className="px-5 py-2 rounded-full bg-[#4B8BB3] text-white text-sm font-semibold hover:bg-[#5a9bc3] transition-all shadow-[0_0_20px_rgba(75,139,179,0.25)] hover:shadow-[0_0_30px_rgba(75,139,179,0.4)]"
                            >
                                My Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-4 py-2"
                                >
                                    Log In
                                </Link>
                                <Link
                                    href="/login?view=signup"
                                    className="px-5 py-2 rounded-full bg-[#4B8BB3] text-white text-sm font-semibold hover:bg-[#5a9bc3] transition-all shadow-[0_0_20px_rgba(75,139,179,0.25)] hover:shadow-[0_0_30px_rgba(75,139,179,0.4)] flex items-center gap-1.5"
                                >
                                    Get Started <ArrowRight size={14} />
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu */}
                    <MobileNav isLoggedIn={!!user} />
                </div>
                <MarketingDivider />
            </nav>

            {/* Main Content */}
            <main className="pt-[72px]">
                {children}
            </main>

            <MarketingDivider />

            {/* Footer */}
            <footer className="bg-[#050810] border-t border-white/[0.06] relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#4B8BB3]/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 pt-20 pb-10">
                    <div className="grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-8 mb-16">
                        {/* Brand Column */}
                        <div className="col-span-2 md:col-span-4 space-y-6">
                            <Link href="/" className="block">
                                <Image
                                    src="/images/logos/EnhancedHR-logo.png"
                                    alt="EnhancedHR"
                                    width={160}
                                    height={36}
                                    className="w-[140px] h-auto opacity-80 hover:opacity-100 transition-opacity"
                                />
                            </Link>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                                The AI-native professional development platform for HR leaders and organizations. Enhancing the human side of work in the age of AI.
                            </p>
                        </div>

                        {/* Platform Column */}
                        <div className="md:col-span-2 md:col-start-6">
                            <h4 className="text-white/80 font-semibold text-xs uppercase tracking-wider mb-5">Platform</h4>
                            <ul className="space-y-3">
                                <li><Link href="/academy" className="text-slate-500 hover:text-white text-sm transition-colors">Academy</Link></li>
                                <li><Link href="/platform" className="text-slate-500 hover:text-white text-sm transition-colors">AI Platform</Link></li>
                                <li><Link href="/collections" className="text-slate-500 hover:text-white text-sm transition-colors">Collections</Link></li>
                                <li><Link href="/ai-tools" className="text-slate-500 hover:text-white text-sm transition-colors">AI Tools</Link></li>
                                <li><Link href="/pricing" className="text-slate-500 hover:text-white text-sm transition-colors">Pricing</Link></li>
                            </ul>
                        </div>

                        {/* Solutions Column */}
                        <div className="md:col-span-2">
                            <h4 className="text-white/80 font-semibold text-xs uppercase tracking-wider mb-5">Solutions</h4>
                            <ul className="space-y-3">
                                <li><Link href="/organizations" className="text-slate-500 hover:text-white text-sm transition-colors">For Organizations</Link></li>
                                <li><Link href="/for-experts" className="text-slate-500 hover:text-white text-sm transition-colors">For Experts</Link></li>
                            </ul>
                        </div>

                        {/* Company Column */}
                        <div className="md:col-span-2">
                            <h4 className="text-white/80 font-semibold text-xs uppercase tracking-wider mb-5">Company</h4>
                            <ul className="space-y-3">
                                <li><Link href="/privacy" className="text-slate-500 hover:text-white text-sm transition-colors">Privacy Policy</Link></li>
                                <li><Link href="/terms" className="text-slate-500 hover:text-white text-sm transition-colors">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-slate-600 text-xs">
                            &copy; {new Date().getFullYear()} EnhancedHR. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6 text-slate-600 text-xs">
                            <span>SHRM Approved Provider</span>
                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                            <span>HRCI Approved Provider</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
