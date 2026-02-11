'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ActivityCategoryData } from '@/app/actions/personal-activity';

export const CATEGORY_CONFIG: Record<string, { label: string; color: string; group: string }> = {
    // Platform
    logins:          { label: 'Logins',           color: '#78C0F0', group: 'Platform' },
    aiInteractions:  { label: 'AI Interactions',  color: '#A78BFA', group: 'Platform' },
    collectionUsage: { label: 'Collection Usage', color: '#34D399', group: 'Platform' },
    notes:           { label: 'Notes',            color: '#FBBF24', group: 'Platform' },
    personalContext: { label: 'Personal Context', color: '#F472B6', group: 'Platform' },
    customContent:   { label: 'Custom Content',   color: '#FB923C', group: 'Platform' },
    // Academy
    watchTimeMinutes:  { label: 'Watch Time (min)',  color: '#60A5FA', group: 'Academy' },
    creditsEarned:     { label: 'Credits Earned',    color: '#C084FC', group: 'Academy' },
    coursesCompleted:  { label: 'Courses Completed', color: '#2DD4BF', group: 'Academy' },
    lessonsCompleted:  { label: 'Lessons Completed', color: '#4ADE80', group: 'Academy' },
};

export const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG);

interface PersonalActivityTrendsChartProps {
    data: ActivityCategoryData[];
    selectedCategories: string[];
}

const PersonalActivityTrendsChart: React.FC<PersonalActivityTrendsChartProps> = ({ data, selectedCategories }) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString + 'T12:00:00');
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0f172a] border border-white/20 rounded-lg p-3 shadow-xl min-w-[180px]">
                    <p className="text-xs text-slate-400 mb-2 font-medium">{formatDate(label)}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4 mb-1">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-xs text-slate-300">{entry.name}</span>
                            </div>
                            <span className="text-sm font-bold text-white">{entry.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#94a3b8"
                    style={{ fontSize: '11px' }}
                    tick={{ fill: '#94a3b8' }}
                    interval="preserveStartEnd"
                />
                <YAxis
                    stroke="#94a3b8"
                    style={{ fontSize: '11px' }}
                    tick={{ fill: '#94a3b8' }}
                    allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                {selectedCategories.map((key) => {
                    const config = CATEGORY_CONFIG[key];
                    if (!config) return null;
                    return (
                        <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            name={config.label}
                            stroke={config.color}
                            strokeWidth={2}
                            dot={{ fill: config.color, r: 2 }}
                            activeDot={{ r: 4 }}
                            connectNulls
                        />
                    );
                })}
            </LineChart>
        </ResponsiveContainer>
    );
};

export default PersonalActivityTrendsChart;
