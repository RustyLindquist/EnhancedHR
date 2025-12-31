'use client';

import React, { useState } from 'react';
import { Clock, TrendingUp, Zap, Target } from 'lucide-react';

interface RoleEvolutionTimelineProps {
    timeline: {
        current: string;
        oneToTwo: string;
        threeToFive: string;
        fivePlus: string;
    };
}

const stages = [
    { key: 'current', label: 'Now', icon: Clock },
    { key: 'oneToTwo', label: '1-2 Years', icon: TrendingUp },
    { key: 'threeToFive', label: '3-5 Years', icon: Zap },
    { key: 'fivePlus', label: '5+ Years', icon: Target },
] as const;

const RoleEvolutionTimeline: React.FC<RoleEvolutionTimelineProps> = ({ timeline }) => {
    const [expandedStage, setExpandedStage] = useState<string | null>(null);

    return (
        <div className="w-full">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-teal-400" />
                Role Evolution Timeline
            </h3>

            {/* Timeline Container */}
            <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-8 left-8 right-8 h-0.5 bg-gradient-to-r from-teal-500/50 via-teal-400 to-teal-500/50" />

                {/* Stages */}
                <div className="relative flex justify-between">
                    {stages.map((stage, index) => {
                        const Icon = stage.icon;
                        const content = timeline[stage.key];
                        const isExpanded = expandedStage === stage.key;

                        return (
                            <div
                                key={stage.key}
                                className="flex flex-col items-center cursor-pointer group"
                                style={{ width: '23%' }}
                                onClick={() => setExpandedStage(isExpanded ? null : stage.key)}
                            >
                                {/* Node */}
                                <div
                                    className={`
                                        relative z-10 w-16 h-16 rounded-full flex items-center justify-center
                                        transition-all duration-300 border-2
                                        ${isExpanded
                                            ? 'bg-teal-500 border-teal-400 scale-110 shadow-[0_0_20px_rgba(20,184,166,0.5)]'
                                            : 'bg-slate-900 border-teal-500/50 group-hover:border-teal-400 group-hover:scale-105'
                                        }
                                    `}
                                    style={{
                                        animationDelay: `${index * 200}ms`
                                    }}
                                >
                                    <Icon
                                        size={24}
                                        className={`transition-colors ${isExpanded ? 'text-white' : 'text-teal-400 group-hover:text-teal-300'}`}
                                    />
                                </div>

                                {/* Label */}
                                <span className={`
                                    mt-3 text-sm font-medium transition-colors
                                    ${isExpanded ? 'text-teal-400' : 'text-slate-400 group-hover:text-white'}
                                `}>
                                    {stage.label}
                                </span>

                                {/* Content Card (expandable) */}
                                <div
                                    className={`
                                        mt-4 w-full overflow-hidden transition-all duration-300
                                        ${isExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}
                                    `}
                                >
                                    <div className="bg-slate-900/80 backdrop-blur-sm border border-teal-500/30 rounded-xl p-4">
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                            {content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Hint */}
            <p className="mt-6 text-center text-xs text-slate-500">
                Click on a stage to see details
            </p>
        </div>
    );
};

export default RoleEvolutionTimeline;
