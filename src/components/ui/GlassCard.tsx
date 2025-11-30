import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = true, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`
                relative overflow-hidden rounded-2xl
                bg-white/[0.03] backdrop-blur-xl
                border border-white/10
                shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]
                transition-all duration-500 ease-out
                ${hoverEffect ? 'hover:bg-white/[0.08] hover:border-white/20 hover:scale-[1.02] hover:shadow-[0_15px_40px_0_rgba(0,0,0,0.4)] cursor-pointer group' : ''}
                ${className}
            `}
        >
            {/* Liquid Shine Effect */}
            {hoverEffect && (
                <div
                    className="
                        absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 left-[-100%]
                        group-hover:animate-shine
                    "
                />
            )}

            {/* Content */}
            <div className="relative z-10 h-full">
                {children}
            </div>

            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        </div>
    );
};

export default GlassCard;
