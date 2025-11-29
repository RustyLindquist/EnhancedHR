import React from 'react';

interface CanvasHeaderProps {
    context: string;
    title: string;
    children?: React.ReactNode; // For right-side actions
}

const CanvasHeader: React.FC<CanvasHeaderProps> = ({ context, title, children }) => {
    // Split title for styling (First word light, rest bold - mimicking the MainCanvas style)
    const titleParts = title.split(' ');
    const firstWord = titleParts[0];
    const restOfTitle = titleParts.slice(1).join(' ');

    return (
        <div className="h-24 flex-shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-xl z-30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] flex items-center justify-between px-10 relative">
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

            <div className="flex space-x-4 items-center">
                {children}
            </div>
        </div>
    );
};

export default CanvasHeader;
