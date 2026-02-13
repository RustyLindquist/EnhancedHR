import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import MarketingDivider from '@/components/marketing/MarketingDivider';

export default function LandingPageLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#0A0D12] text-white font-sans selection:bg-[#4B8BB3]/30 selection:text-white">
            {/* Minimal Navigation — Logo + CTA only */}
            <nav className="fixed top-0 w-full z-50 bg-[#0A0D12]/70 backdrop-blur-2xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
                    <Link href="/" target="_blank" className="flex items-center gap-2 group flex-shrink-0">
                        <Image
                            src="/images/logos/EnhancedHR-logo.png"
                            alt="EnhancedHR"
                            width={160}
                            height={36}
                            className="w-[140px] md:w-[160px] h-auto"
                            priority
                        />
                    </Link>

                    <Link
                        href="/login?view=signup"
                        className="px-5 py-2 rounded-full bg-[#4B8BB3] text-white text-sm font-semibold hover:bg-[#5a9bc3] transition-all shadow-[0_0_20px_rgba(75,139,179,0.25)] hover:shadow-[0_0_30px_rgba(75,139,179,0.4)] flex items-center gap-1.5"
                    >
                        Start Free Trial <ArrowRight size={14} />
                    </Link>
                </div>
                <MarketingDivider />
            </nav>

            {/* Main Content */}
            <main>
                {children}
            </main>

            <MarketingDivider />

            {/* Simplified Footer — Trust badges + copyright only */}
            <footer className="bg-[#050810] border-t border-white/[0.06]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
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
