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
    X
} from 'lucide-react';
import { Course } from '@/types';
import CardStack from '../CardStack'; // Reusing the card component
import { fetchDashboardData, DashboardStats } from '@/lib/dashboard';
import { PromptSuggestion, fetchPromptSuggestions } from '@/lib/prompts';
import { useRouter } from 'next/navigation';

interface UserDashboardProps {
    user: any; // Contains profile data now
    courses: Course[];
    onNavigate: (collectionId: string) => void;
    onStartCourse: (courseId: number) => void;
    onOpenAIPanel: () => void;
    onSetAIPrompt: (prompt: string) => void;
    onSetPrometheusPagePrompt: (prompt: string) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, courses, onNavigate, onStartCourse, onOpenAIPanel, onSetAIPrompt, onSetPrometheusPagePrompt }) => {
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
    const [isPromptPanelOpen, setIsPromptPanelOpen] = useState(false); // Kept for small panel if needed, or remove? User wants "View More" button.
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); // New Top Drawer State
    const [heroPrompts, setHeroPrompts] = useState<PromptSuggestion[]>([]);
    const [panelPrompts, setPanelPrompts] = useState<PromptSuggestion[]>([]);

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

    // Format Name
    const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Leader';
    const lastName = user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';

    return (
        <div className="w-full h-full overflow-y-auto custom-scrollbar pb-32 relative">

            {/* --- HERO SECTION: AI ASSISTANT (Full Width / On Canvas) --- */}
            {/* --- PROMETHEUS HERO SECTION --- */}
            <div className="flex flex-col items-center relative z-10 pt-32">

                {/* Logo & Title */}
                <div className="flex flex-col items-center mb-12 animate-float group cursor-default">
                    <div className="relative mb-8 transition-transform duration-700 group-hover:scale-105">
                        <div className="absolute inset-0 bg-brand-blue-light/20 blur-[60px] rounded-full animate-pulse-slow group-hover:bg-brand-blue-light/40 transition-colors duration-500"></div>
                        <img
                            src="/images/logos/EnhancedHR-logo-mark-flame.png"
                            alt="Prometheus AI"
                            className="w-56 h-56 relative z-10 drop-shadow-[0_0_50px_rgba(120,192,240,0.5)] object-contain transition-all duration-500 group-hover:drop-shadow-[0_0_80px_rgba(59,130,246,0.8)]"
                        />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-thin text-white tracking-tight text-center mb-3">
                        Prometheus <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-yellow">AI</span>
                    </h1>
                    <p className="text-lg text-slate-400 font-light tracking-wide">Your personal learning assistant.</p>
                </div>

                {/* Capability Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mb-[50px]">
                    {[
                        {
                            id: 'cap-1',
                            title: 'Difficult Conversations',
                            description: 'Role-play and prepare for challenging discussions with employees.',
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
                            className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] overflow-hidden"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10 flex items-start gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-brand-blue-light transition-colors">{card.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{card.description}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* View More Prompts Button */}
                <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="mb-[50px] flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all duration-300 group"
                >
                    <Sparkles size={16} className="text-brand-blue-light group-hover:text-white transition-colors" />
                    <span className="text-sm font-medium">View more prompts</span>
                    <ChevronDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
                </button>

                {/* Input Area (The Command Deck) */}
                <div className="w-full max-w-4xl relative group/input mb-[200px]">
                    {/* Glow Effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-blue via-brand-orange to-brand-blue opacity-20 group-focus-within/input:opacity-100 blur-xl transition-opacity duration-700 rounded-2xl"></div>

                    <div className="relative bg-[#0f172a]/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex items-center p-2 overflow-hidden">

                        {/* More Prompts Toggle */}
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

                    {/* Suggestion Panel (Slide Up) */}
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

                    {/* Footer Text */}
                    <div className="text-center mt-4">
                        <p className="text-xs text-slate-600">Prometheus can make mistakes. Verify important information.</p>
                    </div>
                </div>
            </div>



            <div className="max-w-7xl mx-auto px-8">

                {/* --- STATS GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {/* Stat 1 */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-brand-blue-light/10 rounded-lg text-brand-blue-light group-hover:scale-110 transition-transform">
                                <Clock size={20} />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Time</span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{loading ? '...' : stats.totalTime}</div>
                        <div className="text-xs text-slate-400">Learning this month</div>
                    </div>

                    {/* Stat 2 */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-brand-orange/10 rounded-lg text-brand-orange group-hover:scale-110 transition-transform">
                                <Award size={20} />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Credits</span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{loading ? '...' : stats.creditsEarned}</div>
                        <div className="text-xs text-slate-400">SHRM / HRCI PDCs</div>
                    </div>

                    {/* Stat 3 */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:scale-110 transition-transform">
                                <BookOpen size={20} />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{loading ? '...' : stats.coursesCompleted}</div>
                        <div className="text-xs text-slate-400">Courses finished</div>
                    </div>

                    {/* Stat 4 */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform">
                                <Zap size={20} />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Streak</span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{loading ? '...' : stats.streak} Days</div>
                        <div className="text-xs text-slate-400">Keep it up!</div>
                    </div>
                </div>

                {/* --- CONTINUE LEARNING --- */}
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

                {/* --- TRENDING NOW --- */}
                <div className="mb-16">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-brand-red/10 rounded-lg text-brand-red">
                            <TrendingUp size={20} />
                        </div>
                        <h2 className="text-2xl font-light text-white">Trending Now</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

export default UserDashboard;
