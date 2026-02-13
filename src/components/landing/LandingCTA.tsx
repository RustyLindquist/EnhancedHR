import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface LandingCTAProps {
    variant?: 'default' | 'large';
}

export default function LandingCTA({ variant = 'default' }: LandingCTAProps) {
    const isLarge = variant === 'large';

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
                href="/login?view=signup"
                className={`group rounded-full bg-[#4B8BB3] text-white font-bold hover:bg-[#5a9bc3] transition-all shadow-[0_0_30px_rgba(75,139,179,0.3)] hover:shadow-[0_0_50px_rgba(75,139,179,0.5)] hover:-translate-y-0.5 flex items-center gap-2 ${
                    isLarge ? 'px-10 py-5 text-xl' : 'px-8 py-4 text-lg'
                }`}
            >
                Start Free Trial
                <ArrowRight size={isLarge ? 24 : 20} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
                href="/demo"
                className={`rounded-full bg-white/[0.04] text-white font-semibold border border-white/[0.08] hover:bg-white/[0.08] transition-all hover:-translate-y-0.5 flex items-center gap-2 ${
                    isLarge ? 'px-10 py-5 text-xl' : 'px-8 py-4 text-lg'
                }`}
            >
                Schedule a Demo <ArrowRight size={isLarge ? 24 : 20} className="opacity-50" />
            </Link>
        </div>
    );
}
