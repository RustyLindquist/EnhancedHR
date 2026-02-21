'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Check, Flame } from 'lucide-react';
import { fetchPersonalActivityData, PersonalActivityData } from '@/app/actions/personal-activity';
import { fetchUserStreak } from '@/lib/dashboard';
import ActivityHeatmap from './charts/ActivityHeatmap';
import PersonalActivityTrendsChart, { CATEGORY_CONFIG, ALL_CATEGORIES } from './charts/PersonalActivityTrendsChart';

interface PersonalInsightsWidgetProps {
    userId: string;
}

// Animated count-up hook
function useCountUp(target: number, duration = 800): number {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (target === 0) { setValue(0); return; }
        const start = performance.now();
        let rafId: number;
        const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setValue(Math.round(eased * target));
            if (progress < 1) rafId = requestAnimationFrame(step);
        };
        rafId = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafId);
    }, [target, duration]);
    return value;
}

// Pure helper functions (hoisted outside component to avoid re-creation)
const formatMinutes = (mins: number): string => {
    if (mins >= 60) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    }
    return `${mins}m`;
};

const formatDateForInput = (date: Date) => date.toISOString().split('T')[0];

// Stat card configs (no icons, centered)
const STAT_CARDS = [
    { key: 'totalActivities', label: 'Total Activities', color: 'text-brand-blue-light' },
    { key: 'learningTime', label: 'Learning Time', color: 'text-blue-400' },
    { key: 'aiInteractions', label: 'AI Interactions', color: 'text-purple-400' },
    { key: 'coursesCompleted', label: 'Courses Done', color: 'text-emerald-400' },
    { key: 'creditsEarned', label: 'Credits Earned', color: 'text-amber-400' },
    { key: 'streak', label: 'Streak', color: 'text-orange-400' },
] as const;

type PresetType = '7d' | '30d' | '60d' | '90d' | 'month' | 'all';

const DATE_PRESETS: { label: string; value: PresetType }[] = [
    { label: '7d', value: '7d' },
    { label: '30d', value: '30d' },
    { label: '60d', value: '60d' },
    { label: '90d', value: '90d' },
    { label: 'This Month', value: 'month' },
    { label: 'All Time', value: 'all' },
];

// Static category groupings (computed once)
const platformCategories = ALL_CATEGORIES.filter(k => CATEGORY_CONFIG[k].group === 'Platform');
const academyCategories = ALL_CATEGORIES.filter(k => CATEGORY_CONFIG[k].group === 'Academy');

// --- sessionStorage caching to avoid re-fetching on remount ---
const STREAK_CACHE_KEY = 'ehr:widget-streak';
const ACTIVITY_CACHE_KEY = 'ehr:widget-activity';
const CACHE_TTL = 300_000; // 5 minutes

interface CacheEntry<T> { data: T; timestamp: number; }

function readCache<T>(key: string): CacheEntry<T> | null {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch { return null; }
}

function writeCache<T>(key: string, data: T): void {
    try {
        sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch {}
}

const PersonalInsightsWidget: React.FC<PersonalInsightsWidgetProps> = ({ userId }) => {
    // Date range — default 30 days (lazy initializer avoids recomputing on every render)
    const [startDate, setStartDate] = useState<Date>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d;
    });
    const [endDate, setEndDate] = useState<Date>(() => new Date());
    const [selectedPreset, setSelectedPreset] = useState<PresetType | null>('30d');

    // Activity data
    const [activityData, setActivityData] = useState<PersonalActivityData | null>(null);
    const [loading, setLoading] = useState(true);

    // Request versioning — discard stale responses from rapid clicks
    const requestVersionRef = useRef(0);
    const hasLoadedRef = useRef(false);

    // Streak (from dashboard.ts, not date-filtered)
    const [streak, setStreak] = useState(0);

    // Category filter
    const [selectedCategories, setSelectedCategories] = useState<string[]>([...ALL_CATEGORIES]);
    const [filterOpen, setFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // Close filter dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setFilterOpen(false);
            }
        };
        if (filterOpen) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [filterOpen]);

    // Fetch streak on mount (lightweight query, not the full dashboard data)
    useEffect(() => {
        if (!userId) return;
        const cached = readCache<number>(STREAK_CACHE_KEY);
        if (cached) {
            setStreak(cached.data);
            if (Date.now() - cached.timestamp < CACHE_TTL) return;
        }
        fetchUserStreak(userId)
            .then(s => { setStreak(s); writeCache(STREAK_CACHE_KEY, s); })
            .catch(console.error);
    }, [userId]);

    // Fetch activity data when date range changes
    // Debounced (250ms) to prevent multiple concurrent server calls from rapid clicks
    // After first load, keeps old data visible (no loading flash) during transitions
    // On first load, checks sessionStorage cache to avoid refetching on remount
    useEffect(() => {
        if (!userId) return;
        const version = ++requestVersionRef.current;

        const doFetch = () => {
            if (!hasLoadedRef.current) {
                // On first load, check cache
                const cacheKey = `${ACTIVITY_CACHE_KEY}:${startDate.toISOString().split('T')[0]}:${endDate.toISOString().split('T')[0]}`;
                const cached = readCache<PersonalActivityData>(cacheKey);
                if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                    hasLoadedRef.current = true;
                    setActivityData(cached.data);
                    setLoading(false);
                    return;
                }
                setLoading(true);
            }
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];
            fetchPersonalActivityData(userId, { startDate: startStr, endDate: endStr, includeHeatmap: false })
                .then(data => {
                    if (version !== requestVersionRef.current) return;
                    hasLoadedRef.current = true;
                    setActivityData(data);
                    setLoading(false);
                    // Cache the result
                    const cacheKey = `${ACTIVITY_CACHE_KEY}:${startStr}:${endStr}`;
                    writeCache(cacheKey, data);
                })
                .catch(err => {
                    if (version !== requestVersionRef.current) return;
                    console.error('Failed to fetch activity data:', err);
                    setLoading(false);
                });
        };

        const timer = setTimeout(doFetch, 250);
        return () => clearTimeout(timer);
    }, [userId, startDate, endDate]);

    // Listen for cache invalidation events (e.g. after completing a course)
    useEffect(() => {
        const handler = () => {
            try {
                const keys = Object.keys(sessionStorage);
                keys.forEach(k => {
                    if (k.startsWith(ACTIVITY_CACHE_KEY) || k === STREAK_CACHE_KEY) {
                        sessionStorage.removeItem(k);
                    }
                });
            } catch {}
        };
        window.addEventListener('dashboard:invalidate', handler);
        return () => window.removeEventListener('dashboard:invalidate', handler);
    }, []);

    const handlePreset = (preset: PresetType) => {
        const now = new Date();
        let newStart: Date;
        switch (preset) {
            case '7d': newStart = new Date(now); newStart.setDate(now.getDate() - 7); break;
            case '30d': newStart = new Date(now); newStart.setDate(now.getDate() - 30); break;
            case '60d': newStart = new Date(now); newStart.setDate(now.getDate() - 60); break;
            case '90d': newStart = new Date(now); newStart.setDate(now.getDate() - 90); break;
            case 'month': newStart = new Date(now.getFullYear(), now.getMonth(), 1); break;
            case 'all': newStart = new Date(now); newStart.setFullYear(now.getFullYear() - 5); break;
            default: newStart = new Date(now); newStart.setDate(now.getDate() - 30);
        }
        setSelectedPreset(preset);
        setStartDate(newStart);
        setEndDate(now);
    };

    const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedPreset(null);
        setStartDate(new Date(e.target.value));
    };

    const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedPreset(null);
        setEndDate(new Date(e.target.value));
    };

    // Derive heatmap data from daily activity (eliminates separate heatmap queries)
    const heatmapData = useMemo(() => {
        if (!activityData?.dailyActivity) return [];
        return activityData.dailyActivity.map(day => ({
            date: day.date,
            count: day.logins + day.aiInteractions + day.collectionUsage +
                   day.notes + day.personalContext + day.customContent +
                   day.lessonsCompleted + day.coursesCompleted,
        }));
    }, [activityData]);

    // Dynamic heatmap header label
    const rangeLabel = useMemo(() => {
        if (selectedPreset === 'all') return 'All Time';
        if (selectedPreset === 'month') return 'This Month';
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return `${days} days`;
    }, [startDate, endDate, selectedPreset]);

    // Compute stat card values
    const stats = activityData?.stats;
    const totalActivities = stats
        ? stats.totalLogins + stats.totalAiInteractions + stats.totalCollectionUsage +
          stats.totalNotes + stats.totalPersonalContext + stats.totalCustomContent +
          stats.totalCoursesCompleted + stats.totalLessonsCompleted
        : 0;

    // Animated values
    const animTotal = useCountUp(totalActivities);
    const animTime = useCountUp(stats?.totalWatchTimeMinutes || 0);
    const animAI = useCountUp(stats?.totalAiInteractions || 0);
    const animCourses = useCountUp(stats?.totalCoursesCompleted || 0);
    const animCredits = useCountUp(Math.round(stats?.totalCreditsEarned || 0));
    const animStreak = useCountUp(streak);

    const getStatValue = (key: string): string => {
        switch (key) {
            case 'totalActivities': return animTotal.toString();
            case 'learningTime': return formatMinutes(animTime);
            case 'aiInteractions': return animAI.toString();
            case 'coursesCompleted': return animCourses.toString();
            case 'creditsEarned': return animCredits.toString();
            case 'streak': return animStreak.toString();
            default: return '0';
        }
    };

    // Category filter helpers
    const toggleCategory = (key: string) => {
        setSelectedCategories(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const selectAll = () => setSelectedCategories([...ALL_CATEGORIES]);
    const selectNone = () => setSelectedCategories([]);

    return (
        <div className="w-full animate-fade-in">
            {/* Date Range — single line: presets left, date inputs right */}
            <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
                <div className="flex flex-wrap gap-2">
                    {DATE_PRESETS.map((preset) => (
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
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={formatDateForInput(startDate)}
                        onChange={handleStartChange}
                        className="bg-black/20 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-brand-blue-light/50 transition-colors"
                    />
                    <span className="text-slate-500 text-xs">to</span>
                    <input
                        type="date"
                        value={formatDateForInput(endDate)}
                        onChange={handleEndChange}
                        className="bg-black/20 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-brand-blue-light/50 transition-colors"
                    />
                </div>
            </div>

            {/* Heatmap (left) + Stat Cards 3-col grid (right) — balanced row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* Heatmap */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 hover:bg-white/[0.04] hover:border-white/[0.08] transition-[background-color,border-color] duration-300">
                    <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                        <Flame size={14} className="text-orange-400" />
                        Activity
                        <span className="text-[10px] text-slate-600 font-normal ml-1">{rangeLabel}</span>
                    </h3>
                    {activityData ? (
                        <ActivityHeatmap
                            activityData={heatmapData}
                            startDate={formatDateForInput(startDate)}
                            endDate={formatDateForInput(endDate)}
                        />
                    ) : loading ? (
                        <div className="h-[130px] flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white/20 border-t-brand-blue-light rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="h-[130px] flex items-center justify-center text-xs text-slate-500">
                            No activity data available
                        </div>
                    )}
                </div>

                {/* Stat Cards — 3 columns, stretch to match heatmap height */}
                <div className="grid grid-cols-3 gap-2.5 auto-rows-fr">
                    {STAT_CARDS.map((card) => (
                        <div
                            key={card.key}
                            className="bg-white/[0.03] rounded-xl p-3 hover:bg-white/[0.06] transition-[background-color,transform] duration-300 hover:scale-[1.03] flex flex-col items-center justify-center text-center cursor-default"
                        >
                            <div className={`text-xl font-bold ${card.color} leading-none`}>
                                {loading ? '—' : getStatValue(card.key)}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mt-1.5">
                                {card.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Full-Width Activity Trends Chart */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 hover:bg-white/[0.04] hover:border-white/[0.08] transition-[background-color,border-color] duration-300">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-300">
                        Activity Trends
                    </h3>

                    {/* Multi-select category filter */}
                    <div className="relative" ref={filterRef}>
                        <button
                            onClick={() => setFilterOpen(!filterOpen)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            {selectedCategories.length} of {ALL_CATEGORIES.length} categories
                            <ChevronDown size={12} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {filterOpen && (
                            <div className="absolute right-0 top-full mt-2 z-50 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl w-64 overflow-hidden">
                                {/* Actions */}
                                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Filter Categories</span>
                                    <div className="flex gap-2">
                                        <button onClick={selectAll} className="text-[10px] text-brand-blue-light hover:underline">All</button>
                                        <button onClick={selectNone} className="text-[10px] text-slate-500 hover:text-white hover:underline">None</button>
                                    </div>
                                </div>

                                <div className="max-h-72 overflow-y-auto p-2">
                                    {/* Platform group */}
                                    <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold px-2 pt-1 pb-1">Platform</p>
                                    {platformCategories.map(key => (
                                        <button
                                            key={key}
                                            onClick={() => toggleCategory(key)}
                                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs hover:bg-white/5 transition-colors"
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                                selectedCategories.includes(key)
                                                    ? 'bg-brand-blue-light/20 border-brand-blue-light/50'
                                                    : 'border-white/20 bg-transparent'
                                            }`}>
                                                {selectedCategories.includes(key) && <Check size={10} className="text-brand-blue-light" />}
                                            </div>
                                            <div
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: CATEGORY_CONFIG[key].color }}
                                            />
                                            <span className="text-slate-300">{CATEGORY_CONFIG[key].label}</span>
                                        </button>
                                    ))}

                                    {/* Academy group */}
                                    <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold px-2 pt-3 pb-1">Academy</p>
                                    {academyCategories.map(key => (
                                        <button
                                            key={key}
                                            onClick={() => toggleCategory(key)}
                                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs hover:bg-white/5 transition-colors"
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                                selectedCategories.includes(key)
                                                    ? 'bg-brand-blue-light/20 border-brand-blue-light/50'
                                                    : 'border-white/20 bg-transparent'
                                            }`}>
                                                {selectedCategories.includes(key) && <Check size={10} className="text-brand-blue-light" />}
                                            </div>
                                            <div
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: CATEGORY_CONFIG[key].color }}
                                            />
                                            <span className="text-slate-300">{CATEGORY_CONFIG[key].label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {activityData && activityData.dailyActivity.length > 0 ? (
                    <PersonalActivityTrendsChart
                        data={activityData.dailyActivity}
                        selectedCategories={selectedCategories}
                    />
                ) : (
                    <div className="h-[280px] flex items-center justify-center">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-brand-blue-light rounded-full animate-spin" />
                        ) : (
                            <p className="text-sm text-slate-600">No activity data for this period</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PersonalInsightsWidget;
