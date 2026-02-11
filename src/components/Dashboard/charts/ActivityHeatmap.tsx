'use client';

import React, { useState, useMemo } from 'react';

interface ActivityHeatmapProps {
    activityData: { date: string; count: number }[];
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
}

// ── Fixed reference dimensions (locked to 90-day view) ──────────────────────
// viewBox never changes → rendered height is always the same
const HEADER_H = 16;
const CELL_H = 12;
const Y_GAP = 3;
const Y_STEP = CELL_H + Y_GAP; // 15
const ROWS = 7;
const DAY_LABEL_W = 28;
const MONTH_LABEL_W = 36;
const CONTENT_W = 195; // 13 cols × 15 (reference 90d)
const VB_W = DAY_LABEL_W + CONTENT_W; // 223
const VB_H = HEADER_H + ROWS * Y_STEP; // 121
const CONTENT_H = VB_H - HEADER_H; // 105

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getCellColor(count: number, maxCount: number): string {
    if (count < 0) return 'rgba(255, 255, 255, 0.015)';
    if (count === 0 || maxCount === 0) return 'rgba(255, 255, 255, 0.03)';
    const ratio = count / maxCount;
    if (ratio <= 0.33) return 'rgba(120, 192, 240, 0.3)';
    if (ratio <= 0.66) return 'rgba(120, 192, 240, 0.6)';
    return '#78C0F0';
}

function formatDateLabel(dateStr: string): string {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const DAY_LABELS = [
    { label: 'Mon', row: 1 },
    { label: 'Wed', row: 3 },
    { label: 'Fri', row: 5 },
];

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ activityData, startDate, endDate }) => {
    const [hoveredCell, setHoveredCell] = useState<{ label: string; x: number; y: number; count: number } | null>(null);

    const countMap = useMemo(() => {
        const map = new Map<string, number>();
        activityData.forEach(d => map.set(d.date, d.count));
        return map;
    }, [activityData]);

    const rangeInDays = useMemo(() => {
        const s = new Date(startDate + 'T12:00:00');
        const e = new Date(endDate + 'T12:00:00');
        return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }, [startDate, endDate]);

    const isMonthMode = rangeInDays > 365;

    // ── Day-Level Grid (fixed viewBox, dynamic cell width) ──────────────────
    const dayGrid = useMemo(() => {
        if (isMonthMode) return null;

        const start = new Date(startDate + 'T12:00:00');
        const end = new Date(endDate + 'T12:00:00');
        const today = new Date();

        // Align to Sunday of start week
        const alignedStart = new Date(start);
        alignedStart.setDate(start.getDate() - start.getDay());

        const totalDays = Math.ceil((end.getTime() - alignedStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const weeks = Math.max(4, Math.ceil(totalDays / 7));

        // Dynamic horizontal sizing — cells stretch to fill fixed CONTENT_W
        const xGap = weeks <= 13 ? 3 : weeks <= 26 ? 2 : 1;
        const cellW = (CONTENT_W - (weeks - 1) * xGap) / weeks;
        const xStep = cellW + xGap;

        type DayCell = { key: string; date: string; x: number; y: number; w: number; count: number };
        const cells: DayCell[] = [];
        const monthLabels: { label: string; x: number }[] = [];
        let lastMonth = -1;
        let maxCount = 0;

        for (let week = 0; week < weeks; week++) {
            for (let day = 0; day < ROWS; day++) {
                const cellDate = new Date(alignedStart);
                cellDate.setDate(alignedStart.getDate() + week * 7 + day);
                if (cellDate > today) continue;

                const dateStr = cellDate.toISOString().split('T')[0];
                const isInRange = dateStr >= startDate && dateStr <= endDate;
                const count = isInRange ? (countMap.get(dateStr) || 0) : -1;
                if (count > maxCount) maxCount = count;

                const month = cellDate.getMonth();
                if (month !== lastMonth && day === 0) {
                    monthLabels.push({ label: MONTH_NAMES[month], x: DAY_LABEL_W + week * xStep + cellW / 2 });
                    lastMonth = month;
                }

                cells.push({
                    key: `${week}-${day}`,
                    date: dateStr,
                    x: DAY_LABEL_W + week * xStep,
                    y: HEADER_H + day * Y_STEP,
                    w: cellW,
                    count,
                });
            }
        }

        return { cells, monthLabels, maxCount };
    }, [isMonthMode, startDate, endDate, countMap]);

    // ── Month-Level Grid (fixed viewBox, dynamic cell sizes) ────────────────
    const monthGrid = useMemo(() => {
        if (!isMonthMode) return null;

        const contentW = VB_W - MONTH_LABEL_W; // horizontal space for 12 month columns
        const cols = 12;

        const startYear = parseInt(startDate.slice(0, 4));
        const endYear = parseInt(endDate.slice(0, 4));
        const years: number[] = [];
        for (let y = startYear; y <= endYear; y++) years.push(y);

        // Dynamic cell sizing to fill the fixed viewBox
        const xGap = 3;
        const cellW = (contentW - (cols - 1) * xGap) / cols;
        const xStep = cellW + xGap;

        const yGap = years.length <= 3 ? 3 : 2;
        const cellH = Math.min(24, (CONTENT_H - (years.length - 1) * yGap) / years.length);
        const yStep = cellH + yGap;

        // Aggregate daily data into months
        const monthCounts = new Map<string, number>();
        activityData.forEach(d => {
            const key = d.date.slice(0, 7);
            monthCounts.set(key, (monthCounts.get(key) || 0) + d.count);
        });

        type MonthCell = { key: string; x: number; y: number; w: number; h: number; count: number; label: string };
        const cells: MonthCell[] = [];
        const yearLabels: { label: string; y: number }[] = [];
        const now = new Date();
        let maxCount = 0;

        years.forEach((year, rowIdx) => {
            yearLabels.push({ label: String(year), y: HEADER_H + rowIdx * yStep + cellH / 2 + 3 });

            for (let month = 0; month < 12; month++) {
                const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth());
                if (isFuture) continue;

                const key = `${year}-${String(month + 1).padStart(2, '0')}`;
                const lastDay = new Date(year, month + 1, 0).getDate();
                const monthStart = `${key}-01`;
                const monthEnd = `${key}-${String(lastDay).padStart(2, '0')}`;
                const isInRange = monthEnd >= startDate && monthStart <= endDate;
                const count = isInRange ? (monthCounts.get(key) || 0) : -1;
                if (count > maxCount) maxCount = count;

                cells.push({
                    key,
                    x: MONTH_LABEL_W + month * xStep,
                    y: HEADER_H + rowIdx * yStep,
                    w: cellW,
                    h: cellH,
                    count,
                    label: `${MONTH_NAMES[month]} ${year}`,
                });
            }
        });

        // Month column header positions
        const monthHeaders = MONTH_NAMES.map((m, i) => ({
            label: m,
            x: MONTH_LABEL_W + i * xStep + cellW / 2,
        }));

        return { cells, yearLabels, monthHeaders, maxCount };
    }, [isMonthMode, startDate, endDate, activityData]);

    // ── Mouse handler ───────────────────────────────────────────────────────
    const handleHover = (e: React.MouseEvent<SVGRectElement>, label: string, count: number) => {
        if (count < 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const parentRect = e.currentTarget.closest('div')?.getBoundingClientRect();
        setHoveredCell({
            label,
            x: rect.left - (parentRect?.left || 0) + rect.width / 2,
            y: rect.top - (parentRect?.top || 0) - 8,
            count,
        });
    };

    // ── Shared UI ───────────────────────────────────────────────────────────
    const tooltip = hoveredCell && (
        <div
            className="absolute z-50 pointer-events-none bg-[#0f172a] border border-white/20 rounded-lg px-3 py-2 shadow-xl"
            style={{ left: hoveredCell.x, top: hoveredCell.y, transform: 'translate(-50%, -100%)' }}
        >
            <p className="text-xs text-slate-300 whitespace-nowrap">{hoveredCell.label}</p>
            <p className={`text-xs font-medium ${hoveredCell.count > 0 ? 'text-brand-blue-light' : 'text-slate-500'}`}>
                {hoveredCell.count > 0
                    ? `${hoveredCell.count} ${hoveredCell.count === 1 ? 'activity' : 'activities'}`
                    : 'No activity'}
            </p>
        </div>
    );

    const legend = (
        <div className="flex items-center gap-1.5 mt-3 justify-end">
            <span className="text-[9px] text-slate-600">Less</span>
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.05)' }} />
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'rgba(120, 192, 240, 0.3)' }} />
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'rgba(120, 192, 240, 0.6)' }} />
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#78C0F0' }} />
            <span className="text-[9px] text-slate-600">More</span>
        </div>
    );

    // ── Render day mode ─────────────────────────────────────────────────────
    if (!isMonthMode && dayGrid) {
        const { cells, monthLabels, maxCount: mc } = dayGrid;

        return (
            <div className="relative">
                <svg width="100%" viewBox={`0 0 ${VB_W} ${VB_H}`} className="overflow-visible">
                    {monthLabels.map((m, i) => (
                        <text key={i} x={m.x} y={10}
                            textAnchor="middle" className="fill-slate-600" style={{ fontSize: '9px' }}>{m.label}</text>
                    ))}
                    {DAY_LABELS.map((d) => (
                        <text key={d.label} x={0} y={HEADER_H + d.row * Y_STEP + CELL_H / 2 + 3}
                            className="fill-slate-600" style={{ fontSize: '9px' }}>{d.label}</text>
                    ))}
                    {cells.map((cell) => (
                        <rect
                            key={cell.key}
                            x={cell.x} y={cell.y}
                            width={cell.w} height={CELL_H}
                            rx={2} ry={2}
                            fill={getCellColor(cell.count, mc)}
                            className={`transition-opacity duration-150 ${cell.count >= 0 ? 'cursor-pointer' : 'opacity-30'}`}
                            onMouseEnter={(e) => handleHover(e, formatDateLabel(cell.date), cell.count)}
                            onMouseLeave={() => setHoveredCell(null)}
                        />
                    ))}
                </svg>
                {tooltip}
                {legend}
            </div>
        );
    }

    // ── Render month mode ───────────────────────────────────────────────────
    if (isMonthMode && monthGrid) {
        const { cells, yearLabels, monthHeaders, maxCount: mc } = monthGrid;

        return (
            <div className="relative">
                <svg width="100%" viewBox={`0 0 ${VB_W} ${VB_H}`} className="overflow-visible">
                    {monthHeaders.map((m) => (
                        <text key={m.label} x={m.x} y={10}
                            textAnchor="middle" className="fill-slate-600" style={{ fontSize: '9px' }}>{m.label}</text>
                    ))}
                    {yearLabels.map((y) => (
                        <text key={y.label} x={0} y={y.y}
                            className="fill-slate-600" style={{ fontSize: '9px' }}>{y.label}</text>
                    ))}
                    {cells.map((cell) => (
                        <rect
                            key={cell.key}
                            x={cell.x} y={cell.y}
                            width={cell.w} height={cell.h}
                            rx={3} ry={3}
                            fill={getCellColor(cell.count, mc)}
                            className={`transition-opacity duration-150 ${cell.count >= 0 ? 'cursor-pointer' : 'opacity-30'}`}
                            onMouseEnter={(e) => handleHover(e, cell.label, cell.count)}
                            onMouseLeave={() => setHoveredCell(null)}
                        />
                    ))}
                </svg>
                {tooltip}
                {legend}
            </div>
        );
    }

    return null;
};

export default ActivityHeatmap;
