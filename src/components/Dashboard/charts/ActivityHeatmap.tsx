'use client';

import React, { useState, useMemo } from 'react';

interface ActivityHeatmapProps {
    activityData: { date: string; count: number }[];
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ activityData }) => {
    const [hoveredCell, setHoveredCell] = useState<{ date: string; x: number; y: number; count: number } | null>(null);

    const CELL_SIZE = 12;
    const CELL_GAP = 3;
    const CELL_STEP = CELL_SIZE + CELL_GAP;
    const LABEL_WIDTH = 28;
    const HEADER_HEIGHT = 16;
    const WEEKS = 13;
    const DAYS = 7;

    const { cells, monthLabels, maxCount } = useMemo(() => {
        const countMap = new Map<string, number>();
        activityData.forEach(d => countMap.set(d.date, d.count));

        const max = activityData.reduce((m, d) => Math.max(m, d.count), 0);
        const today = new Date();

        // Start date: 12 weeks ago, aligned to Sunday
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - (WEEKS - 1) * 7 - today.getDay());

        const cells: { date: string; col: number; row: number; count: number }[] = [];
        const monthLabels: { label: string; col: number }[] = [];
        let lastMonth = -1;

        for (let week = 0; week < WEEKS; week++) {
            for (let day = 0; day < DAYS; day++) {
                const cellDate = new Date(startDate);
                cellDate.setDate(startDate.getDate() + week * 7 + day);

                // Don't show future dates
                if (cellDate > today) continue;

                const dateStr = cellDate.toISOString().split('T')[0];
                const month = cellDate.getMonth();

                // Track month boundaries for labels
                if (month !== lastMonth && day === 0) {
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    monthLabels.push({ label: monthNames[month], col: week });
                    lastMonth = month;
                }

                cells.push({
                    date: dateStr,
                    col: week,
                    row: day,
                    count: countMap.get(dateStr) || 0,
                });
            }
        }

        return { cells, monthLabels, maxCount: max };
    }, [activityData]);

    const getCellColor = (count: number): string => {
        if (count === 0) return 'rgba(255, 255, 255, 0.03)';
        if (maxCount === 0) return 'rgba(255, 255, 255, 0.03)';
        const ratio = count / maxCount;
        if (ratio <= 0.33) return 'rgba(120, 192, 240, 0.3)';
        if (ratio <= 0.66) return 'rgba(120, 192, 240, 0.6)';
        return '#78C0F0';
    };

    const svgWidth = LABEL_WIDTH + WEEKS * CELL_STEP;
    const svgHeight = HEADER_HEIGHT + DAYS * CELL_STEP;

    const formatDateLabel = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const dayLabels = [
        { label: 'Mon', row: 1 },
        { label: 'Wed', row: 3 },
        { label: 'Fri', row: 5 },
    ];

    return (
        <div className="relative">
            <svg
                width="100%"
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="overflow-visible"
            >
                {/* Month labels */}
                {monthLabels.map((m, i) => (
                    <text
                        key={i}
                        x={LABEL_WIDTH + m.col * CELL_STEP + CELL_SIZE / 2}
                        y={10}
                        textAnchor="middle"
                        className="fill-slate-600"
                        style={{ fontSize: '9px' }}
                    >
                        {m.label}
                    </text>
                ))}

                {/* Day labels */}
                {dayLabels.map((d) => (
                    <text
                        key={d.label}
                        x={0}
                        y={HEADER_HEIGHT + d.row * CELL_STEP + CELL_SIZE / 2 + 3}
                        className="fill-slate-600"
                        style={{ fontSize: '9px' }}
                    >
                        {d.label}
                    </text>
                ))}

                {/* Grid cells */}
                {cells.map((cell) => (
                    <rect
                        key={cell.date}
                        x={LABEL_WIDTH + cell.col * CELL_STEP}
                        y={HEADER_HEIGHT + cell.row * CELL_STEP}
                        width={CELL_SIZE}
                        height={CELL_SIZE}
                        rx={2}
                        ry={2}
                        fill={getCellColor(cell.count)}
                        className="transition-opacity duration-150 cursor-pointer"
                        onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const parentRect = e.currentTarget.closest('div')?.getBoundingClientRect();
                            setHoveredCell({
                                date: cell.date,
                                x: rect.left - (parentRect?.left || 0) + CELL_SIZE / 2,
                                y: rect.top - (parentRect?.top || 0) - 8,
                                count: cell.count,
                            });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                    />
                ))}
            </svg>

            {/* Tooltip */}
            {hoveredCell && (
                <div
                    className="absolute z-50 pointer-events-none bg-[#0f172a] border border-white/20 rounded-lg px-3 py-2 shadow-xl"
                    style={{
                        left: hoveredCell.x,
                        top: hoveredCell.y,
                        transform: 'translate(-50%, -100%)',
                    }}
                >
                    <p className="text-xs text-slate-300 whitespace-nowrap">{formatDateLabel(hoveredCell.date)}</p>
                    <p className={`text-xs font-medium ${hoveredCell.count > 0 ? 'text-brand-blue-light' : 'text-slate-500'}`}>
                        {hoveredCell.count > 0
                            ? `${hoveredCell.count} ${hoveredCell.count === 1 ? 'activity' : 'activities'}`
                            : 'No activity'}
                    </p>
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-1.5 mt-3 justify-end">
                <span className="text-[9px] text-slate-600">Less</span>
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.05)' }} />
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'rgba(120, 192, 240, 0.3)' }} />
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'rgba(120, 192, 240, 0.6)' }} />
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#78C0F0' }} />
                <span className="text-[9px] text-slate-600">More</span>
            </div>
        </div>
    );
};

export default ActivityHeatmap;
