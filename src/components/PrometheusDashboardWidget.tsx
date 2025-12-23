import React, { useState, useEffect } from 'react';
import { Flame, Sparkles, ArrowRight, MessageSquare, ChevronRight } from 'lucide-react';
import { PromptSuggestion, fetchPromptSuggestions } from '@/lib/prompts';

interface PrometheusDashboardWidgetProps {
    onSetPrometheusPagePrompt: (prompt: string) => void;
    onOpenDrawer: () => void;
}

const PrometheusDashboardWidget: React.FC<PrometheusDashboardWidgetProps> = ({
    onSetPrometheusPagePrompt,
    onOpenDrawer
}) => {
    const [aiPrompt, setAiPrompt] = useState('');
    // We can fetch prompts or just hardcode the Hero prompts for consistency/speed as per Dashboard
    // Dashboard fetches prompts. Let's fetch them here too for consistency.
    const [heroPrompts, setHeroPrompts] = useState<PromptSuggestion[]>([]);

    useEffect(() => {
        const loadPrompts = async () => {
            const prompts = await fetchPromptSuggestions('user_dashboard'); // Using same context
            setHeroPrompts(prompts.slice(0, 4));
        };
        loadPrompts();
    }, []);

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
        <div className="flex gap-8 items-stretch relative z-10 w-full animate-fade-in">

            {/* Logo & Title - Left Column - Matches height of right column */}
            <div className="flex flex-col items-center flex-shrink-0 group cursor-default justify-center w-40">
                {/* Logo */}
                <div className="relative transition-transform duration-700 group-hover:scale-105 mb-2">
                    <div className="absolute inset-0 bg-brand-orange/20 blur-[25px] rounded-full animate-pulse-slow" />
                    <img
                        src="/images/logos/EnhancedHR-logo-mark-flame.png"
                        alt="Prometheus AI"
                        className="w-20 h-20 relative z-10 drop-shadow-[0_0_20px_rgba(255,147,0,0.4)] object-contain"
                    />
                </div>
                {/* Text */}
                <div className="text-center">
                    <h1 className="text-lg font-extralight text-white tracking-tight mb-0.5">
                        Prometheus <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-amber-400">AI</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 font-light">Your personal learning assistant</p>
                </div>
            </div>

            {/* Prompt Section - Right Column - Extends to right margin */}
            <div className="flex-1 flex flex-col">

                {/* View More Button - Aligned Right */}
                <div className="flex justify-end mb-2">
                    <button
                        onClick={onOpenDrawer}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue-light/10 hover:bg-brand-blue-light/20 border border-brand-blue-light/30 text-brand-blue-light text-[10px] font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_12px_rgba(120,192,240,0.2)]"
                    >
                        <Sparkles size={10} />
                        <span>More Prompts</span>
                    </button>
                </div>

                {/* Prompt Cards - 2x2 Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* Fallback mock if fetch is slow, or map from state. Dashboard uses hardcoded in render map? No, it used state. 
                        Actually Dashboard mapped hardcoded array in the render, but I see `heroPrompts` state. 
                        Wait, Dashboard render mapped a hardcoded array of `card` objects in the snippet I read?
                        Yes: `{[ {id: 'cap-1', ...} ].map(...)` 
                        So Dashboard IGNORES `heroPrompts` for the cards? 
                        Let's re-read dashboard snippet.
                        Lines 178-207 in dashboard snippet show a HARDCODED array being mapped.
                        So I should use that for visual consistency.
                    */}
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
                            className="group relative bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-4 text-left transition-all duration-300"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-500`} />
                            <div className="relative z-10">
                                <h3 className="text-sm font-medium text-slate-200 group-hover:text-white mb-0.5 transition-colors">{card.title}</h3>
                                <p className="text-xs text-slate-600 group-hover:text-slate-400 transition-colors">{card.description}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Input Box - Tight against prompts */}
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

                {/* AI Disclaimer - Centered below prompt box */}
                <p className="text-center text-[9px] text-slate-500/50 mt-2">AI can make mistakes. Verify important information.</p>

            </div>
        </div>
    );
};

export default PrometheusDashboardWidget;
