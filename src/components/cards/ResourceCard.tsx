import React from 'react';
import { Trash2, Plus, Clock, Download, Paperclip } from 'lucide-react';

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
    const handleDownload = () => {
        if (onDownload) {
            onDownload();
        } else if (fileUrl) {
            // Default download behavior
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = title;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div
            draggable={draggable}
            onDragStart={onDragStart}
            className={`relative group w-full aspect-[4/3] min-h-[310px] rounded-3xl overflow-hidden border border-red-500/30 bg-[#0B1120] shadow-2xl transition-all hover:scale-[1.02] ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
            {/* --- Top Section (Header with title centered) --- */}
            <div className="relative h-[45%] w-full overflow-hidden bg-red-900/50 transition-all duration-300">
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
            <div className="h-[55%] px-5 py-4 flex flex-col justify-between relative bg-[#0B1120] transition-all duration-300">
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
                <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/5 gap-2">
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
                        className="text-slate-500 hover:text-white transition-colors flex-shrink-0 p-1"
                    >
                        <Download size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResourceCard;
