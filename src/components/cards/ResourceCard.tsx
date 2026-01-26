'use client';

import React from 'react';
import { Trash2, Plus, Clock, Download, Paperclip } from 'lucide-react';
import InteractiveCardWrapper from './InteractiveCardWrapper';

interface ResourceCardProps {
    title: string;
    author?: string;
    courseTitle?: string;
    fileSize?: string;
    fileUrl?: string;
    onDownload?: () => void;
    onAdd?: () => void;
    onRemove?: () => void;
    showRemove?: boolean; // Controls whether remove button is shown (false when in course view)
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
    title,
    author,
    courseTitle,
    fileSize,
    fileUrl,
    onDownload,
    onAdd,
    onRemove,
    showRemove = true,
    draggable,
    onDragStart
}) => {
    const [isDraggable, setIsDraggable] = React.useState(false);
    const [shouldPreventClick, setShouldPreventClick] = React.useState(false);

    // Check if we have a valid downloadable URL (not empty, not just '#')
    const hasValidUrl = fileUrl && fileUrl !== '#' && fileUrl.trim() !== '';

    const handleDragIntentChange = React.useCallback((isDragging: boolean) => {
        setIsDraggable(isDragging);
        if (isDragging) {
            setShouldPreventClick(true);
        }
    }, []);

    const handleDownload = () => {
        if (shouldPreventClick) {
            setShouldPreventClick(false);
            return;
        }
        if (!hasValidUrl && !onDownload) {
            return; // No valid URL and no custom handler
        }
        if (onDownload) {
            onDownload();
        } else if (hasValidUrl) {
            // Default download behavior
            const link = document.createElement('a');
            link.href = fileUrl!;
            link.download = title;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <InteractiveCardWrapper
            glowColor="rgba(239, 68, 68, 0.5)"
            disabled={false}
            onDragIntentChange={handleDragIntentChange}
        >
            <div
                draggable={draggable && isDraggable}
                onDragStart={(e) => {
                    if (isDraggable && onDragStart) {
                        // Hide native drag preview since we use CustomDragLayer
                        const emptyImg = new Image();
                        emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                        e.dataTransfer.setDragImage(emptyImg, 0, 0);
                        onDragStart(e);
                    } else {
                        e.preventDefault();
                    }
                }}
                onDragEnd={() => {
                    setIsDraggable(false);
                    setTimeout(() => setShouldPreventClick(false), 100);
                }}
                className={`relative group w-full flex flex-col aspect-[4/3] min-h-[310px] rounded-3xl overflow-hidden border border-red-500/30 bg-[#0B1120] shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] transition-shadow duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.4)] ${draggable && isDraggable ? 'cursor-grabbing' : draggable ? 'cursor-grab' : ''}`}
            >
            <div className="flex-1 flex flex-col min-h-0">
            {/* --- Top Section (Header with title centered) --- */}
            <div className="relative flex-[0.45] min-h-0 w-full overflow-hidden bg-red-900/50 transition-all duration-300">
                {/* Header Bar */}
                <div data-header-actions className="absolute top-0 left-0 w-full p-3 z-20 flex flex-col gap-2">
                    <div className="flex items-center justify-between bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/5 shadow-sm">
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/70 truncate mr-2">RESOURCE</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {showRemove && onRemove && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                                    className="text-white/40 hover:text-white transition-colors p-1"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                            {onAdd && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAdd(); }}
                                    className="text-white/40 hover:text-white transition-colors p-1"
                                >
                                    <Plus size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Title Section - Vertically centered between header and bottom */}
                <div className="absolute left-0 right-0 z-10 px-4 top-[calc(50%+20px)] -translate-y-1/2">
                    <h3 className="font-bold text-white leading-tight mb-1 drop-shadow-md line-clamp-2 text-[17px]">
                        {title}
                    </h3>
                    {author && (
                        <p className="text-xs font-medium text-white/70 tracking-wide truncate">
                            {author}
                        </p>
                    )}
                </div>

                {/* Paperclip Icon Overlay */}
                <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-[-15deg] pointer-events-none">
                    <Paperclip size={160} />
                </div>
            </div>

            {/* --- Bottom Section (Body) --- */}
            <div className="flex-[0.55] min-h-0 px-5 py-4 flex flex-col relative bg-[#0B1120] transition-all duration-300">
                {/* Description / Content Preview */}
                <div className="flex-1 overflow-hidden min-h-0">
                    <div className="mb-2">
                        <p className="text-[9px] font-bold text-brand-blue-light uppercase tracking-widest mb-1 opacity-70 truncate">
                            THIS IS A RESOURCE FROM
                        </p>
                        <p className="text-[13px] text-slate-300 line-clamp-2 font-light leading-snug">
                            {courseTitle || 'Course Materials'}
                        </p>
                    </div>
                </div>

                {/* Footer (File Size + Download) */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5 gap-2">
                    {/* Left side - file size */}
                    <div className="flex items-center gap-3 text-slate-500 overflow-hidden min-w-0">
                        {fileSize && (
                            <div className="flex items-center gap-1.5 truncate">
                                <Clock size={12} className="flex-shrink-0" />
                                <span className="text-[10px] font-bold tracking-wider uppercase truncate">( {fileSize} )</span>
                            </div>
                        )}
                    </div>

                    {/* Right side - download button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDownload();
                        }}
                        disabled={!hasValidUrl && !onDownload}
                        title={hasValidUrl || onDownload ? 'Download' : 'No file available'}
                        className={`flex-shrink-0 p-1 transition-colors ${
                            hasValidUrl || onDownload
                                ? 'text-slate-500 hover:text-white cursor-pointer'
                                : 'text-slate-700 cursor-not-allowed'
                        }`}
                    >
                        <Download size={16} />
                    </button>
                </div>
            </div>
            </div>
            </div>
        </InteractiveCardWrapper>
    );
};

export default ResourceCard;
