import React, { useState, useEffect } from 'react';
import {
    Flame,
    Clock,
    Award,
    TrendingUp,
    ArrowRight,
    Play,
    Sparkles,
    BookOpen,
    Zap,
    MessageSquare,
    Layers,
    X,
    Loader2,
    ChevronRight
} from 'lucide-react';
import { Course } from '@/types';
import { fetchDashboardData, DashboardStats } from '@/lib/dashboard';
import { PromptSuggestion, fetchPromptSuggestions } from '@/lib/prompts';
import { useRouter } from 'next/navigation';
import { getRecommendedCourses } from '@/app/actions/recommendations';
import UniversalCard from '../cards/UniversalCard';

interface UserDashboardV3Props {
    user: any;
    courses: Course[];
    onNavigate: (collectionId: string) => void;
    onStartCourse: (courseId: number) => void;
    onOpenAIPanel: () => void;
    onSetAIPrompt: (prompt: string) => void;
    onSetPrometheusPagePrompt: (prompt: string) => void;
    onAddCourse: (course: Course) => void;
}

const UserDashboardV3: React.FC<UserDashboardV3Props> = ({
    user,
    courses,
    onNavigate,
    onStartCourse,
    onOpenAIPanel,
    onSetAIPrompt,
    onSetPrometheusPagePrompt,
    onAddCourse
}) => {
    // ... existing state ...
    const [aiPrompt, setAiPrompt] = useState('');
    const [stats, setStats] = useState<DashboardStats>({
        totalTime: '0h 0m',
        coursesCompleted: 0,
        creditsEarned: 0,
        streak: 0
    });
    const [loading, setLoading] = useState(true);
    const [trendingIds, setTrendingIds] = useState<number[]>([]);
    const [recertifications, setRecertifications] = useState<any[]>([]);
    const [userProgress, setUserProgress] = useState<Record<number, { progress: number, lastAccessed: string }>>({});
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [heroPrompts, setHeroPrompts] = useState<PromptSuggestion[]>([]);
    const [panelPrompts, setPanelPrompts] = useState<PromptSuggestion[]>([]);

    // Tab State - Recommended is now first/default
    const [activeTab, setActiveTab] = useState<'trending' | 'recommended'>('recommended');
    const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const loadData = async () => {
            if (user?.id) {
                try {
                    const dashboardData = await fetchDashboardData(user.id);
                    setStats(dashboardData.stats);
                    setTrendingIds(dashboardData.trendingCourseIds);
                    setRecertifications(dashboardData.recentCertificates || []);
                    setUserProgress(dashboardData.userProgress);
                    setLoading(false);
                } catch (error) {
                    console.error("Failed to load dashboard data", error);
                    setLoading(false);
                }
            }
        };
        loadData();
    }, [user?.id]);

    useEffect(() => {
        const loadPrompts = async () => {
            const prompts = await fetchPromptSuggestions('user_dashboard');
            setHeroPrompts(prompts.slice(0, 4));
            setPanelPrompts(prompts.slice(4));
        };
        loadPrompts();
    }, []);

    useEffect(() => {
        if (activeTab === 'recommended' && recommendedCourses.length === 0 && user?.id) {
            const loadRecommendations = async () => {
                setLoadingRecommendations(true);
                try {
                    const recs = await getRecommendedCourses(user.id);
                    setRecommendedCourses(recs);
                } catch (error) {
                    console.error("Failed to load recommendations", error);
                } finally {
                    setLoadingRecommendations(false);
                }
            };
            loadRecommendations();
        }
    }, [activeTab, user?.id, recommendedCourses.length]);

    const inProgressCourses = courses
        .filter(c => userProgress[c.id])
        .map(c => ({
            ...c,
            progress: userProgress[c.id].progress
        }))
        .sort((a, b) => new Date(userProgress[b.id].lastAccessed).getTime() - new Date(userProgress[a.id].lastAccessed).getTime())
        .slice(0, 3);

    const trendingCourses = courses.filter(c => trendingIds.includes(c.id));

    const handleAiSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (aiPrompt.trim()) {
            onSetPrometheusPagePrompt(aiPrompt);
            setAiPrompt('');
        }
    };

    const handlePromptClick = (prompt: string) => {
        onSetPrometheusPagePrompt(prompt);
    };

    return (
        <div className="w-full h-full overflow-y-auto custom-scrollbar pb-32 relative">
            {/* Scrollable content - wider container for more cards per row */}
            {/* 50px padding from top of dashboard area */}
            <div className="max-w-[1800px] mx-auto px-8 pt-[50px]">

                {/* ══════════════════════════════════════════════════════════════════
                    PROMETHEUS AI SECTION - Compact Two-Column Layout (Centered)
                ══════════════════════════════════════════════════════════════════ */}
                <div className="relative z-10 mb-12 flex justify-center">
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center lg:items-stretch">
                        {/* Left Column: Logo & Tagline - Compact vertical layout */}
                        <div className="flex flex-col items-center justify-center group cursor-default lg:w-48 flex-shrink-0">
                            <div className="relative mb-2 transition-transform duration-700 group-hover:scale-105">
                                <div className="absolute inset-0 bg-brand-orange/20 blur-[30px] rounded-full animate-pulse-slow" />
                                <img
                                    src="/images/logos/EnhancedHR-logo-mark-flame.png"
                                    alt="Prometheus AI"
                                    className="w-20 h-20 lg:w-24 lg:h-24 relative z-10 drop-shadow-[0_0_25px_rgba(255,147,0,0.4)] object-contain"
                                />
                            </div>
                            <h1 className="text-lg font-extralight text-white tracking-tight mb-0.5 text-center whitespace-nowrap">
                                Prometheus <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-amber-400">AI</span>
                            </h1>
                            <p className="text-xs text-slate-500 font-light text-center">
                                Your Personal Learning Assistant
                            </p>
                        </div>

                        {/* Right Column: Prompt Cards (2x2 grid) + Input Box */}
                        <div className="flex-1 w-full max-w-3xl">
                            {/* 2x2 Prompt Grid + More Prompts Link */}
                            <div className="mb-3">
                                <div className="flex justify-end mb-2">
                                    <button
                                        onClick={() => setIsDrawerOpen(true)}
                                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-brand-blue-light transition-colors"
                                    >
                                        <Sparkles size={10} />
                                        <span>more prompts</span>
                                        <ChevronRight size={10} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {[
                                        {
                                            id: 'cap-1',
                                            title: 'Difficult Conversations',
                                            description: 'Role-play challenging discussions',
                                            prompt: 'I need to have a difficult conversation with an employee who is underperforming. Can you role-play this with me?',
                                            accent: 'from-blue-500/20 to-transparent'
                                        },
                                        {
                                            id: 'cap-2',
                                            title: 'Policy & Compliance',
                                            description: 'Draft policies and communications',
                                            prompt: 'I need to draft an email announcing a new Return to Office policy. Help me write a balanced message.',
                                            accent: 'from-emerald-500/20 to-transparent'
                                        },
                                        {
                                            id: 'cap-3',
                                            title: 'Strategic Analysis',
                                            description: 'Analyze leadership and decisions',
                                            prompt: 'Analyze my leadership style based on a recent situation I will describe.',
                                            accent: 'from-purple-500/20 to-transparent'
                                        },
                                        {
                                            id: 'cap-4',
                                            title: 'Creative Solutions',
                                            description: 'Brainstorm ideas and initiatives',
                                            prompt: 'I want to launch a wellness initiative for a remote team. Give me 5 creative, low-cost ideas.',
                                            accent: 'from-amber-500/20 to-transparent'
                                        }
                                    ].map((card) => (
                                        <button
                                            key={card.id}
                                            onClick={() => handlePromptClick(card.prompt)}
                                            className="group relative bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] rounded-lg px-3 py-2 text-left transition-all duration-300"
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-500`} />
                                            <div className="relative z-10 flex items-center justify-between gap-2">
                                                <div className="min-w-0">
                                                    <h3 className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors truncate">{card.title}</h3>
                                                    <p className="text-[10px] text-slate-400 group-hover:text-slate-300 transition-colors truncate">{card.description}</p>
                                                </div>
                                                <ChevronRight size={12} className="text-slate-500 group-hover:text-slate-400 flex-shrink-0" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Input Box */}
                            <div className="relative">
                                <div className="absolute -inset-px bg-gradient-to-r from-brand-blue-light/20 via-brand-orange/20 to-brand-blue-light/20 opacity-0 focus-within:opacity-100 blur-xl transition-opacity duration-500 rounded-xl" />
                                <div className="relative bg-white/[0.03] border border-white/[0.08] rounded-xl flex items-center p-1.5">
                                    <div className="p-2.5 text-brand-orange/60">
                                        <Flame size={18} />
                                    </div>
                                    <form onSubmit={handleAiSubmit} className="flex-1 flex">
                                        <input
                                            type="text"
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            placeholder="Ask anything..."
                                            className="flex-1 bg-transparent border-none outline-none text-base text-white placeholder-slate-600 px-2 font-light h-11"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!aiPrompt.trim()}
                                            className={`
                                                p-2.5 rounded-lg transition-all duration-300 mr-1
                                                ${aiPrompt.trim()
                                                    ? 'bg-brand-blue-light text-brand-black hover:bg-white'
                                                    : 'bg-white/[0.03] text-slate-700 cursor-not-allowed'}
                                            `}
                                        >
                                            <ArrowRight size={18} />
                                        </button>
                                    </form>
                                </div>
                            </div>
                            {/* AI Disclaimer */}
                            <p className="text-center text-[10px] text-slate-600/60 mt-2">AI can make mistakes. Verify important information.</p>
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════════════
                    TABBED LEARNING SECTION - Trending / Recommended
                ══════════════════════════════════════════════════════════════════ */}
                <div className="mb-14">
                    {/* Tab Navigation - Recommended is now first */}
                    <div className="flex items-center gap-1 mb-6">
                        <button
                            onClick={() => setActiveTab('recommended')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'recommended'
                                ? 'bg-white/10 text-white'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <Sparkles size={14} />
                                Recommended
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('trending')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'trending'
                                ? 'bg-white/10 text-white'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <TrendingUp size={14} />
                                Trending Now
                            </span>
                        </button>
                    </div>

                    {/* Course Cards - Horizontal Scroll */}
                    <div className="min-h-[220px]">
                        {activeTab === 'trending' ? (
                            trendingCourses.length > 0 ? (
                                <div className="flex overflow-x-auto pb-4 gap-6 snap-x snap-mandatory custom-scrollbar animate-fade-in">
                                    {trendingCourses.slice(0, 8).map((course, idx) => (
                                        <div key={course.id} className="min-w-[340px] w-[340px] snap-start">
                                            <UniversalCard
                                                type="COURSE"
                                                title={course.title}
                                                subtitle={course.author}
                                                description={course.description}
                                                imageUrl={course.image}
                                                meta={course.duration}
                                                categories={[`#${idx + 1} TRENDING`]}
                                                credits={{
                                                    shrm: course.badges?.includes('SHRM'),
                                                    hrci: course.badges?.includes('HRCI')
                                                }}
                                                actionLabel="VIEW"
                                                rating={course.rating}
                                                onAction={() => onStartCourse(course.id)}
                                                onAdd={() => onAddCourse(course)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-slate-600 py-12">No trending courses available</div>
                            )
                        ) : (
                            loadingRecommendations ? (
                                <div className="flex justify-center py-16">
                                    <Loader2 size={24} className="animate-spin text-brand-blue-light" />
                                </div>
                            ) : recommendedCourses.length > 0 ? (
                                <div className="flex overflow-x-auto pb-4 gap-6 snap-x snap-mandatory custom-scrollbar animate-fade-in">
                                    {recommendedCourses.slice(0, 8).map((course) => (
                                        <div key={course.id} className="min-w-[340px] w-[340px] snap-start">
                                            <UniversalCard
                                                type="COURSE"
                                                title={course.title}
                                                subtitle={course.author}
                                                description={course.description}
                                                imageUrl={course.image}
                                                meta={course.duration}
                                                categories={["FOR YOU"]}
                                                credits={{
                                                    shrm: course.badges?.includes('SHRM'),
                                                    hrci: course.badges?.includes('HRCI')
                                                }}
                                                actionLabel="VIEW"
                                                rating={course.rating}
                                                onAction={() => onStartCourse(course.id)}
                                                onAdd={() => onAddCourse(course)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-slate-600 py-12">
                                    Unable to generate recommendations
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════════════
                    CONTINUE LEARNING SECTION
                ══════════════════════════════════════════════════════════════════ */}
                <div className="mb-14">
                    <div className="flex items-center gap-2 mb-5">
                        <Play size={16} className="text-brand-blue-light" />
                        <h2 className="text-lg font-light text-white">Continue Learning</h2>
                    </div>

                    {inProgressCourses.length > 0 ? (
                        <div className="flex overflow-x-auto pb-4 gap-6 snap-x snap-mandatory custom-scrollbar">
                            {inProgressCourses.map(course => (
                                <div key={course.id} className="min-w-[340px] w-[340px] snap-start">
                                    <UniversalCard
                                        type="COURSE"
                                        title={course.title}
                                        subtitle={course.author}
                                        description={course.description}
                                        imageUrl={course.image}
                                        meta={`${course.progress}% Complete`}
                                        categories={["IN PROGRESS"]}
                                        actionLabel="RESUME"
                                        rating={course.rating}
                                        onAction={() => onStartCourse(course.id)}
                                        onAdd={() => onAddCourse(course)}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-10 flex flex-col items-center text-center">
                            <div className="flex gap-3 mb-6 opacity-20">
                                <div className="w-24 h-32 rounded-lg bg-white/10 border border-white/10 transform -rotate-6" />
                                <div className="w-24 h-32 rounded-lg bg-white/10 border border-white/10" />
                                <div className="w-24 h-32 rounded-lg bg-white/10 border border-white/10 transform rotate-6" />
                            </div>
                            <h3 className="text-base font-medium text-slate-300 mb-2">Start Your Journey</h3>
                            <p className="text-sm text-slate-600 mb-5 max-w-sm">Browse the Academy to find expert-led courses tailored for HR professionals.</p>
                            <button
                                onClick={() => onNavigate('academy')}
                                className="px-5 py-2 bg-brand-blue-light text-brand-black rounded-lg font-medium hover:bg-white transition-colors text-sm"
                            >
                                Explore Academy
                            </button>
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════════════
                    RECERTIFICATION HUB
                ══════════════════════════════════════════════════════════════════ */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-5">
                        <Award size={16} className="text-brand-orange" />
                        <h2 className="text-lg font-light text-white">Recertification Hub</h2>
                    </div>

                    {recertifications.length > 0 ? (
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] text-slate-600 uppercase tracking-wider border-b border-white/5">
                                        <th className="py-3 px-4 font-medium">Certificate</th>
                                        <th className="py-3 px-4 font-medium">Date</th>
                                        <th className="py-3 px-4 font-medium">Credits</th>
                                        <th className="py-3 px-4 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {recertifications.map((cert) => (
                                        <tr key={cert.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                            <td className="py-3 px-4 text-slate-300">{cert.course_title || 'Course Completion'}</td>
                                            <td className="py-3 px-4 text-slate-500">{new Date(cert.issued_at).toLocaleDateString()}</td>
                                            <td className="py-3 px-4 text-brand-orange font-medium">{cert.credits || 0} PDCs</td>
                                            <td className="py-3 px-4 text-right">
                                                <button className="text-xs text-brand-blue-light hover:text-white transition-colors">Download</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-slate-300 mb-1">Track Your SHRM & HRCI Credits</h3>
                                <p className="text-xs text-slate-600 mb-3 max-w-md">
                                    Earn Professional Development Credits automatically as you complete courses.
                                </p>
                                <div className="flex gap-2">
                                    {['SHRM-CP', 'SHRM-SCP', 'PHR', 'SPHR'].map(cert => (
                                        <span key={cert} className="px-2 py-0.5 bg-white/[0.03] rounded text-[10px] text-slate-600 border border-white/[0.05]">{cert}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-30">
                                <Layers size={40} className="text-brand-orange" />
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* ══════════════════════════════════════════════════════════════════
                PROMPTS DRAWER
            ══════════════════════════════════════════════════════════════════ */}
            <div
                className={`
                    fixed top-[60px] left-0 w-full z-[100]
                    transition-transform duration-500 ease-out
                    ${isDrawerOpen ? 'translate-y-0' : '-translate-y-full'}
                `}
            >
                <div className="bg-[#0a0d12]/98 backdrop-blur-2xl border-b border-white/5 shadow-2xl pb-8">
                    <div className="max-w-6xl mx-auto px-8 pt-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-light text-white flex items-center gap-2">
                                <Sparkles size={16} className="text-brand-blue-light" />
                                Prompt Library
                            </h2>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                            {panelPrompts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        handlePromptClick(p.prompt);
                                        setIsDrawerOpen(false);
                                    }}
                                    className="text-left p-4 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.03] hover:border-white/[0.08] transition-all group"
                                >
                                    <div className="flex items-center gap-2 text-slate-600 group-hover:text-brand-blue-light mb-2 transition-colors">
                                        <MessageSquare size={12} />
                                        <span className="text-[10px] uppercase tracking-wider">{p.category}</span>
                                    </div>
                                    <div className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors line-clamp-2">
                                        {p.label}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="w-full h-screen bg-black/60 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
            </div>

        </div>
    );
};

export default UserDashboardV3;
