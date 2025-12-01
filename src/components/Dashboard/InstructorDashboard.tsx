import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    BookOpen,
    Lightbulb,
    DollarSign,
    TrendingUp,
    Users,
    Award,
    Clock,
    Sparkles,
    ChevronRight,
    ChevronDown,
    Search,
    Plus,
    FileText,
    CheckCircle,
    AlertCircle,
    Star
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { fetchInstructorDashboardData, InstructorDashboardData } from '@/lib/dashboard';
import { fetchPromptSuggestions, PromptSuggestion, HERO_PROMPTS, SUGGESTION_PANEL_PROMPTS } from '@/lib/prompts';
import CardStack from '../CardStack';

interface InstructorDashboardProps {
    user: any;
    onOpenAIPanel: () => void;
    onSetAIPrompt: (prompt: string) => void;
}

const InstructorDashboard: React.FC<InstructorDashboardProps> = ({ user, onOpenAIPanel, onSetAIPrompt }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'inspiration' | 'financials'>('overview');
    const [dashboardData, setDashboardData] = useState<InstructorDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [sortOption, setSortOption] = useState<'date' | 'rating' | 'views' | 'ai'>('date');

    // AI Prompt State
    const [prompts, setPrompts] = useState<PromptSuggestion[]>([]);
    const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');

    useEffect(() => {
        const loadData = async () => {
            if (user?.role === 'author') {
                const data = await fetchInstructorDashboardData(user.id);
                setDashboardData(data);

                // Fetch dynamic prompts
                const dynamicPrompts = await fetchPromptSuggestions('instructor_dashboard');
                setPrompts(dynamicPrompts.length > 0 ? dynamicPrompts : HERO_PROMPTS.slice(0, 3));
            }
            setLoading(false);
        };
        loadData();
    }, [user]);

    const handleAiSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (aiPrompt.trim()) {
            onSetAIPrompt(aiPrompt);
            onOpenAIPanel();
        }
    };

    // --- PENDING STATE ---
    if (user?.role === 'pending_author') {
        return (
            <div className="w-full h-full overflow-y-auto custom-scrollbar bg-[#0f172a] text-white p-10 flex flex-col items-center justify-center">
                <div className="max-w-2xl w-full bg-white/5 border border-white/10 rounded-2xl p-10 backdrop-blur-sm text-center">
                    <div className="w-20 h-20 bg-brand-orange/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock size={40} className="text-brand-orange" />
                    </div>
                    <h1 className="text-3xl font-light mb-4">Application Under Review</h1>
                    <p className="text-slate-400 text-lg mb-8">
                        Thank you for applying to teach on EnhancedHR. Our team is currently reviewing your profile and course proposal. We typically respond within 48 hours.
                    </p>

                    <div className="flex items-center justify-center gap-8 mb-10">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-brand-blue-light flex items-center justify-center text-brand-black font-bold mb-2">
                                <CheckCircle size={16} />
                            </div>
                            <span className="text-sm text-brand-blue-light">Submitted</span>
                        </div>
                        <div className="w-20 h-0.5 bg-brand-blue-light/30"></div>
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center text-white font-bold mb-2 animate-pulse">
                                <Clock size={16} />
                            </div>
                            <span className="text-sm text-brand-orange">Reviewing</span>
                        </div>
                        <div className="w-20 h-0.5 bg-slate-700"></div>
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold mb-2">
                                <CheckCircle size={16} />
                            </div>
                            <span className="text-sm text-slate-500">Decision</span>
                        </div>
                    </div>

                    <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                        Update Profile
                    </button>
                </div>
            </div>
        );
    }

    // --- ACTIVE STATE ---

    if (loading || !dashboardData) {
        return <div className="p-10 text-white">Loading dashboard...</div>;
    }

    return (
        <div className="w-full h-full overflow-y-auto custom-scrollbar text-white relative">

            {/* --- AI HERO SECTION --- */}
            <div className="relative w-full min-h-[500px] flex flex-col items-center justify-center px-4 pt-[100px] pb-[100px] z-10">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-blue/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none"></div>

                {/* Greeting */}
                <div className="text-center mb-[50px] animate-fade-in-up">
                    <h2 className="text-xl font-light text-brand-blue-light mb-2 tracking-wide uppercase">Instructor Dashboard</h2>
                    <h1 className="text-5xl md:text-6xl font-thin tracking-tight text-white drop-shadow-2xl">
                        Good Morning, <span className="font-bold">{user.user_metadata?.full_name?.split(' ')[0] || 'Instructor'}</span>
                    </h1>
                </div>

                {/* AI Intro Text */}
                <div className="text-center max-w-2xl mx-auto mb-[50px] animate-fade-in-up delay-100">
                    <p className="text-xl text-slate-300 font-light leading-relaxed">
                        Ready to inspire the next generation of HR leaders?
                        <br />
                        <span className="text-brand-blue-light">I can help you analyze trends, draft content, or track your impact.</span>
                    </p>
                </div>

                {/* Prompt Input Area */}
                <div className="w-full max-w-3xl relative group animate-fade-in-up delay-200 z-20">
                    <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue via-purple-500 to-brand-orange opacity-30 group-hover:opacity-60 blur-lg transition-all duration-500 rounded-2xl"></div>
                    <form onSubmit={handleAiSubmit} className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center shadow-2xl">
                        <div className="p-3 bg-white/5 rounded-xl mr-3 text-brand-blue-light">
                            <Sparkles size={24} />
                        </div>
                        <input
                            type="text"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Ask me to analyze your course performance..."
                            className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-slate-500 h-12"
                        />
                        <button type="submit" className="p-3 bg-brand-blue-light hover:bg-white text-brand-black rounded-xl transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(120,192,240,0.3)]">
                            <ChevronRight size={24} />
                        </button>
                    </form>
                </div>

                {/* Recommended Prompts (Pills) */}
                <div className="mt-8 flex flex-wrap justify-center gap-3 max-w-4xl animate-fade-in-up delay-300">
                    {prompts.slice(0, 3).map((prompt) => (
                        <button
                            key={prompt.id}
                            onClick={() => {
                                onSetAIPrompt(prompt.prompt);
                                onOpenAIPanel();
                            }}
                            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-blue-light/50 text-sm text-slate-300 transition-all cursor-pointer backdrop-blur-md flex items-center gap-2"
                        >
                            <Sparkles size={12} className="text-brand-blue-light" />
                            {prompt.label}
                        </button>
                    ))}
                    <button
                        onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
                        className="px-4 py-2 rounded-full bg-transparent border border-white/10 hover:border-brand-orange/50 text-sm text-slate-400 hover:text-brand-orange transition-all cursor-pointer flex items-center gap-2"
                    >
                        {isAIPanelOpen ? 'Close Suggestions' : 'See more'}
                        <ChevronDown size={14} className={`transform transition-transform ${isAIPanelOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Slide-down Prompt Panel */}
                <div className={`
                    w-full max-w-4xl mt-6 overflow-hidden transition-all duration-500 ease-in-out
                    ${isAIPanelOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                `}>
                    <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-2xl">
                        {SUGGESTION_PANEL_PROMPTS.slice(0, 6).map((prompt) => (
                            <button
                                key={prompt.id}
                                onClick={() => {
                                    onSetAIPrompt(prompt.prompt);
                                    onOpenAIPanel();
                                    setIsAIPanelOpen(false);
                                }}
                                className="text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-brand-blue-light/30 transition-all group"
                            >
                                <h4 className="text-brand-blue-light font-medium mb-1 flex items-center gap-2">
                                    <Sparkles size={14} className="opacity-50 group-hover:opacity-100" />
                                    {prompt.label}
                                </h4>
                                <p className="text-xs text-slate-400 line-clamp-2">{prompt.prompt}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- DASHBOARD CONTENT --- */}
            <div className="max-w-7xl mx-auto px-6 pb-20">

                {/* Tabs */}
                <div className="flex items-center gap-8 border-b border-white/10 mb-10">
                    {[
                        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                        { id: 'courses', label: 'My Courses', icon: BookOpen },
                        { id: 'inspiration', label: 'Inspiration', icon: Lightbulb },
                        { id: 'financials', label: 'Financials', icon: DollarSign },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                                flex items-center gap-2 pb-4 text-sm font-medium transition-all relative
                                ${activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}
                            `}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-orange shadow-[0_0_10px_rgba(255,147,0,0.5)]"></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-fade-in">

                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                            {/* Earnings */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                                        <DollarSign size={20} />
                                    </div>
                                    <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded">+12%</span>
                                </div>
                                <h3 className="text-slate-400 text-sm font-medium mb-1">Est. Earnings (This Month)</h3>
                                <p className="text-3xl font-bold text-white tracking-tight">${dashboardData.earnings.currentMonth.toLocaleString()}</p>
                                <p className="text-xs text-slate-500 mt-2">Lifetime: ${dashboardData.earnings.lifetime.toLocaleString()}</p>
                            </div>

                            {/* Students */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                        <Users size={20} />
                                    </div>
                                </div>
                                <h3 className="text-slate-400 text-sm font-medium mb-1">Total Students</h3>
                                <p className="text-3xl font-bold text-white tracking-tight">{dashboardData.impact.studentsTaught.toLocaleString()}</p>
                                <p className="text-xs text-slate-500 mt-2">Across 4 courses</p>
                            </div>

                            {/* Watch Time */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                        <Clock size={20} />
                                    </div>
                                </div>
                                <h3 className="text-slate-400 text-sm font-medium mb-1">Hours Watched</h3>
                                <p className="text-3xl font-bold text-white tracking-tight">{dashboardData.impact.hoursWatched.toLocaleString()}</p>
                                <p className="text-xs text-slate-500 mt-2">Total instructional time</p>
                            </div>

                            {/* AI Reach */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors group relative overflow-hidden">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-brand-orange/10 rounded-full blur-2xl group-hover:bg-brand-orange/20 transition-colors"></div>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="p-2 bg-brand-orange/20 rounded-lg text-brand-orange">
                                        <Sparkles size={20} />
                                    </div>
                                    <span className="text-xs font-bold text-brand-orange bg-brand-orange/10 px-2 py-1 rounded">+{dashboardData.aiReach.weeklyGrowth}%</span>
                                </div>
                                <h3 className="text-slate-400 text-sm font-medium mb-1 relative z-10">AI Attribution</h3>
                                <p className="text-3xl font-bold text-white tracking-tight relative z-10">{dashboardData.aiReach.attributionCount.toLocaleString()}</p>
                                <p className="text-xs text-slate-500 mt-2 relative z-10">Answers powered by your content</p>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <TrendingUp size={20} className="text-brand-blue-light" />
                                Recent Activity
                            </h3>
                            <div className="space-y-4">
                                {dashboardData.recentActivity.map((activity, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
                                                {activity.student.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-medium">
                                                    <span className="text-brand-blue-light">{activity.student}</span> {activity.action}
                                                </p>
                                                <p className="text-xs text-slate-500">{activity.course}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-500">{activity.date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'courses' && (
                    <div className="animate-fade-in">
                        {/* Filter & Sort Bar */}
                        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                            <h3 className="text-xl font-light text-white flex items-center gap-2">
                                <BookOpen size={24} className="text-brand-blue-light" />
                                My Courses
                                <span className="text-sm text-slate-500 ml-2 font-normal">({dashboardData.courses.length})</span>
                            </h3>

                            <div className="flex items-center gap-4">
                                <div className="relative group">
                                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-sm text-slate-300 hover:border-brand-blue-light/50 transition-colors cursor-pointer">
                                        <TrendingUp size={14} />
                                        <span>Sort by: <span className="text-white font-medium capitalize">{sortOption}</span></span>
                                        <ChevronDown size={14} />
                                    </div>
                                    {/* Dropdown */}
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                        {['date', 'rating', 'views', 'ai'].map((option) => (
                                            <button
                                                key={option}
                                                onClick={() => setSortOption(option as any)}
                                                className={`w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors flex items-center justify-between ${sortOption === option ? 'text-brand-blue-light' : 'text-slate-400'}`}
                                            >
                                                <span className="capitalize">{option === 'ai' ? 'AI Interactions' : option}</span>
                                                {sortOption === option && <CheckCircle size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button className="px-4 py-2 bg-brand-blue-light text-brand-black font-bold rounded-lg hover:bg-white transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(120,192,240,0.3)]">
                                    <Plus size={16} />
                                    Create New
                                </button>
                            </div>
                        </div>

                        {/* Course Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...dashboardData.courses]
                                .sort((a, b) => {
                                    if (sortOption === 'rating') return b.rating - a.rating;
                                    if (sortOption === 'views') return b.metrics.views - a.metrics.views;
                                    if (sortOption === 'ai') return b.metrics.aiInteractions - a.metrics.aiInteractions;
                                    return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
                                })
                                .map((course) => (
                                    <div key={course.id} className="relative group/card">
                                        <CardStack {...course} depth="single" />

                                        {/* Instructor Stats Overlay (Only visible in this dashboard) */}
                                        <div className="absolute -bottom-4 left-4 right-4 bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 rounded-xl p-3 flex justify-between items-center shadow-2xl transform translate-y-2 opacity-0 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-300 z-30">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Views</span>
                                                <span className="text-sm font-bold text-white">{course.metrics.views.toLocaleString()}</span>
                                            </div>
                                            <div className="w-px h-8 bg-white/10"></div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Rating</span>
                                                <div className="flex items-center gap-1 text-sm font-bold text-brand-orange">
                                                    <Star size={12} fill="currentColor" />
                                                    {course.metrics.avgRating}
                                                </div>
                                            </div>
                                            <div className="w-px h-8 bg-white/10"></div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">AI Uses</span>
                                                <div className="flex items-center gap-1 text-sm font-bold text-brand-blue-light">
                                                    <Sparkles size={12} />
                                                    {course.metrics.aiInteractions}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {activeTab === 'inspiration' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <TrendingUp size={20} className="text-brand-orange" />
                                Trending Topics
                            </h3>
                            <ul className="space-y-3">
                                {['AI in Recruitment', 'Remote Culture Building', 'Mental Health First Aid', 'Data-Driven HR'].map((topic, i) => (
                                    <li key={i} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                                        <span className="text-slate-300">{topic}</span>
                                        <span className="text-xs text-green-400 font-bold">+{(4 - i) * 12}%</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Search size={20} className="text-brand-blue-light" />
                                Top Search Terms
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {['conflict resolution', 'onboarding checklist', 'salary negotiation', 'termination script', 'DEI strategy'].map((term, i) => (
                                    <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-sm text-slate-300 border border-white/5">
                                        {term}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'financials' && (
                    <div className="text-center py-20 text-slate-500">
                        <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-light text-white mb-2">Financial Reports</h3>
                        <p>Detailed payout history and tax documents will appear here.</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default InstructorDashboard;
