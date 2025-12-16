import React from 'react';
import { Trash2, Plus, Play, FileText, MessageSquare, Clock, Download, Edit, Paperclip, Star, Award, User } from 'lucide-react';
import ConversationGraphic from '../graphics/ConversationGraphic';

export type CardType = 'COURSE' | 'MODULE' | 'LESSON' | 'RESOURCE' | 'CONVERSATION' | 'CONTEXT' | 'PROFILE';

interface UniversalCardProps {
    type: CardType;
    title: string;
    subtitle?: string;
    description?: string;
    meta?: string;
    actionLabel?: string;
    imageUrl?: string; // For Course/Module/Lesson backgrounds
    categories?: string[]; // Up to 3
    rating?: number; // 0-5
    credits?: { shrm?: number | boolean; hrci?: number | boolean }; // Available credits
    onAction?: () => void;
    onRemove?: () => void;
    onAdd?: () => void;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
}

const UniversalCard: React.FC<UniversalCardProps> = ({
    type,
    title,
    subtitle,
    description,
    meta,
    actionLabel,
    imageUrl,
    categories,
    rating,
    credits,
    onAction,
    onRemove,
    onAdd,
    draggable,
    onDragStart
}) => {

    // Configuration based on Type
    const config = {
        COURSE: {
            headerColor: 'bg-[#0B1120]', // Fallback
            borderColor: 'border-blue-500/30',
            labelColor: 'text-slate-400',
            barColor: 'hidden', // Uses image
            icon: null,
            buttonStyle: 'bg-white/10 hover:bg-white/20 text-white'
        },
        MODULE: {
            headerColor: 'bg-[#0B1120]',
            borderColor: 'border-blue-500/30',
            labelColor: 'text-slate-400',
            barColor: 'hidden',
            icon: null,
            buttonStyle: 'bg-white/10 hover:bg-white/20 text-white'
        },
        LESSON: {
            headerColor: 'bg-[#0B1120]',
            borderColor: 'border-blue-500/30',
            labelColor: 'text-slate-400',
            barColor: 'hidden',
            icon: null,
            buttonStyle: 'bg-white/10 hover:bg-white/20 text-white'
        },
        RESOURCE: { // Red/Terra-cotta
            headerColor: 'bg-[#4A2020]',
            borderColor: 'border-red-500/30',
            labelColor: 'text-red-200',
            barColor: 'bg-red-900/50', // Solid header bg
            icon: Paperclip,
            buttonStyle: 'text-slate-400 hover:text-white' // Icon only usually, or minimal
        },
        CONVERSATION: { // Blue/Teal -> Dark Mode Theme
            headerColor: 'bg-[#052333]', // Brand Dark Blue
            borderColor: 'border-[#78C0F0]/30', // Light Blue Accent
            labelColor: 'text-[#78C0F0]',
            barColor: 'bg-[#052333]/90',
            icon: ConversationGraphic,
            buttonStyle: 'bg-white/10 hover:bg-white/20 text-white'
        },
        CONTEXT: { // Brand Orange
            headerColor: 'bg-[#7c2d12]', // Deep Orange/Amber base
            borderColor: 'border-orange-500/30',
            labelColor: 'text-orange-200',
            barColor: 'bg-[#ea580c]/80', // Orange-600
            icon: FileText,
            buttonStyle: 'bg-white/10 hover:bg-white/20 text-white'
        },
        PROFILE: { // Brand Medium Blue
            headerColor: 'bg-[#054C74]',
            borderColor: 'border-cyan-400/30',
            labelColor: 'text-cyan-200',
            barColor: 'bg-[#0284c7]/80', // Sky-600
            icon: User,
            buttonStyle: 'bg-white/10 hover:bg-white/20 text-white'
        }
    }[type];

    // Inference from image:
    // Top Row (Course/Module/Lesson) has an image background taking up the top half.
    // Bottom Row (Resource/Context/Conv) has a colored "Header Block".

    const isMediaCard = ['COURSE', 'MODULE', 'LESSON'].includes(type);

    // Layout Tweaks:
    // Conversation, Context & Resource need more text space (40% top / 60% bottom)
    const isTextHeavy = ['CONVERSATION', 'CONTEXT', 'RESOURCE', 'PROFILE'].includes(type);
    const topHeight = isTextHeavy ? 'h-[45%]' : 'h-[60%]';
    const bottomHeight = isTextHeavy ? 'h-[55%]' : 'h-[40%]';

    return (
        <div
            draggable={draggable}
            onDragStart={onDragStart}
            className={`relative group w-full aspect-[4/3] min-h-[310px] rounded-3xl overflow-hidden border border-white/10 bg-[#0B1120] shadow-2xl transition-all hover:scale-[1.02] ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >

            {/* --- Top Section --- */}
            <div className={`relative ${topHeight} w-full overflow-hidden ${isMediaCard ? 'bg-black' : config.barColor} transition-all duration-300`}>

                {/* Background Image for Media Cards */}
                {isMediaCard && imageUrl && (
                    <>
                        <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/30 to-transparent"></div>
                    </>
                )}

                {/* Header Section (Type, Actions, Metadata) */}
                <div className="absolute top-0 left-0 w-full p-3 z-20 flex flex-col gap-2">

                    {/* Row 1: Type Label & Core Actions */}
                    <div className="flex items-center justify-between bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/5 shadow-sm">
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/70 truncate mr-2">{type.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {onRemove && (
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

                    {/* Row 2: Categories (Left) & Rating (Right) - Course Only */}
                    {type === 'COURSE' && (
                        <div className="flex justify-between items-start px-1">
                            {/* Categories */}
                            <div className="flex flex-wrap gap-1.5 max-w-[75%]">
                                {categories?.slice(0, 3).map((cat, i) => (
                                    <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/40 backdrop-blur-md text-slate-300 border border-white/10 uppercase tracking-wide shadow-sm">
                                        {cat}
                                    </span>
                                ))}
                            </div>

                            {/* Rating */}
                            {rating !== undefined && (
                                <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-sm text-amber-400">
                                    <Star size={10} fill="currentColor" />
                                    <span className="text-[10px] font-bold leading-none">{rating.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Title Section */}
                <div className={`absolute left-0 right-0 z-10 px-4 ${isTextHeavy ? 'top-1/2 -translate-y-1/2 pt-8' : 'bottom-4'}`}>
                    <h3 className={`font-bold text-white leading-tight mb-1 drop-shadow-md line-clamp-2 ${isTextHeavy ? 'text-[17px]' : 'text-lg'}`}>
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-xs font-medium text-white/70 tracking-wide truncate">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* File Icon Overlay for Resource/Context */}
                {!isMediaCard && config.icon && (
                    <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-[-15deg] pointer-events-none">
                        <config.icon size={160} />
                    </div>
                )}
                {/* Conversation Bubbles Overlay */}
                {type === 'CONVERSATION' && (
                    <div className="absolute right-4 bottom-4 opacity-10 pointer-events-none">
                        <MessageSquare size={100} fill="currentColor" />
                    </div>
                )}

            </div>

            {/* --- Bottom Section (Body) --- */}
            <div className={`${bottomHeight} px-5 py-4 flex flex-col justify-between relative bg-[#0B1120] transition-all duration-300`}>

                {/* Description / Content Preview */}
                <div className="flex-1 overflow-hidden min-h-0">

                    {type === 'MODULE' || type === 'LESSON' || type === 'RESOURCE' ? (
                        <div className="mb-2">
                            <p className="text-[9px] font-bold text-brand-blue-light uppercase tracking-widest mb-1 opacity-70 truncate">
                                {type === 'RESOURCE' ? 'THIS IS A RESOURCE FROM' : `THIS IS A ${type} FROM`}
                            </p>
                            <p className="text-[13px] text-slate-300 line-clamp-2 font-light leading-snug">{description}</p>
                        </div>
                    ) : (
                        <p className="text-[13px] text-slate-300 leading-relaxed line-clamp-4 font-light">
                            {description}
                        </p>
                    )}
                </div>

                {/* Footer (Meta + Action) */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 gap-2">
                    <div className="flex items-center gap-3 text-slate-500 overflow-hidden min-w-0">

                        {meta && (
                            <div className="flex items-center gap-1.5 truncate">
                                <Clock size={12} className="flex-shrink-0" />
                                <span className="text-[10px] font-bold tracking-wider uppercase truncate">{meta}</span>
                            </div>
                        )}

                        {/* Course Credits */}
                        {type === 'COURSE' && credits && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {credits.shrm && (
                                    <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-[#4f46e5]/20 text-[#818cf8] border border-[#4f46e5]/30" title="SHRM Credits">SHRM</span>
                                )}
                                {credits.hrci && (
                                    <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-[#9333ea]/20 text-[#c084fc] border border-[#9333ea]/30" title="HRCI Credits">HRCI</span>
                                )}
                            </div>
                        )}
                    </div>

                    {actionLabel && (
                        <button
                            onClick={onAction}
                            className={`
                                flex items-center gap-1.5 px-3 py-1.5 rounded-full
                                text-[9px] font-bold uppercase tracking-widest transition-all
                                border border-white/10 flex-shrink-0 whitespace-nowrap
                                ${config.buttonStyle}
                            `}
                        >
                            {actionLabel}
                            <Play size={8} fill="currentColor" />
                        </button>
                    )}

                    {/* Resource Download Icon Override */}
                    {type === 'RESOURCE' && (
                        <button className="text-slate-500 hover:text-white transition-colors flex-shrink-0 p-1">
                            <Download size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Color Band for Non-Media Cards (Top Border or distinct style?) */}
            {/* The design seems to have a colored top section. I used config.barColor for that. */}

        </div>
    );
};

export default UniversalCard;
