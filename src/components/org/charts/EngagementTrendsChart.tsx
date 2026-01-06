'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface EngagementTrendsChartProps {
  data: {
    date: string;
    logins: number;
    aiConversations: number;
    collectionActivity: number;
  }[];
}

const CHART_COLORS = {
  logins: '#78C0F0',           // Brand blue light
  aiConversations: '#A78BFA',  // Purple
  collectionActivity: '#34D399', // Emerald
};

const EngagementTrendsChart: React.FC<EngagementTrendsChartProps> = ({ data }) => {
  // Format date for display (MM/DD)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] border border-white/20 rounded-lg p-3 shadow-xl min-w-[160px]">
          <p className="text-xs text-slate-400 mb-2 font-medium">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
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

  // Custom legend
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex items-center justify-center gap-6 mb-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-slate-300">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={240}>
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
        <Legend content={<CustomLegend />} verticalAlign="top" />
        <Line
          type="monotone"
          dataKey="logins"
          name="Logins"
          stroke={CHART_COLORS.logins}
          strokeWidth={2}
          dot={{ fill: CHART_COLORS.logins, r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="aiConversations"
          name="AI Conversations"
          stroke={CHART_COLORS.aiConversations}
          strokeWidth={2}
          dot={{ fill: CHART_COLORS.aiConversations, r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="collectionActivity"
          name="Collection Activity"
          stroke={CHART_COLORS.collectionActivity}
          strokeWidth={2}
          dot={{ fill: CHART_COLORS.collectionActivity, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default EngagementTrendsChart;
