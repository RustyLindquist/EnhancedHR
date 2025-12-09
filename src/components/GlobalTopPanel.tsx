import React from 'react';
import { X } from 'lucide-react';

interface GlobalTopPanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: React.ReactNode;
    headerActions?: React.ReactNode;
    children: React.ReactNode;
}

const GlobalTopPanel: React.FC<GlobalTopPanelProps> = ({
    isOpen,
    onClose,
    title,
    headerActions,
    children
}) => {
    return (
        <>
            {/* Backdrop */}
            <div
                className={`
                    fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] transition-opacity duration-500
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
                onClick={onClose}
            ></div>

            {/* Panel */}
            <div
                className={`
               fixed top-0 left-0 w-full z-[100]
               bg-[#0f172a]/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl
               transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col max-h-[90vh]
               ${isOpen ? 'translate-y-0' : '-translate-y-full'}
            `}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-10 py-6 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {title}
                    </div>
                    <div className="flex items-center gap-4">
                        {headerActions && (
                            <div className="flex items-center gap-2">
                                {headerActions}
                            </div>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto w-full pb-[50px]"> {/* Expanded width for consistency */}
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
};

export default GlobalTopPanel;
