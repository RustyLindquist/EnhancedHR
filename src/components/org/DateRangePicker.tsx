'use client';

import React, { useState } from 'react';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (start: Date, end: Date) => void;
}

type PresetType = '7d' | '30d' | '60d' | '90d' | 'month' | 'quarter' | 'all';

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateChange,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<PresetType | null>(null);

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handlePreset = (preset: PresetType) => {
    const now = new Date();
    let newStartDate: Date;
    let newEndDate: Date = now;

    switch (preset) {
      case '7d':
        newStartDate = new Date(now);
        newStartDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        newStartDate = new Date(now);
        newStartDate.setDate(now.getDate() - 30);
        break;
      case '60d':
        newStartDate = new Date(now);
        newStartDate.setDate(now.getDate() - 60);
        break;
      case '90d':
        newStartDate = new Date(now);
        newStartDate.setDate(now.getDate() - 90);
        break;
      case 'month':
        newStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        newStartDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        break;
      case 'all':
        // Set to a very early date (e.g., 5 years ago)
        newStartDate = new Date(now);
        newStartDate.setFullYear(now.getFullYear() - 5);
        break;
      default:
        newStartDate = new Date(now);
        newStartDate.setDate(now.getDate() - 30);
    }

    setSelectedPreset(preset);
    onDateChange(newStartDate, newEndDate);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = new Date(e.target.value);
    setSelectedPreset(null); // Clear preset when manually changing dates
    onDateChange(newStart, endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = new Date(e.target.value);
    setSelectedPreset(null); // Clear preset when manually changing dates
    onDateChange(startDate, newEnd);
  };

  const presets = [
    { label: '7d', value: '7d' as PresetType },
    { label: '30d', value: '30d' as PresetType },
    { label: '60d', value: '60d' as PresetType },
    { label: '90d', value: '90d' as PresetType },
    { label: 'This Month', value: 'month' as PresetType },
    { label: 'All Time', value: 'all' as PresetType },
  ];

  return (
    <div>
      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2 mb-3">
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePreset(preset.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedPreset === preset.value
                ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Date Inputs */}
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={formatDateForInput(startDate)}
          onChange={handleStartDateChange}
          className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-blue-light/50 transition-colors"
        />
        <span className="text-slate-500 text-sm">to</span>
        <input
          type="date"
          value={formatDateForInput(endDate)}
          onChange={handleEndDateChange}
          className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-blue-light/50 transition-colors"
        />
      </div>
    </div>
  );
};

export default DateRangePicker;
