import React, { useState, useEffect, useRef } from 'react';
import { Flame, Sparkles, ArrowRight } from 'lucide-react';
import { PromptSuggestion, fetchPromptSuggestionsAction } from '@/app/actions/prompts';

// Accent colors for prompt cards (cycle through these)
const ACCENT_COLORS = [
    'from-blue-500/20 to-transparent',
    'from-emerald-500/20 to-transparent',
    'from-purple-500/20 to-transparent',
    'from-amber-500/20 to-transparent',
    'from-rose-500/20 to-transparent',
    'from-cyan-500/20 to-transparent'
];

interface PrometheusDashboardWidgetProps {
    onSetPrometheusPagePrompt: (prompt: string) => void;
    onOpenDrawer: () => void;
}

const PrometheusDashboardWidget: React.FC<PrometheusDashboardWidgetProps> = ({
    onSetPrometheusPagePrompt,
    onOpenDrawer
}) => {
    const [aiPrompt, setAiPrompt] = useState('');
    const [heroPrompts, setHeroPrompts] = useState<PromptSuggestion[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea as content changes
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const newHeight = Math.min(textarea.scrollHeight, 160);
            textarea.style.height = `${newHeight}px`;
        }
    }, [aiPrompt]);

    useEffect(() => {
        const loadPrompts = async () => {
            const prompts = await fetchPromptSuggestionsAction('user_dashboard');
            setHeroPrompts(prompts.slice(0, 6)); // Now showing 6 prompts
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
        <div className="relative z-10 w-full animate-fade-in">

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

            {/* Prompt Cards - Responsive Grid: 3 columns for 5+ prompts, 2 columns for fewer */}
            <div className={`grid gap-3 mb-3 ${heroPrompts.length >= 5 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {heroPrompts.map((prompt, index) => (
                    <button
                        key={prompt.id}
                        onClick={() => handlePromptClick(prompt.prompt)}
                        className="group relative bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-4 text-left transition-all duration-300"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${ACCENT_COLORS[index % ACCENT_COLORS.length]} opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-500`} />
                        <div className="relative z-10">
                            <h3 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors line-clamp-2">{prompt.label}</h3>
                        </div>
                    </button>
                ))}
            </div>

            {/* Input Box */}
            <div className="relative group/input">
                <div className="absolute -inset-px bg-gradient-to-r from-brand-blue-light/20 via-brand-orange/20 to-brand-blue-light/20 opacity-0 group-focus-within/input:opacity-100 blur-xl transition-opacity duration-500 rounded-xl" />
                <div className="relative bg-white/[0.03] border border-white/[0.08] rounded-xl flex items-end p-1.5">
                    <div className="p-2.5 text-brand-orange/60 mb-0.5">
                        <Flame size={18} />
                    </div>
                    <div className="flex-1 flex items-end">
                        <textarea
                            ref={textareaRef}
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (aiPrompt.trim()) {
                                        onSetPrometheusPagePrompt(aiPrompt);
                                        setAiPrompt('');
                                    }
                                }
                            }}
                            placeholder="Ask anything..."
                            rows={1}
                            className="flex-1 bg-transparent border-none outline-none text-base text-white placeholder-slate-400 px-2 py-2.5 font-light resize-none overflow-y-auto"
                            style={{
                                minHeight: '44px',
                                maxHeight: '160px'
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (aiPrompt.trim()) {
                                    onSetPrometheusPagePrompt(aiPrompt);
                                    setAiPrompt('');
                                }
                            }}
                            disabled={!aiPrompt.trim()}
                            className={`
                                p-2.5 rounded-lg transition-all duration-300 mr-1 mb-0.5
                                ${aiPrompt.trim()
                                    ? 'bg-brand-blue-light text-brand-black hover:bg-white'
                                    : 'bg-white/[0.03] text-slate-700 cursor-not-allowed'}
                            `}
                        >
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* AI Disclaimer - Centered below prompt box */}
            <p className="text-center text-[9px] text-slate-500/50 mt-2">AI can make mistakes. Verify important information.</p>

        </div>
    );
};

export default PrometheusDashboardWidget;
