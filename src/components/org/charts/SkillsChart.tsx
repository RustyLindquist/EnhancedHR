'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SkillsChartProps {
  data: { skill: string; count: number }[];
}

const SkillsChart: React.FC<SkillsChartProps> = ({ data }) => {
  // Limit to top 8 skills
  const topSkills = data.slice(0, 8);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-bold text-white mb-1">{payload[0].payload.skill}</p>
          <p className="text-xs text-slate-400">
            {payload[0].value} {payload[0].value === 1 ? 'completion' : 'completions'}
          </p>
        </div>
      );
    }
    return null;
  };

  // Generate gradient colors from cyan to purple
  const getBarColor = (index: number, total: number) => {
    const ratio = index / Math.max(total - 1, 1);
    const r = Math.round(6 + (168 - 6) * ratio); // cyan to purple
    const g = Math.round(182 + (133 - 182) * ratio);
    const b = Math.round(212 + (247 - 212) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={topSkills}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
        <XAxis
          type="number"
          stroke="#94a3b8"
          style={{ fontSize: '12px' }}
          tick={{ fill: '#94a3b8' }}
        />
        <YAxis
          type="category"
          dataKey="skill"
          stroke="#94a3b8"
          style={{ fontSize: '12px' }}
          tick={{ fill: '#94a3b8' }}
          width={120}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {topSkills.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(index, topSkills.length)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SkillsChart;
