# Org Dashboard Filter Components - Usage Example

## DateRangePicker & DashboardFilterDropdown

These components are designed to work together for filtering the Org Dashboard analytics.

### Example Implementation

```tsx
'use client';

import React, { useState } from 'react';
import DateRangePicker from '@/components/org/DateRangePicker';
import DashboardFilterDropdown from '@/components/org/DashboardFilterDropdown';

export default function OrgDashboard() {
  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default: last 30 days
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  // Group filter state
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Sample groups data (replace with actual data from your API)
  const groups = [
    { id: '1', name: 'Engineering Team', memberCount: 25, isDynamic: false },
    { id: '2', name: 'Sales Team', memberCount: 15, isDynamic: false },
    { id: '3', name: 'Active Learners', memberCount: 42, isDynamic: true },
    { id: '4', name: 'New Hires (Last 90 Days)', memberCount: 8, isDynamic: true },
  ];

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    // Trigger data refresh here
  };

  const handleGroupChange = (groupId: string | null) => {
    setSelectedGroupId(groupId);
    // Trigger data refresh here
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Organization Dashboard</h1>

      {/* Filters Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DashboardFilterDropdown
          selectedGroupId={selectedGroupId}
          groups={groups}
          onGroupChange={handleGroupChange}
        />
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
        />
      </div>

      {/* Your dashboard content here */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <p className="text-slate-400">
          Showing analytics for: {selectedGroupId ? groups.find(g => g.id === selectedGroupId)?.name : 'All Employees'}
        </p>
        <p className="text-slate-400">
          Date range: {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
```

## Component Features

### DateRangePicker
- Quick presets: 7d, 30d, 60d, 90d, This Month, This Quarter, All Time
- Manual date selection with native HTML date inputs
- Highlights selected preset
- Clears preset when manually changing dates
- Dark theme with purple accents

### DashboardFilterDropdown
- "All Employees" default option for org-wide data
- Lists all groups with member counts
- Visual indicator (Sparkles icon) for dynamic groups
- Search functionality for 10+ groups
- Selected state with check mark
- Purple accent for selected group
- Smooth dropdown animations

## Styling Notes
Both components follow the existing design system:
- Background: `bg-white/5`
- Border: `border-white/10`
- Hover states: `hover:bg-white/10`
- Purple accents for selected states
- Consistent with `GroupDetailCanvas` StatCard styling
