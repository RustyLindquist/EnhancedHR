import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConversationModalProps {
    isOpen: boolean;
    conversationTitle: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteConversationModal: React.FC<DeleteConversationModalProps> = ({
    isOpen,
    conversationTitle,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <AlertTriangle size={24} className="text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Delete Conversation?</h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-slate-300 leading-relaxed">
                        Are you sure you want to permanently delete <span className="font-semibold text-white">"{conversationTitle}"</span>?
                    </p>
                    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                        <p className="text-sm text-red-300">
                            This conversation will be removed from your history and any collections it has been saved to. This action cannot be undone.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-white/5">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all duration-200 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all duration-200 font-medium shadow-lg shadow-red-500/20"
                    >
                        Delete Conversation
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConversationModal;
