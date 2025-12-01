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
    Briefcase,
    Target,
    ChevronUp,
    ChevronDown,
    MessageSquare
} from 'lucide-react';
import { Course } from '@/types';
import CardStack from '../CardStack';
import { fetchDashboardData, DashboardStats } from '@/lib/dashboard';
import { fetchPromptSuggestions } from '@/lib/prompts';

interface EmployeeDashboardProps {
    user: any;
    courses: Course[];
    onNavigate: (collectionId: string) => void;
    onStartCourse: (courseId: number) => void;
    onOpenAIPanel: () => void;
    onSetAIPrompt: (prompt: string) => void;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user, courses, onNavigate, onStartCourse, onOpenAIPanel, onSetAIPrompt }) => {
    const [aiPrompt, setAiPrompt] = useState('');
    const [stats, setStats] = useState<DashboardStats>({
        totalTime: '0h 0m',
        coursesCompleted: 0,
        creditsEarned: 0,
        streak: 0
    });
    const [loading, setLoading] = useState(true);
    const [isPromptPanelOpen, setIsPromptPanelOpen] = useState(false);
    const [heroPrompts, setHeroPrompts] = useState<any[]>([]);
    const [panelPrompts, setPanelPrompts] = useState<any[]>([]);

    useEffect(() => {
        // Fetch Prompts
        fetchPromptSuggestions('employee_dashboard').then(prompts => {
            // Split: First 3 for Hero, rest for Panel
            setHeroPrompts(prompts.slice(0, 3));
            setPanelPrompts(prompts.slice(3));
        });

        if (user?.id) {
            fetchDashboardData(user.id).then(data => {
                setStats(data.stats);
                setLoading(false);
            });
        }
    }, [user?.id]);

    // Mock "Assigned" courses for Employee view
    const assignedCourses = courses.filter(c => c.badges.includes('REQUIRED')).slice(0, 3);
    const inProgressCourses = courses.filter(c => c.progress > 0 && c.progress < 100).slice(0, 3);

    const handleAiSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (aiPrompt.trim()) {
            onSetAIPrompt(aiPrompt);
            onOpenAIPanel();
        }
    };

    // Format Name
    const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Team Member';
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

                        <h2 className="text-2xl font-light text-slate-400 tracking-wide mb-2">Welcome back,</h2>
                        <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
                            {firstName} {lastName}
                        </h1>
                    </div>

                    {/* AI Intro Text */}
                    <p className="text-lg text-slate-400 mb-[50px] max-w-2xl font-light leading-relaxed">
                        Ready to level up your skills? I'm here to help you navigate your career development.
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
                                    placeholder="Ask me anything... e.g., 'What skills do I need for a promotion?'"
                                    className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-slate-500 px-4 font-light h-12"
                                />
                                <button type="submit" className="p-3 bg-brand-blue-light text-brand-black rounded-xl hover:bg-white transition-colors">
                                    <ArrowRight size={20} />
                                </button>
                            </form>

                            {/* Hero Recommended Prompts */}
                            {heroPrompts.length > 0 && (
                                <div className="px-4 pb-4 pt-2 flex flex-wrap gap-2 justify-center border-t border-white/5 bg-white/[0.02]">
                                    {heroPrompts.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                onSetAIPrompt(p.prompt);
                                                onOpenAIPanel();
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-xs text-slate-400 hover:text-white transition-all duration-200"
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                    {panelPrompts.length > 0 && (
                                        <button
                                            onClick={() => setIsPromptPanelOpen(!isPromptPanelOpen)}
                                            className="px-3 py-1.5 rounded-lg bg-brand-blue-light/10 hover:bg-brand-blue-light/20 border border-brand-blue-light/20 text-xs text-brand-blue-light hover:text-white transition-all duration-200 flex items-center gap-1"
                                        >
                                            <Sparkles size={10} />
                                            See more
                                            {isPromptPanelOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Prompt Suggestion Panel (Slide Down) */}
                            <div className={`
                                overflow-hidden transition-all duration-500 ease-in-out bg-[#0f141c]
                                ${isPromptPanelOpen ? 'max-h-[500px] opacity-100 border-t border-white/10' : 'max-h-0 opacity-0'}
                            `}>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {panelPrompts.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                onSetAIPrompt(p.prompt);
                                                onOpenAIPanel();
                                            }}
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

                {/* --- ASSIGNED TRAINING (Employee Specific) --- */}
                <div className="mb-16">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-red/10 rounded-lg text-brand-red">
                                <Briefcase size={20} />
                            </div>
                            <h2 className="text-2xl font-light text-white">Assigned to You</h2>
                        </div>
                        <button onClick={() => onNavigate('academy')} className="text-sm text-brand-blue-light hover:text-white transition-colors flex items-center gap-1">
                            View All <ArrowRight size={14} />
                        </button>
                    </div>

                    {assignedCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {assignedCourses.map(course => (
                                <div key={course.id} className="relative group cursor-pointer" onClick={() => onStartCourse(course.id)}>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-red to-brand-orange opacity-20 group-hover:opacity-100 blur transition duration-500 rounded-2xl"></div>
                                    <div className="relative h-full bg-[#0A0D12] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                                        <div className="h-40 relative">
                                            <img src={course.image} alt={course.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute top-3 right-3 bg-brand-red text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                                REQUIRED
                                            </div>
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <h3 className="text-lg font-medium text-white mb-2 line-clamp-2 group-hover:text-brand-blue-light transition-colors">{course.title}</h3>
                                            <p className="text-sm text-slate-400 mb-4 line-clamp-2 flex-1">{course.description}</p>
                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="flex items-center text-xs text-slate-500">
                                                    <Clock size={12} className="mr-1" /> {course.duration}
                                                </div>
                                                <div className="flex items-center text-xs text-brand-red font-bold">
                                                    Due in 5 days
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                            <p className="text-slate-400">No mandatory training assigned at the moment.</p>
                        </div>
                    )}
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
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                            <p className="text-slate-400">You haven't started any courses yet. Visit the Academy to begin!</p>
                            <button onClick={() => onNavigate('academy')} className="mt-4 px-6 py-2 bg-brand-blue-light text-brand-black rounded-lg font-bold hover:bg-white transition-colors">
                                Browse Courses
                            </button>
                        </div>
                    )}
                </div>

                {/* --- COMPANY GOALS (Mock) --- */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-brand-orange/10 rounded-lg text-brand-orange">
                            <Target size={20} />
                        </div>
                        <h2 className="text-2xl font-light text-white">Organization Goals</h2>
                    </div>
                    <div className="bg-gradient-to-r from-brand-orange/10 to-transparent border border-brand-orange/20 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-2">Q4 Focus: AI Upskilling</h3>
                        <p className="text-slate-300 mb-4 max-w-3xl">
                            Our organization is prioritizing AI literacy this quarter. All employees are encouraged to complete at least one "AI for HR" course by the end of the year.
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                                <div className="bg-brand-orange h-full rounded-full w-[65%]"></div>
                            </div>
                            <span className="text-sm font-bold text-brand-orange">65% Org Completion</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EmployeeDashboard;
