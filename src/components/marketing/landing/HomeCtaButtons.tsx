import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type CtaSize = 'hero' | 'section';

type HomeCtaButtonsProps = {
    ctaHref: string;
    ctaLabel: string;
    className?: string;
    size?: CtaSize;
};

const styleBySize: Record<CtaSize, { primary: string; secondary: string; icon: number }> = {
    hero: {
        primary:
            'group px-8 py-4 rounded-full bg-[#4B8BB3] text-white font-bold text-lg hover:bg-[#5a9bc3] transition-all shadow-[0_0_30px_rgba(75,139,179,0.3)] hover:shadow-[0_0_50px_rgba(75,139,179,0.5)] hover:-translate-y-0.5 flex items-center gap-2',
        secondary:
            'px-8 py-4 rounded-full bg-white/[0.04] text-white font-semibold text-lg border border-white/[0.08] hover:bg-white/[0.08] transition-all hover:-translate-y-0.5 flex items-center gap-2',
        icon: 20,
    },
    section: {
        primary:
            'group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#4B8BB3] text-white font-bold text-base hover:bg-[#5a9bc3] transition-all shadow-[0_0_24px_rgba(75,139,179,0.28)]',
        secondary:
            'inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/[0.04] text-white font-semibold text-base border border-white/[0.08] hover:bg-white/[0.08] transition-all',
        icon: 18,
    },
};

export default function HomeCtaButtons({
    ctaHref,
    ctaLabel,
    className,
    size = 'hero',
}: HomeCtaButtonsProps) {
    const styles = styleBySize[size];

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${className ?? ''}`}>
            <Link href={ctaHref} className={styles.primary}>
                {ctaLabel}
                <ArrowRight size={styles.icon} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/demo" className={styles.secondary}>
                Schedule a Demo <ArrowRight size={styles.icon} className="opacity-50" />
            </Link>
        </div>
    );
}
