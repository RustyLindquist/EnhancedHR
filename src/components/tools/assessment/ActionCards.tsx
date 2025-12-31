'use client';

import React, { useState } from 'react';
import { Zap, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { getPriorityColor, AssessmentData } from '@/lib/assessment-parser';

interface ActionCardsProps {
    immediateActions: AssessmentData['immediateActions'];
    strategicRecommendations: AssessmentData['strategicRecommendations'];
}

const ActionCards: React.FC<ActionCardsProps> = ({
    immediateActions,
    strategicRecommendations
}) => {
    const [expandedImmediate, setExpandedImmediate] = useState<number | null>(null);
    const [expandedStrategic, setExpandedStrategic] = useState<number | null>(null);

    return (
        <div className="w-full space-y-8">
            {/* Immediate Actions */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-orange-400" />
                    Immediate Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {immediateActions.map((action, index) => {
                        const color = getPriorityColor(action.priority);
                        const isExpanded = expandedImmediate === index;

                        return (
                            <div
                                key={index}
                                className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden transition-all duration-300 hover:border-white/20"
                                style={{
                                    borderLeftWidth: '4px',
                                    borderLeftColor: color
                                }}
                            >
                                <button
                                    onClick={() => setExpandedImmediate(isExpanded ? null : index)}
                                    className="w-full p-4 text-left"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span
                                                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                                                    style={{
                                                        backgroundColor: `${color}20`,
                                                        color: color
                                                    }}
                                                >
                                                    {action.priority}
                                                </span>
                                            </div>
                                            <h4 className="text-white font-medium text-sm">
                                                {action.title}
                                            </h4>
                                        </div>
                                        <div className="text-slate-400">
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                    </div>

                                    <div
                                        className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-40 mt-3' : 'max-h-0'}`}
                                    >
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            {action.description}
                                        </p>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Strategic Recommendations */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Target size={20} className="text-teal-400" />
                    Strategic Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {strategicRecommendations.map((rec, index) => {
                        const isExpanded = expandedStrategic === index;

                        return (
                            <div
                                key={index}
                                className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-teal-500/20 overflow-hidden transition-all duration-300 hover:border-teal-500/40"
                            >
                                <button
                                    onClick={() => setExpandedStrategic(isExpanded ? null : index)}
                                    className="w-full p-4 text-left"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-wider">
                                                    {rec.timeframe}
                                                </span>
                                            </div>
                                            <h4 className="text-white font-medium text-sm">
                                                {rec.title}
                                            </h4>
                                        </div>
                                        <div className="text-slate-400">
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                    </div>

                                    <div
                                        className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-40 mt-3' : 'max-h-0'}`}
                                    >
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            {rec.description}
                                        </p>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ActionCards;
