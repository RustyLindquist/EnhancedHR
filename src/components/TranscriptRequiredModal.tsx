import React from 'react';
import { FileText, Sparkles, X } from 'lucide-react';

type ModalMode = 'required' | 'video-changed';

interface TranscriptRequiredModalProps {
    isOpen: boolean;
    mode: ModalMode;
    onClose: () => void;
    onEnterManually: () => void;
    onGenerateWithAI: () => void;
    onKeepCurrent?: () => void; // Only for 'video-changed' mode
    isGenerating?: boolean;
}

const TranscriptRequiredModal: React.FC<TranscriptRequiredModalProps> = ({
    isOpen,
    mode,
    onClose,
    onEnterManually,
    onGenerateWithAI,
    onKeepCurrent,
    isGenerating = false
}) => {
    if (!isOpen) return null;

    const isRequired = mode === 'required';

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
                            {isRequired ? 'Transcript Required' : 'Video Changed'}
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
                    {isRequired ? (
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

                    {/* Option 3: Generate with AI */}
                    <button
                        onClick={onGenerateWithAI}
                        disabled={isGenerating}
                        className="w-full px-6 py-3 rounded-lg bg-brand-blue-light hover:bg-brand-blue-light/90 text-slate-900 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg shadow-brand-blue-light/20 disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Generate with AI
                            </>
                        )}
                    </button>

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
