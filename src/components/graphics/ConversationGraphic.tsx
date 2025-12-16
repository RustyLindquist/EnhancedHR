import React from 'react';

interface GraphicProps {
    size?: number;
    className?: string; // For opacity/positioning handled by parent
}

const ConversationGraphic: React.FC<GraphicProps> = ({ size = 100, className = '' }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="bubbleGradient" x1="0" y1="200" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#78C0F0" stopOpacity="0.8" />
                    <stop offset="1" stopColor="#054C74" stopOpacity="0.4" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Abstract Chat Bubbles Composition */}
            <g filter="url(#glow)">
                {/* Main Bubble */}
                <path
                    d="M40 60 H160 C171.046 60 180 68.9543 180 80 V140 C180 151.046 171.046 160 160 160 H80 L40 190 V160 H40 C28.9543 160 20 151.046 20 140 V80 C20 68.9543 28.9543 60 40 60 Z"
                    fill="url(#bubbleGradient)"
                    stroke="#78C0F0"
                    strokeWidth="2"
                    strokeOpacity="0.5"
                />

                {/* Secondary Lines/Detail */}
                <rect x="50" y="90" width="100" height="8" rx="4" fill="white" fillOpacity="0.2" />
                <rect x="50" y="110" width="70" height="8" rx="4" fill="white" fillOpacity="0.2" />

                {/* Floating Dots */}
                <circle cx="160" cy="40" r="10" fill="#78C0F0" fillOpacity="0.6" />
                <circle cx="20" cy="100" r="6" fill="#054C74" fillOpacity="0.6" />
            </g>
        </svg>
    );
};

export default ConversationGraphic;
