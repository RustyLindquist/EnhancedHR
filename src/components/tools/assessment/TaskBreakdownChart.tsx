'use client';

import React, { useState } from 'react';
import { PieChart, Zap, Cog, User } from 'lucide-react';
import { calculateTaskBreakdownTotal, AssessmentData } from '@/lib/assessment-parser';

interface TaskBreakdownChartProps {
    taskBreakdown: AssessmentData['taskBreakdown'];
}

const TaskBreakdownChart: React.FC<TaskBreakdownChartProps> = ({ taskBreakdown }) => {
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    const totals = calculateTaskBreakdownTotal(taskBreakdown);
    const total = totals.automatable + totals.augmentable + totals.humanEssential;

    const categories = [
        {
            key: 'automatable',
            label: 'Highly Automatable',
            percentage: totals.automatable,
            color: '#ef4444',
            bgColor: 'rgba(239, 68, 68, 0.2)',
            borderColor: 'rgba(239, 68, 68, 0.5)',
            icon: Zap,
            tasks: taskBreakdown.highlyAutomatable,
            description: 'Tasks that AI can fully automate'
        },
        {
            key: 'augmentable',
            label: 'AI-Augmentable',
            percentage: totals.augmentable,
            color: '#f97316',
            bgColor: 'rgba(249, 115, 22, 0.2)',
            borderColor: 'rgba(249, 115, 22, 0.5)',
            icon: Cog,
            tasks: taskBreakdown.augmentable,
            description: 'Tasks where AI assists but humans lead'
        },
        {
            key: 'humanEssential',
            label: 'Human Essential',
            percentage: totals.humanEssential,
            color: '#22c55e',
            bgColor: 'rgba(34, 197, 94, 0.2)',
            borderColor: 'rgba(34, 197, 94, 0.5)',
            icon: User,
            tasks: taskBreakdown.humanEssential,
            description: 'Tasks requiring uniquely human skills'
        }
    ];

    // Calculate bar widths
    const getBarWidth = (percentage: number) => {
        if (total === 0) return 0;
        return (percentage / total) * 100;
    };

    return (
        <div className="w-full">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <PieChart size={20} className="text-teal-400" />
                Task Breakdown by Automation Potential
            </h3>

            {/* Stacked Bar Chart */}
            <div className="mb-8">
                <div className="h-12 rounded-xl overflow-hidden flex bg-slate-900/50 border border-white/10">
                    {categories.map((cat) => (
                        <div
                            key={cat.key}
                            className="h-full transition-all duration-500 relative cursor-pointer group"
                            style={{
                                width: `${getBarWidth(cat.percentage)}%`,
                                backgroundColor: cat.color,
                                minWidth: cat.percentage > 0 ? '40px' : '0'
                            }}
                            onMouseEnter={() => setHoveredCategory(cat.key)}
                            onMouseLeave={() => setHoveredCategory(null)}
                        >
                            {/* Percentage label */}
                            {cat.percentage > 0 && (
                                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                                    {cat.percentage}%
                                </span>
                            )}

                            {/* Hover tooltip */}
                            {hoveredCategory === cat.key && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-white/20 rounded-lg shadow-xl z-10 whitespace-nowrap">
                                    <span className="text-sm font-medium text-white">{cat.label}</span>
                                    <span className="ml-2 text-sm" style={{ color: cat.color }}>{cat.percentage}%</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Category Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isHovered = hoveredCategory === cat.key;

                    return (
                        <div
                            key={cat.key}
                            className={`
                                rounded-xl p-4 border transition-all duration-300 cursor-pointer
                                ${isHovered ? 'scale-[1.02]' : ''}
                            `}
                            style={{
                                backgroundColor: cat.bgColor,
                                borderColor: cat.borderColor,
                                boxShadow: isHovered ? `0 0 20px ${cat.bgColor}` : 'none'
                            }}
                            onMouseEnter={() => setHoveredCategory(cat.key)}
                            onMouseLeave={() => setHoveredCategory(null)}
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: `${cat.color}30` }}
                                >
                                    <Icon size={20} style={{ color: cat.color }} />
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold" style={{ color: cat.color }}>
                                            {cat.percentage}%
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-400">{cat.label}</span>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-slate-400 mb-3">{cat.description}</p>

                            {/* Task List */}
                            {cat.tasks.length > 0 && (
                                <div className="space-y-1.5">
                                    {cat.tasks.slice(0, 3).map((task, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between text-xs"
                                        >
                                            <span className="text-slate-300 truncate pr-2">{task.task}</span>
                                            <span className="text-slate-500 flex-shrink-0">{task.percentage}%</span>
                                        </div>
                                    ))}
                                    {cat.tasks.length > 3 && (
                                        <span className="text-xs text-slate-500">
                                            +{cat.tasks.length - 3} more
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TaskBreakdownChart;
