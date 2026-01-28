'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface AssessmentConfirmDialogProps {
    isOpen: boolean;
    onSave: () => void;
    onDiscard: () => void;
    onCancel: () => void;
}

const AssessmentConfirmDialog: React.FC<AssessmentConfirmDialogProps> = ({
    isOpen,
    onSave,
    onDiscard,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 animate-fade-in">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <AlertTriangle size={24} className="text-orange-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Unsaved Progress</h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-slate-300 leading-relaxed">
                        You have unsaved assessment progress. Would you like to save your answers to continue later?
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-white/5">
                    <button
                        onClick={onDiscard}
                        className="px-6 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all duration-200 font-medium"
                    >
                        Discard
                    </button>
                    <button
                        onClick={onSave}
                        className="px-6 py-2.5 rounded-lg bg-brand-blue-light hover:bg-white text-brand-black transition-all duration-200 font-medium shadow-lg shadow-brand-blue-light/20"
                    >
                        Save Progress
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssessmentConfirmDialog;
