import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Users,
    TrendingUp,
    Award,
    BrainCircuit,
    Plus,
    MoreHorizontal,
    Search,
    Download,
    ChevronRight,
    Sparkles,
    MessageSquare,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { fetchOrgDashboardData, OrgDashboardData } from '@/lib/dashboard';
import { fetchPromptSuggestions, PromptSuggestion, HERO_PROMPTS } from '@/lib/prompts';
import { getGeminiResponse } from '@/lib/gemini';

interface OrgAdminDashboardProps {
    user: any;
    orgId: string;
    onOpenAIPanel: () => void;
    onSetAIPrompt: (prompt: string) => void;
}

const OrgAdminDashboard: React.FC<OrgAdminDashboardProps> = ({ user, orgId, onOpenAIPanel, onSetAIPrompt }) => {
    const [data, setData] = useState<OrgDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'paths' | 'analytics'>('overview');

    // AI Hero State
    const [heroPrompts, setHeroPrompts] = useState<PromptSuggestion[]>([]);
    const [panelPrompts, setPanelPrompts] = useState<PromptSuggestion[]>([]);
    const [isPromptPanelOpen, setIsPromptPanelOpen] = useState(false);
    const [aiInput, setAiInput] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Fetch Dashboard Data
                const dashboardData = await fetchOrgDashboardData(orgId);
                setData(dashboardData);

                // Fetch Prompts
                const suggestions = await fetchPromptSuggestions('org_admin_dashboard');
                if (suggestions.length > 0) {
                    setHeroPrompts(suggestions.slice(0, 3));
                    setPanelPrompts(suggestions.slice(3));
                } else {
                    // Fallback if DB is empty (though migration should have filled it)
                    setHeroPrompts([
                        { id: '1', label: 'Analyze Team', prompt: 'Analyze my team progress', category: 'Analytics' },
                        { id: '2', label: 'ROI Report', prompt: 'Draft ROI report', category: 'Reporting' },
                        { id: '3', label: 'Assign Training', prompt: 'Suggest training for new managers', category: 'Management' }
                    ]);
                }
            } catch (error) {
                console.error('Error loading org dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (orgId) {
            loadData();
        }
    }, [orgId]);

    const handleAiSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!aiInput.trim()) return;

        onSetAIPrompt(aiInput);
        onOpenAIPanel();
        setAiInput('');
    };

    const handlePromptClick = (promptText: string) => {
        setAiInput(promptText);
        onSetAIPrompt(promptText);
        onOpenAIPanel();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue-light"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar">

            {/* --- AI HERO SECTION --- */}
            <div className="relative w-full min-h-[500px] flex flex-col items-center justify-center px-8 py-24 z-10">

                {/* Background Gradients */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-brand-blue-light/5 rounded-full blur-[120px] animate-pulse-slow"></div>
                    <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>
                </div>

                {/* Greeting */}
                <div className="text-center mb-12 z-20">
                    <h2 className="text-xl font-light text-slate-400 mb-2 tracking-wide">Good Morning,</h2>
                    <h1 className="text-5xl font-bold text-white tracking-tight drop-shadow-lg">
                        {user.full_name}
                    </h1>
                </div>

                {/* AI Intro Text */}
                <div className="text-center mb-12 max-w-2xl z-20">
                    <p className="text-lg text-slate-300 font-light leading-relaxed">
                        Here is your Organization's Pulse. <br />
                        <span className="text-brand-blue-light font-medium">How can I help you manage your team today?</span>
                    </p>
                </div>

                {/* AI Input Bar */}
                <div className="w-full max-w-3xl relative z-30 mb-8 group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-blue-light/30 to-brand-orange/30 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                    <form onSubmit={handleAiSubmit} className="relative flex items-center bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl transition-all duration-300 focus-within:border-white/20 focus-within:bg-[#1e293b]/90">
                        <div className="pl-4 pr-2 text-brand-blue-light">
                            <Sparkles size={20} className={isAiLoading ? "animate-pulse" : ""} />
                        </div>
                        <input
                            type="text"
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                            placeholder="Ask about team progress, ROI, or assign training..."
                            className="flex-1 bg-transparent border-none text-white placeholder-slate-400 focus:ring-0 text-lg py-3 px-2"
                        />
                        <button
                            type="submit"
                            disabled={!aiInput.trim() || isAiLoading}
                            className="p-3 bg-brand-blue-light/10 hover:bg-brand-blue-light/20 text-brand-blue-light rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAiLoading ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <ChevronRight size={20} />
                            )}
                        </button>
                    </form>
                </div>

                {/* Hero Prompts */}
                <div className="flex flex-wrap justify-center gap-3 z-20 mb-4">
                    {heroPrompts.map((prompt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handlePromptClick(prompt.prompt)}
                            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-300 backdrop-blur-sm"
                        >
                            {prompt.label}
                        </button>
                    ))}
                </div>

                {/* Slide-down Prompt Panel Toggle */}
                <div className="z-20">
                    <button
                        onClick={() => setIsPromptPanelOpen(!isPromptPanelOpen)}
                        className="flex items-center text-xs font-medium text-slate-500 hover:text-brand-blue-light transition-colors uppercase tracking-widest"
                    >
                        {isPromptPanelOpen ? 'Hide Suggestions' : 'See More'}
                        {isPromptPanelOpen ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                    </button>
                </div>

                {/* Slide-down Panel */}
                <div className={`
            w-full max-w-4xl mt-6 overflow-hidden transition-all duration-500 ease-in-out
            ${isPromptPanelOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}
        `}>
                    <div className="bg-[#131b2c]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {panelPrompts.map((prompt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handlePromptClick(prompt.prompt)}
                                className="text-left p-3 rounded-xl hover:bg-white/5 transition-colors group border border-transparent hover:border-white/5"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-brand-blue-light/80 uppercase tracking-wider">{prompt.category}</span>
                                    <MessageSquare size={12} className="text-slate-600 group-hover:text-brand-blue-light transition-colors" />
                                </div>
                                <p className="text-sm text-slate-300 group-hover:text-white line-clamp-2">{prompt.label}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- DASHBOARD CONTENT --- */}
            <div className="flex-1 px-8 pb-36 max-w-7xl mx-auto w-full z-20">

                {/* Tabs */}
                <div className="flex items-center space-x-8 border-b border-white/10 mb-8">
                    {['overview', 'team', 'paths', 'analytics'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`
                        pb-4 text-sm font-medium capitalize transition-all relative
                        ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'}
                    `}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue-light shadow-[0_0_10px_rgba(120,192,240,0.5)]"></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && data && (
                    <div className="space-y-8">

                        {/* Top Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                            {/* Upskilling Pulse */}
                            <div className="bg-[#131b2c] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-slate-400 text-sm font-medium">Upskilling Pulse</h3>
                                    <TrendingUp size={18} className="text-brand-blue-light" />
                                </div>
                                <div className="flex items-end space-x-2">
                                    <span className="text-3xl font-bold text-white">{data.totalCoursesCompleted}</span>
                                    <span className="text-sm text-slate-500 mb-1">courses completed</span>
                                </div>
                                <div className="mt-2 text-xs text-green-400 flex items-center">
                                    <TrendingUp size={12} className="mr-1" /> +12% this month
                                </div>
                            </div>

                            {/* Certification Health */}
                            <div className="bg-[#131b2c] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-slate-400 text-sm font-medium">Cert. Health</h3>
                                    <Award size={18} className="text-brand-orange" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-2xl font-bold text-white">{data.totalCredits.shrm}</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">SHRM PDCs</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white">{data.totalCredits.hrci}</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">HRCI Credits</div>
                                    </div>
                                </div>
                            </div>

                            {/* AI Adoption */}
                            <div className="bg-[#131b2c] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-slate-400 text-sm font-medium">AI Adoption</h3>
                                    <BrainCircuit size={18} className="text-purple-400" />
                                </div>
                                <div className="flex items-end space-x-2">
                                    <span className="text-3xl font-bold text-white">{data.aiAdoptionRate}%</span>
                                    <span className="text-sm text-slate-500 mb-1">engagement</span>
                                </div>
                                <p className="mt-2 text-xs text-slate-400">
                                    Your team is leaning into the future of work.
                                </p>
                            </div>

                            {/* Seat Utilization */}
                            <div className="bg-[#131b2c] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-slate-400 text-sm font-medium">Seat Utilization</h3>
                                    <Users size={18} className="text-slate-300" />
                                </div>
                                <div className="flex items-end space-x-2 mb-2">
                                    <span className="text-3xl font-bold text-white">{data.seatUtilization.active}</span>
                                    <span className="text-sm text-slate-500 mb-1">/ {data.seatUtilization.total} seats used</span>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-1.5">
                                    <div
                                        className="bg-brand-blue-light h-1.5 rounded-full transition-all duration-1000"
                                        style={{ width: `${(data.seatUtilization.active / data.seatUtilization.total) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity & Quick Actions */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Recent Activity Feed */}
                            <div className="lg:col-span-2 bg-[#131b2c] border border-white/5 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-6">Recent Activity</h3>
                                <div className="space-y-4">
                                    {data.recentActivity.map((activity, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/5">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-white mr-4">
                                                    {activity.user.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{activity.user}</p>
                                                    <p className="text-xs text-slate-400">{activity.action}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-500">{activity.date}</span>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-6 py-3 text-sm text-brand-blue-light hover:bg-brand-blue-light/5 rounded-xl transition-colors border border-transparent hover:border-brand-blue-light/20">
                                    View Full Report
                                </button>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-[#131b2c] border border-white/5 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-6">Quick Actions</h3>
                                <div className="space-y-3">
                                    <button className="w-full flex items-center justify-between p-4 bg-brand-blue-light/10 hover:bg-brand-blue-light/20 text-brand-blue-light rounded-xl transition-colors border border-brand-blue-light/20">
                                        <span className="font-medium">Invite Users</span>
                                        <Plus size={18} />
                                    </button>
                                    <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/10">
                                        <span className="font-medium">Assign Training</span>
                                        <BookOpen size={18} className="text-slate-400" />
                                    </button>
                                    <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/10">
                                        <span className="font-medium">Download Report</span>
                                        <Download size={18} className="text-slate-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TEAM MANAGEMENT TAB */}
                {activeTab === 'team' && (
                    <div className="bg-[#131b2c] border border-white/5 rounded-2xl p-6 min-h-[400px] flex items-center justify-center text-slate-500">
                        <div className="text-center">
                            <Users size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Team Management Interface Coming Soon</p>
                            <p className="text-xs mt-2">Will include User Table, Invite Flow, and Removal Logic.</p>
                        </div>
                    </div>
                )}

                {/* OTHER TABS */}
                {(activeTab === 'paths' || activeTab === 'analytics') && (
                    <div className="bg-[#131b2c] border border-white/5 rounded-2xl p-6 min-h-[400px] flex items-center justify-center text-slate-500">
                        <div className="text-center">
                            <BrainCircuit size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="capitalize">{activeTab} Interface Coming Soon</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

// Helper icon
const BookOpen = ({ size, className }: { size: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
);

export default OrgAdminDashboard;
