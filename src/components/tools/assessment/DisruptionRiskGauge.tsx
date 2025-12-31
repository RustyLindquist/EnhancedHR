'use client';

import React, { useEffect, useState } from 'react';
import { getRiskLevelColor } from '@/lib/assessment-parser';

interface DisruptionRiskGaugeProps {
    score: number;        // 1-10
    riskLevel: string;
    timelineImpact?: string;
    animate?: boolean;
}

const DisruptionRiskGauge: React.FC<DisruptionRiskGaugeProps> = ({
    score,
    riskLevel,
    timelineImpact,
    animate = true
}) => {
    const [animatedScore, setAnimatedScore] = useState(animate ? 0 : score);

    useEffect(() => {
        if (animate) {
            const duration = 1000; // 1 second
            const startTime = Date.now();
            const startScore = 0;

            const animateScore = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const currentScore = startScore + (score - startScore) * easeOut;

                setAnimatedScore(currentScore);

                if (progress < 1) {
                    requestAnimationFrame(animateScore);
                }
            };

            requestAnimationFrame(animateScore);
        }
    }, [score, animate]);

    const color = getRiskLevelColor(riskLevel);

    // SVG gauge parameters
    const size = 200;
    const strokeWidth = 16;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Gauge arc: 180 degrees (half circle)
    const arcLength = circumference * 0.5; // 180 degrees
    const scorePercentage = animatedScore / 10;
    const filledLength = arcLength * scorePercentage;
    const emptyLength = arcLength - filledLength;

    // Rotate to start from left side
    const rotation = 180;

    return (
        <div className="flex flex-col items-center">
            {/* Gauge SVG */}
            <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
                <svg
                    width={size}
                    height={size / 2 + 20}
                    viewBox={`0 0 ${size} ${size / 2 + 20}`}
                    className="overflow-visible"
                >
                    {/* Gradient definitions */}
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22c55e" />
                            <stop offset="30%" stopColor="#eab308" />
                            <stop offset="70%" stopColor="#f97316" />
                            <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Background arc */}
                    <path
                        d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />

                    {/* Colored arc with gradient */}
                    <path
                        d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={`${filledLength} ${emptyLength}`}
                        style={{
                            transition: animate ? 'none' : 'stroke-dasharray 0.5s ease-out'
                        }}
                    />

                    {/* Score indicator dot */}
                    <circle
                        cx={size / 2 + radius * Math.cos(Math.PI - (Math.PI * scorePercentage))}
                        cy={size / 2 - radius * Math.sin(Math.PI * scorePercentage)}
                        r={8}
                        fill={color}
                        filter="url(#glow)"
                        className="transition-all"
                    />

                    {/* Center score display */}
                    <text
                        x={size / 2}
                        y={size / 2 - 10}
                        textAnchor="middle"
                        className="fill-white text-4xl font-bold"
                        style={{ fontSize: '48px', fontWeight: 700 }}
                    >
                        {animatedScore.toFixed(1)}
                    </text>
                    <text
                        x={size / 2}
                        y={size / 2 + 15}
                        textAnchor="middle"
                        className="fill-slate-400 text-xs uppercase tracking-wider"
                        style={{ fontSize: '10px' }}
                    >
                        / 10
                    </text>
                </svg>

                {/* Scale labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
                    <span className="text-xs text-slate-500">Low</span>
                    <span className="text-xs text-slate-500">Critical</span>
                </div>
            </div>

            {/* Risk Level Badge */}
            <div
                className="mt-4 px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider border"
                style={{
                    backgroundColor: `${color}20`,
                    borderColor: `${color}50`,
                    color: color
                }}
            >
                {riskLevel} Risk
            </div>

            {/* Timeline Impact */}
            {timelineImpact && (
                <p className="mt-3 text-sm text-slate-400 text-center max-w-xs">
                    {timelineImpact}
                </p>
            )}
        </div>
    );
};

export default DisruptionRiskGauge;
