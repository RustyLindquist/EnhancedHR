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
    // Internal state to control the actual panel position, allowing animation on mount
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    // Track whether we should render the portal (true while open or animating closed)
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Synchronize internal state with isOpen prop, with a micro-delay for animation
    useEffect(() => {
        if (isOpen) {
            // Start rendering immediately when opening
            setShouldRender(true);
            // Use double requestAnimationFrame to ensure the closed state is painted first
            // This allows the CSS transition to animate from closed to open
            const frame = requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setInternalIsOpen(true);
                });
            });
            return () => cancelAnimationFrame(frame);
        } else {
            setInternalIsOpen(false);
            // Stop rendering after the close animation completes (500ms transition)
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 550); // Slightly longer than animation duration to ensure it completes
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const content = (
        <>
            {/* Backdrop */}
            <div
                className={`
                    fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] transition-opacity duration-500
                    ${internalIsOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
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
                    top: internalIsOpen ? '0' : '-100%'
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
    // Only render when the panel should be visible (open or animating closed)
    if (!mounted || !shouldRender) return null;
    return createPortal(content, document.body);
};

export default GlobalTopPanel;
