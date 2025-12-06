import React, { useState, useEffect } from 'react';
import {
    Flame,
    Clock,
    Award,
    TrendingUp,
    ArrowRight,
    Play,
    Search,
    Sparkles,
    BookOpen,
    Zap,
    ChevronDown,
    ChevronUp,
    MessageSquare,
    Layers,
    Shield,
    Brain,
    Lightbulb,
    X,
    Loader2
} from 'lucide-react';
import { Course } from '@/types';
import CardStack from '../CardStack'; // Reusing the card component
import { fetchDashboardData, DashboardStats } from '@/lib/dashboard';
import { PromptSuggestion, fetchPromptSuggestions } from '@/lib/prompts';
import { useRouter } from 'next/navigation';
import { getRecommendedCourses } from '@/app/actions/recommendations';

interface UserDashboardV2Props {
    user: any; // Contains profile data now
    courses: Course[];
    onNavigate: (collectionId: string) => void;
    onStartCourse: (courseId: number) => void;
    onOpenAIPanel: () => void;
    onSetAIPrompt: (prompt: string) => void;
    onSetPrometheusPagePrompt: (prompt: string) => void;
}

const UserDashboardV2: React.FC<UserDashboardV2Props> = ({ user, courses, onNavigate, onStartCourse, onOpenAIPanel, onSetAIPrompt, onSetPrometheusPagePrompt }) => {
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
    const [isPromptPanelOpen, setIsPromptPanelOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [heroPrompts, setHeroPrompts] = useState<PromptSuggestion[]>([]);
    const [panelPrompts, setPanelPrompts] = useState<PromptSuggestion[]>([]);

    // New State for Tabs
    const [activeTab, setActiveTab] = useState<'trending' | 'recommended'>('trending');
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

    // Load Prompts
    useEffect(() => {
        const loadPrompts = async () => {
            const prompts = await fetchPromptSuggestions('user_dashboard');
            setHeroPrompts(prompts.slice(0, 3));
            setPanelPrompts(prompts.slice(3));
        };
        loadPrompts();
    }, []);

    // Load Recommendations when tab changes to recommended
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

    // Filter for "In Progress" courses based on real user data
    const inProgressCourses = courses
        .filter(c => userProgress[c.id])
        .map(c => ({
            ...c,
            progress: userProgress[c.id].progress
        }))
        .sort((a, b) => new Date(userProgress[b.id].lastAccessed).getTime() - new Date(userProgress[a.id].lastAccessed).getTime())
        .slice(0, 3);

    // Trending Courses
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

            <div className="max-w-7xl mx-auto px-8 pt-12">

                {/* --- STATS GRID (Moved to Top, Container-less) --- */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                    {/* Stat 1 */}
                    <div className="flex flex-col items-center text-center group">
                        <div className="mb-2 p-3 bg-brand-blue-light/10 rounded-full text-brand-blue-light group-hover:scale-110 transition-transform">
                            <Clock size={24} />
                        </div>
                        <div className="text-3xl font-thin text-white mb-1 tracking-tight">{loading ? '...' : stats.totalTime}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Time</div>
                    </div>

                    {/* Stat 2 */}
                    <div className="flex flex-col items-center text-center group">
                        <div className="mb-2 p-3 bg-brand-orange/10 rounded-full text-brand-orange group-hover:scale-110 transition-transform">
                            <Award size={24} />
                        </div>
                        <div className="text-3xl font-thin text-white mb-1 tracking-tight">{loading ? '...' : stats.creditsEarned}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Credits Earned</div>
                    </div>

                    {/* Stat 3 */}
                    <div className="flex flex-col items-center text-center group">
                        <div className="mb-2 p-3 bg-purple-500/10 rounded-full text-purple-400 group-hover:scale-110 transition-transform">
                            <BookOpen size={24} />
                        </div>
                        <div className="text-3xl font-thin text-white mb-1 tracking-tight">{loading ? '...' : stats.coursesCompleted}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Courses Completed</div>
                    </div>

                    {/* Stat 4 */}
                    <div className="flex flex-col items-center text-center group">
                        <div className="mb-2 p-3 bg-emerald-500/10 rounded-full text-emerald-400 group-hover:scale-110 transition-transform">
                            <Zap size={24} />
                        </div>
                        <div className="text-3xl font-thin text-white mb-1 tracking-tight">{loading ? '...' : stats.streak} Days</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Streak</div>
                    </div>
                </div>

                {/* --- PROMETHEUS HERO SECTION (Tightened) --- */}
                <div className="flex flex-col items-center relative z-10 mb-20">

                    {/* Logo & Title */}
                    <div className="flex flex-col items-center mb-8 animate-float group cursor-default">
                        <div className="relative mb-6 transition-transform duration-700 group-hover:scale-105">
                            <div className="absolute inset-0 bg-brand-blue-light/20 blur-[50px] rounded-full animate-pulse-slow group-hover:bg-brand-blue-light/40 transition-colors duration-500"></div>
                            {/* Reduced flame size by 15% (w-56 -> w-48) */}
                            <img
                                src="/images/logos/EnhancedHR-logo-mark-flame.png"
                                alt="Prometheus AI"
                                className="w-48 h-48 relative z-10 drop-shadow-[0_0_40px_rgba(120,192,240,0.5)] object-contain transition-all duration-500 group-hover:drop-shadow-[0_0_70px_rgba(59,130,246,0.8)]"
                            />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-thin text-white tracking-tight text-center mb-2">
                            Prometheus <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-yellow">AI</span>
                        </h1>
                        <p className="text-base text-slate-400 font-light tracking-wide">Your personal learning assistant.</p>
                    </div>

                    {/* Capability Cards Grid (Prompt Containers) */}
                    <div className="w-full max-w-4xl relative">

                        {/* View More Prompts Link (Aligned Right above containers) */}
                        <div className="flex justify-end mb-2">
                            <button
                                onClick={() => setIsDrawerOpen(true)}
                                className="flex items-center gap-1.5 text-xs font-medium text-brand-blue-light hover:text-white transition-colors group"
                            >
                                <Sparkles size={12} />
                                View more prompts
                                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {[
                                {
                                    id: 'cap-1',
                                    title: 'Difficult Conversations',
                                    description: 'Role-play and prepare for challenging discussions.',
                                    prompt: 'I need to have a difficult conversation with an employee who is underperforming. Can you role-play this with me? You act as the employee (defensive but open to feedback), and I will be the manager. Start by asking me for the context of the situation.',
                                    color: 'text-blue-400'
                                },
                                {
                                    id: 'cap-2',
                                    title: 'Policy & Compliance',
                                    description: 'Draft clear, empathetic policies and ensure compliance.',
                                    prompt: 'I need to draft an email announcing a new "Return to Office" policy (3 days a week). The tone should be empathetic but firm, emphasizing collaboration while acknowledging the shift. Please draft 3 variations: one direct, one softer, and one focusing purely on the benefits.',
                                    color: 'text-emerald-400'
                                },
                                {
                                    id: 'cap-3',
                                    title: 'Strategic Analysis',
                                    description: 'Analyze leadership styles and organizational trends.',
                                    prompt: 'I want to analyze my leadership style based on a recent situation. I will describe a scenario and how I handled it, and I want you to critique it using the Situational Leadership II framework. Ready?',
                                    color: 'text-purple-400'
                                },
                                {
                                    id: 'cap-4',
                                    title: 'Creative Solutions',
                                    description: 'Brainstorm wellness initiatives and team building ideas.',
                                    prompt: 'I want to launch a wellness initiative for a remote-first team. It needs to be low-cost but high-impact. Give me 5 creative ideas that go beyond just "yoga classes".',
                                    color: 'text-amber-400'
                                }
                            ].map((card, idx) => (
                                <button
                                    key={card.id}
                                    onClick={() => handlePromptClick(card.prompt)}
                                    className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] overflow-hidden"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="relative z-10">
                                        <h3 className="text-base font-bold text-white mb-1 group-hover:text-brand-blue-light transition-colors">{card.title}</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{card.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Input Area (Pulled up against containers) */}
                        <div className="relative group/input">
                            {/* Glow Effect */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-blue via-brand-orange to-brand-blue opacity-20 group-focus-within/input:opacity-100 blur-xl transition-opacity duration-700 rounded-2xl"></div>

                            <div className="relative bg-[#0f172a]/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex items-center p-2 overflow-hidden">
                                <button
                                    onClick={() => setIsPromptPanelOpen(!isPromptPanelOpen)}
                                    className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors mr-2"
                                    title="More Prompts"
                                >
                                    <Flame size={20} className="text-brand-orange" />
                                </button>

                                <form onSubmit={handleAiSubmit} className="flex-1 flex">
                                    <input
                                        type="text"
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="Ask Prometheus anything..."
                                        className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-slate-500 px-2 font-light h-12"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!aiPrompt.trim()}
                                        className={`
                                            p-3 rounded-xl transition-all duration-300 flex items-center justify-center ml-2
                                            ${aiPrompt.trim()
                                                ? 'bg-brand-blue-light text-brand-black hover:bg-white hover:scale-105 shadow-[0_0_20px_rgba(120,192,240,0.5)]'
                                                : 'bg-white/5 text-slate-600 cursor-not-allowed'}
                                        `}
                                    >
                                        <ArrowRight size={20} />
                                    </button>
                                </form>
                            </div>

                            {/* Suggestion Panel (Slide Down) */}
                            <div className={`
                                absolute top-full left-0 w-full mt-4 z-50
                                transition-all duration-500 ease-in-out origin-top
                                ${isPromptPanelOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'}
                            `}>
                                <div className="bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {panelPrompts.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => handlePromptClick(p.prompt)}
                                            className="text-left p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group/prompt flex items-start gap-3"
                                        >
                                            <div className="mt-1 text-slate-500 group-hover/prompt:text-brand-orange transition-colors">
                                                <MessageSquare size={14} />
                                            </div>
                                            <div>
                                                <div className="text-sm text-slate-200 group-hover/prompt:text-white font-medium">{p.label}</div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">{p.category}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* --- TRENDING & RECOMMENDED (Tabbed Section) --- */}
                <div className="mb-16">
                    <div className="flex items-center gap-6 mb-8 border-b border-white/10 pb-4">
                        <button
                            onClick={() => setActiveTab('trending')}
                            className={`text-2xl font-light transition-colors ${activeTab === 'trending' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Trending Now
                        </button>
                        <button
                            onClick={() => setActiveTab('recommended')}
                            className={`text-2xl font-light transition-colors ${activeTab === 'recommended' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Recommended Learning
                        </button>
                    </div>

                    <div className="min-h-[300px]">
                        {activeTab === 'trending' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                                {trendingCourses.length > 0 ? trendingCourses.map((course, idx) => (
                                    <div key={course.id} className="group cursor-pointer" onClick={() => onStartCourse(course.id)}>
                                        <div className="relative aspect-video rounded-xl overflow-hidden mb-3 border border-white/10 group-hover:border-brand-red/50 transition-colors">
                                            <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white flex items-center gap-1">
                                                <TrendingUp size={10} className="text-brand-red" /> #{idx + 1}
                                            </div>
                                        </div>
                                        <h3 className="text-sm font-bold text-white mb-1 line-clamp-1 group-hover:text-brand-red transition-colors">{course.title}</h3>
                                        <p className="text-xs text-slate-500 line-clamp-1">{course.author}</p>
                                    </div>
                                )) : (
                                    <div className="col-span-4 text-center text-slate-500 py-8">No trending data available yet.</div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                                {loadingRecommendations ? (
                                    <div className="col-span-4 flex justify-center py-20">
                                        <Loader2 size={32} className="animate-spin text-brand-blue-light" />
                                    </div>
                                ) : recommendedCourses.length > 0 ? (
                                    recommendedCourses.map((course) => (
                                        <div key={course.id} className="group cursor-pointer" onClick={() => onStartCourse(course.id)}>
                                            <div className="relative aspect-video rounded-xl overflow-hidden mb-3 border border-white/10 group-hover:border-brand-blue-light/50 transition-colors">
                                                <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white flex items-center gap-1">
                                                    <Sparkles size={10} className="text-brand-blue-light" /> Recommended
                                                </div>
                                            </div>
                                            <h3 className="text-sm font-bold text-white mb-1 line-clamp-1 group-hover:text-brand-blue-light transition-colors">{course.title}</h3>
                                            <p className="text-xs text-slate-500 line-clamp-1">{course.author}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-4 text-center text-slate-500 py-8">
                                        Unable to generate recommendations at this time.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- CONTINUE LEARNING (Moved below Trending) --- */}
                <div className="mb-16">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-blue-light/10 rounded-lg text-brand-blue-light">
                                <Play size={20} />
                            </div>
                            <h2 className="text-2xl font-light text-white">Continue Learning</h2>
                        </div>
                    </div>

                    {inProgressCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {inProgressCourses.map(course => (
                                <div key={course.id} className="group relative" onClick={() => onStartCourse(course.id)}>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-blue-light to-brand-purple opacity-0 group-hover:opacity-50 blur transition duration-500 rounded-2xl"></div>
                                    <div className="relative bg-[#0A0D12] border border-white/10 rounded-2xl p-4 flex gap-4 cursor-pointer hover:bg-white/5 transition-colors">
                                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 relative">
                                            <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Play size={24} className="text-white fill-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <h3 className="text-sm font-bold text-white mb-1 line-clamp-1 group-hover:text-brand-blue-light transition-colors">{course.title}</h3>
                                            <p className="text-xs text-slate-400 mb-3 line-clamp-1">{course.author}</p>

                                            {/* Progress Bar */}
                                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-1">
                                                <div className="bg-brand-blue-light h-full rounded-full" style={{ width: `${course.progress}%` }}></div>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-slate-500">
                                                <span>{course.progress}% Complete</span>
                                                <span>{course.duration} left</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Empty State Vector Graphic
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 flex flex-col items-center text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-10"></div>

                            {/* Vector Representation of Cards */}
                            <div className="flex gap-4 mb-8 opacity-30 scale-90 group-hover:scale-95 transition-transform duration-500">
                                <div className="w-32 h-40 rounded-xl bg-white/10 border border-white/20 transform -rotate-6"></div>
                                <div className="w-32 h-40 rounded-xl bg-white/10 border border-white/20 transform rotate-0 -mt-4"></div>
                                <div className="w-32 h-40 rounded-xl bg-white/10 border border-white/20 transform rotate-6"></div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 relative z-10">Your Learning Journey Starts Here</h3>
                            <p className="text-slate-400 max-w-md mb-6 relative z-10">
                                You haven't started any courses yet. Browse the Academy to find expert-led courses tailored for HR professionals.
                            </p>
                            <button onClick={() => onNavigate('academy')} className="relative z-10 px-6 py-2.5 bg-brand-blue-light text-brand-black rounded-xl font-bold hover:bg-white transition-colors shadow-[0_0_20px_rgba(120,192,240,0.3)]">
                                Explore the Academy
                            </button>
                        </div>
                    )}
                </div>

                {/* --- RECERTIFICATION HUB --- */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-brand-orange/10 rounded-lg text-brand-orange">
                            <Award size={20} />
                        </div>
                        <h2 className="text-2xl font-light text-white">Recertification Hub</h2>
                    </div>

                    {recertifications.length > 0 ? (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/5">
                                        <th className="pb-3 font-medium">Certificate</th>
                                        <th className="pb-3 font-medium">Date Earned</th>
                                        <th className="pb-3 font-medium">Credits</th>
                                        <th className="pb-3 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {recertifications.map((cert) => (
                                        <tr key={cert.id} className="group border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                            <td className="py-4 text-white font-medium">{cert.course_title || 'Course Completion'}</td>
                                            <td className="py-4 text-slate-400">{new Date(cert.issued_at).toLocaleDateString()}</td>
                                            <td className="py-4 text-brand-orange font-bold">{cert.credits || 0} PDCs</td>
                                            <td className="py-4 text-right">
                                                <button className="text-xs text-brand-blue-light hover:text-white underline">Download</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        // Empty State for Recertification
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex items-center justify-between relative overflow-hidden">
                            <div className="relative z-10 max-w-lg">
                                <h3 className="text-lg font-bold text-white mb-2">Track Your SHRM & HRCI Credits</h3>
                                <p className="text-sm text-slate-400 mb-4">
                                    Earn Professional Development Credits (PDCs) automatically as you complete courses.
                                    Your certificates will appear here, ready for download.
                                </p>
                                <div className="flex gap-2">
                                    <div className="px-3 py-1 bg-white/5 rounded text-xs text-slate-500 border border-white/10">SHRM-CP</div>
                                    <div className="px-3 py-1 bg-white/5 rounded text-xs text-slate-500 border border-white/10">SHRM-SCP</div>
                                    <div className="px-3 py-1 bg-white/5 rounded text-xs text-slate-500 border border-white/10">PHR</div>
                                    <div className="px-3 py-1 bg-white/5 rounded text-xs text-slate-500 border border-white/10">SPHR</div>
                                </div>
                            </div>

                            {/* Vector Graphic Right */}
                            <div className="hidden md:flex relative z-10 opacity-50">
                                <Layers size={64} className="text-brand-orange" />
                                <div className="absolute -top-4 -right-4">
                                    <Award size={32} className="text-white drop-shadow-lg" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* --- TOP DRAWER (Prompts) --- */}
            <div
                className={`
                    fixed top-[60px] left-0 w-full z-[100]
                    transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                    ${isDrawerOpen ? 'translate-y-0' : '-translate-y-full'}
                `}
            >
                <div className="bg-[#0f172a]/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl pb-8">
                    <div className="max-w-7xl mx-auto px-10 pt-8">

                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-light text-white flex items-center gap-3">
                                <Sparkles className="text-brand-blue-light" />
                                Prometheus <span className="font-bold">Prompt Library</span>
                            </h2>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Prompts Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                            {panelPrompts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        handlePromptClick(p.prompt);
                                        setIsDrawerOpen(false);
                                    }}
                                    className="text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group flex flex-col gap-2 h-full"
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2 text-slate-400 group-hover:text-brand-blue-light transition-colors">
                                            <MessageSquare size={16} />
                                            <span className="text-[10px] uppercase tracking-wider font-bold">{p.category}</span>
                                        </div>
                                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-slate-400" />
                                    </div>
                                    <div className="text-sm text-slate-200 group-hover:text-white font-medium leading-relaxed">
                                        {p.label}
                                    </div>
                                    <div className="text-xs text-slate-500 line-clamp-2 mt-auto pt-2 border-t border-white/5">
                                        "{p.prompt}"
                                    </div>
                                </button>
                            ))}
                        </div>

                    </div>
                </div>
                {/* Backdrop */}
                <div className="w-full h-screen bg-black/50 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
            </div>

        </div>
    );
};

export default UserDashboardV2;
