'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const content = (
        <>
            {/* Backdrop */}
            <div
                className={`
                    fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] transition-opacity duration-500
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
                onClick={onClose}
            ></div>

            {/* Panel */}
            <div
                className={`
               fixed left-0 w-full z-[210]
               bg-[#0f172a]/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl
               transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col max-h-[75vh]
            `}
                style={{
                    top: isOpen ? '0' : '-100%'
                }}
            >
                {/* Header - Padding increased to clear sidebars (Nav: 288px, AI: ~400px) */}
                <div className="h-24 flex items-center justify-between px-10 md:pl-[300px] md:pr-[400px] border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-3 pl-[50px]">
                        {title}
                    </div>

                    <div className="flex items-center gap-[50px]">
                        {headerActions}

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden dropdown-scrollbar">
                    <div className="w-full h-full px-10 md:pl-[300px] md:pr-[400px] pb-[50px]">
                        {children}
                    </div>
                </div>
            </div>
        </>
    );

    // Use portal to render at document body level, outside any stacking context
    if (!mounted) return null;
    return createPortal(content, document.body);
};

export default GlobalTopPanel;
