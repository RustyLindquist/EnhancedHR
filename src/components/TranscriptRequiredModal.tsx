import React from 'react';
import { FileText, Sparkles, X, RefreshCw, Bot, User, Youtube, Clock } from 'lucide-react';

type ModalMode = 'required' | 'video-changed';
type TranscriptSource = 'ai' | 'user' | 'mux-caption' | 'whisper' | 'youtube' | 'legacy' | 'none';

interface TranscriptRequiredModalProps {
    isOpen: boolean;
    mode: ModalMode;
    onClose: () => void;
    onEnterManually: () => void;
    onGenerateWithAI: () => void;
    onKeepCurrent?: () => void; // Only for 'video-changed' mode
    isGenerating?: boolean;
    // New props for dual transcript system
    currentTranscript?: string;
    transcriptSource?: TranscriptSource;
    onRegenerateAI?: () => void;
}

// Source badge component
const SourceBadge: React.FC<{ source: TranscriptSource }> = ({ source }) => {
    const getBadgeConfig = (src: TranscriptSource) => {
        switch (src) {
            case 'ai':
            case 'mux-caption':
            case 'whisper':
                return {
                    label: src === 'ai' ? 'AI Generated' : src === 'mux-caption' ? 'Mux Caption' : 'Whisper AI',
                    className: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                    icon: <Bot size={12} />
                };
            case 'user':
                return {
                    label: 'Manual Entry',
                    className: 'bg-green-500/20 text-green-300 border-green-500/30',
                    icon: <User size={12} />
                };
            case 'youtube':
                return {
                    label: 'YouTube',
                    className: 'bg-red-500/20 text-red-300 border-red-500/30',
                    icon: <Youtube size={12} />
                };
            case 'legacy':
                return {
                    label: 'Legacy',
                    className: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
                    icon: <Clock size={12} />
                };
            case 'none':
            default:
                return {
                    label: 'No Transcript',
                    className: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                    icon: <FileText size={12} />
                };
        }
    };

    const config = getBadgeConfig(source);

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${config.className}`}>
            {config.icon}
            {config.label}
        </span>
    );
};

const TranscriptRequiredModal: React.FC<TranscriptRequiredModalProps> = ({
    isOpen,
    mode,
    onClose,
    onEnterManually,
    onGenerateWithAI,
    onKeepCurrent,
    isGenerating = false,
    currentTranscript,
    transcriptSource = 'none',
    onRegenerateAI
}) => {
    if (!isOpen) return null;

    const isRequired = mode === 'required';
    const hasTranscript = currentTranscript && currentTranscript.trim().length > 0;
    const truncatedPreview = currentTranscript
        ? currentTranscript.slice(0, 200) + (currentTranscript.length > 200 ? '...' : '')
        : '';

    // Determine title based on mode and state
    const getTitle = () => {
        if (isRequired) {
            return hasTranscript ? 'Update Transcript' : 'Transcript Required';
        }
        return 'Video Changed';
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 animate-fade-in">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-blue-light/10 rounded-lg">
                            <FileText size={24} className="text-brand-blue-light" />
                        </div>
                        <h2 className="text-xl font-bold text-white">
                            {getTitle()}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        disabled={isGenerating}
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Source Badge and Status */}
                    {hasTranscript && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 uppercase tracking-wider">Current Source:</span>
                            <SourceBadge source={transcriptSource} />
                        </div>
                    )}

                    {/* Transcript Preview */}
                    {hasTranscript && truncatedPreview && (
                        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Preview</p>
                            <p className="text-sm text-slate-400 leading-relaxed">{truncatedPreview}</p>
                        </div>
                    )}

                    {isRequired ? (
                        <>
                            {!hasTranscript && (
                                <>
                                    <p className="text-slate-300 leading-relaxed">
                                        Every lesson needs a transcript to help learners and power the AI assistant.
                                    </p>
                                    <div className="bg-brand-blue-light/5 border border-brand-blue-light/20 rounded-lg p-4">
                                        <p className="text-sm text-slate-300">
                                            The transcript is how the Platform AI understands your lesson content.
                                            It enables learners to search, ask questions, and get relevant recommendations
                                            based on what you teach.
                                        </p>
                                    </div>
                                </>
                            )}
                            {hasTranscript && (
                                <p className="text-slate-300 leading-relaxed">
                                    You can update the transcript by entering it manually or regenerating it with AI.
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            <p className="text-slate-300 leading-relaxed">
                                You&apos;ve changed the video for this lesson. What would you like to do with the transcript?
                            </p>
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                                <p className="text-sm text-amber-200">
                                    If the new video has different content, you should update the transcript
                                    to match. This ensures the AI accurately represents your lesson.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer with Options */}
                <div className="p-6 border-t border-white/10 bg-white/5 space-y-3">
                    {/* Option 1: Enter Manually */}
                    <button
                        onClick={onEnterManually}
                        disabled={isGenerating}
                        className="w-full px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <FileText size={18} />
                        {isRequired ? 'Enter Transcript Manually' : 'Enter New Transcript'}
                    </button>

                    {/* Option 2: Keep Current (only for video-changed mode) */}
                    {!isRequired && onKeepCurrent && (
                        <button
                            onClick={onKeepCurrent}
                            disabled={isGenerating}
                            className="w-full px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all duration-200 font-medium disabled:opacity-50"
                        >
                            Keep Current Transcript
                        </button>
                    )}

                    {/* Option 3: Generate with AI (primary action) */}
                    <button
                        onClick={onGenerateWithAI}
                        disabled={isGenerating}
                        className="w-full px-6 py-3 rounded-lg bg-brand-blue-light hover:bg-brand-blue-light/90 text-slate-900 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg shadow-brand-blue-light/20 disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Generate with AI
                            </>
                        )}
                    </button>

                    {/* Option 4: Regenerate AI Transcript (secondary, only when transcript exists) */}
                    {hasTranscript && onRegenerateAI && transcriptSource !== 'user' && (
                        <button
                            onClick={onRegenerateAI}
                            disabled={isGenerating}
                            className="w-full px-6 py-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <RefreshCw size={18} />
                            Regenerate AI Transcript
                        </button>
                    )}

                    {/* Cancel link */}
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="w-full text-sm text-slate-500 hover:text-slate-400 transition-colors py-2 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TranscriptRequiredModal;
