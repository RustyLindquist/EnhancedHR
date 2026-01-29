'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigationSafe } from '@/contexts/NavigationContext';

interface CanvasHeaderProps {
    context: string;
    title: string;
    children?: React.ReactNode;
    onBack?: () => void;
    backLabel?: string;
}

const CanvasHeader: React.FC<CanvasHeaderProps> = ({ context, title, children, onBack, backLabel }) => {
    // Get the navigation context (if available) to use its handler
    const navigation = useNavigationSafe();

    // Use the context's current handler if available, otherwise fall back to onBack prop
    const handleBack = () => {
        // First, try to use the prop directly (most specific)
        if (onBack) {
            onBack();
        } else if (navigation) {
            // If no onBack prop, check if there's a registered handler in the context
            const contextHandler = navigation.getCurrentHandler();
            if (contextHandler) {
                contextHandler();
            }
        }
    };

    // Show back button if we have either onBack prop or a context handler
    const showBackButton = onBack || (navigation?.hasBackHandler?.() ?? false);
    // Split title for styling (First word light, rest bold - mimicking the MainCanvas style)
    const titleParts = title.split(' ');
    const firstWord = titleParts[0];
    const restOfTitle = titleParts.slice(1).join(' ');

    return (
        <div className="h-24 flex-shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-xl z-30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] flex items-center justify-between px-10 relative">
            <div className="flex items-center gap-6">
                {showBackButton && (
                    <button
                        onClick={handleBack}
                        className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 active:scale-95"
                        title={backLabel || "Go Back"}
                    >
                        <ArrowLeft size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                    </button>
                )}
                <div>
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue-light drop-shadow-[0_0_5px_rgba(120,192,240,0.5)]">
                            {context}
                        </span>
                    </div>
                    <h1 className="text-3xl font-light text-white tracking-tight drop-shadow-lg">
                        {firstWord} <span className="font-bold text-white">{restOfTitle}</span>
                    </h1>
                </div>
            </div>

            <div className="flex space-x-4 items-center">
                {children}
            </div>
        </div>
    );
};

export default CanvasHeader;
