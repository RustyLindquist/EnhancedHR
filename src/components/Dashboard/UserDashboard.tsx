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
    Layers
} from 'lucide-react';
import { Course } from '@/types';
import CardStack from '../CardStack'; // Reusing the card component
import { fetchDashboardData, DashboardStats } from '@/lib/dashboard';
import { PromptSuggestion, fetchPromptSuggestions } from '@/lib/prompts';

interface UserDashboardProps {
    user: any; // Contains profile data now
    courses: Course[];
    onNavigate: (collectionId: string) => void;
    onStartCourse: (courseId: number) => void;
    onOpenAIPanel: () => void;
    onSetAIPrompt: (prompt: string) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, courses, onNavigate, onStartCourse, onOpenAIPanel, onSetAIPrompt }) => {
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
    const [heroPrompts, setHeroPrompts] = useState<PromptSuggestion[]>([]);
    const [panelPrompts, setPanelPrompts] = useState<PromptSuggestion[]>([]);

    useEffect(() => {
        // Fetch Prompts
        fetchPromptSuggestions('user_dashboard').then(prompts => {
            // Split: First 3 for Hero, rest for Panel
            setHeroPrompts(prompts.slice(0, 3));
            setPanelPrompts(prompts.slice(3));
        });

        if (user?.id) {
            fetchDashboardData(user.id).then(data => {
                setStats(data.stats);
                setTrendingIds(data.trendingCourseIds);
                setRecertifications(data.recentCertificates);
                setUserProgress(data.userProgress);
                setLoading(false);
            });
        }
    }, [user?.id]);

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
            onSetAIPrompt(aiPrompt);
            onOpenAIPanel();
        }
    };



    const handlePromptClick = (prompt: string) => {
        setAiPrompt(prompt);
        onSetAIPrompt(prompt);
        onOpenAIPanel();
    };

    // Format Name
    const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Leader';
    const lastName = user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';

    return (
        <div className="w-full h-full overflow-y-auto custom-scrollbar pb-32 relative">

            {/* --- HERO SECTION: AI ASSISTANT (Full Width / On Canvas) --- */}
            <div className="relative w-full mb-12 group">
                <div className="absolute inset-0 pointer-events-none"></div>

                {/* 100px Padding Top */}
                <div className="pt-[100px] px-8 flex flex-col items-center text-center relative z-10">

                    {/* Greeting Group */}
                    <div className="flex flex-col items-center mb-[50px]">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-brand-blue-light text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-md">
                            <Sparkles size={12} />
                            <span>AI-Powered Learning</span>
                        </div>

                        <h2 className="text-2xl font-light text-slate-400 tracking-wide mb-2">Good Morning,</h2>
                        <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
                            {firstName} {lastName}
                        </h1>
                    </div>

                    {/* AI Intro Text */}
                    <p className="text-lg text-slate-400 mb-[50px] max-w-2xl font-light leading-relaxed">
                        I'm <span className="text-brand-orange font-medium">Prometheus</span>, your personal AI assistant.
                        I can help you find a course, answer a quick question, or role-play a difficult conversation.
                    </p>

                    {/* AI Input & Prompts Container */}
                    <div className="w-full max-w-3xl relative group/input mb-[100px]">
                        {/* Glow Effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-light via-white to-brand-orange opacity-30 group-focus-within/input:opacity-100 blur-lg transition-opacity duration-500 rounded-2xl"></div>

                        <div className="relative bg-[#0A0D12]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                            {/* Input Bar */}
                            <form onSubmit={handleAiSubmit} className="flex items-center p-2">
                                <div className="p-3 bg-white/5 rounded-xl text-brand-blue-light">
                                    <Flame size={24} />
                                </div>
                                <input
                                    type="text"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="Ask me anything..."
                                    className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-slate-500 px-4 font-light h-12"
                                />
                                <button type="submit" className="p-3 bg-brand-blue-light text-brand-black rounded-xl hover:bg-white transition-colors">
                                    <ArrowRight size={20} />
                                </button>
                            </form>

                            {/* Hero Recommended Prompts */}
                            <div className="px-4 pb-4 pt-2 flex flex-wrap gap-2 justify-center border-t border-white/5 bg-white/[0.02]">
                                {heroPrompts.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handlePromptClick(p.prompt)}
                                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-xs text-slate-400 hover:text-white transition-all duration-200"
                                    >
                                        {p.label}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setIsPromptPanelOpen(!isPromptPanelOpen)}
                                    className="px-3 py-1.5 rounded-lg bg-brand-blue-light/10 hover:bg-brand-blue-light/20 border border-brand-blue-light/20 text-xs text-brand-blue-light hover:text-white transition-all duration-200 flex items-center gap-1"
                                >
                                    <Sparkles size={10} />
                                    See more
                                    {isPromptPanelOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                </button>
                            </div>

                            {/* Prompt Suggestion Panel (Slide Down) */}
                            <div className={`
                                overflow-hidden transition-all duration-500 ease-in-out bg-[#0f141c]
                                ${isPromptPanelOpen ? 'max-h-[500px] opacity-100 border-t border-white/10' : 'max-h-0 opacity-0'}
                            `}>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {panelPrompts.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => handlePromptClick(p.prompt)}
                                            className="text-left p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group/prompt flex items-start gap-3"
                                        >
                                            <div className="mt-0.5 p-1.5 rounded-lg bg-white/5 text-slate-500 group-hover/prompt:text-brand-blue-light group-hover/prompt:bg-brand-blue-light/10 transition-colors">
                                                <MessageSquare size={14} />
                                            </div>
                                            <div>
                                                <div className="text-sm text-slate-300 group-hover/prompt:text-white font-medium mb-0.5">{p.label}</div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">{p.category}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
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
        </div>
    );
};

export default UserDashboard;
