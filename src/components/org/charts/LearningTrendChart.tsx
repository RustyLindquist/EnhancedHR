'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LearningTrendChartProps {
  data: { date: string; minutes: number }[];
}

const LearningTrendChart: React.FC<LearningTrendChartProps> = ({ data }) => {
  // Format date for display (MM/DD)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Format minutes as hours when > 60
  const formatMinutes = (minutes: number) => {
    if (minutes >= 60) {
      const hours = (minutes / 60).toFixed(1);
      return `${hours}h`;
    }
    return `${minutes}m`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-xs text-slate-400 mb-1">{formatDate(payload[0].payload.date)}</p>
          <p className="text-sm font-bold text-white">
            {formatMinutes(payload[0].value)} learning time
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="learningGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          stroke="#94a3b8"
          style={{ fontSize: '12px' }}
          tick={{ fill: '#94a3b8' }}
        />
        <YAxis
          tickFormatter={formatMinutes}
          stroke="#94a3b8"
          style={{ fontSize: '12px' }}
          tick={{ fill: '#94a3b8' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="minutes"
          stroke="#a855f7"
          strokeWidth={2}
          fill="url(#learningGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default LearningTrendChart;
