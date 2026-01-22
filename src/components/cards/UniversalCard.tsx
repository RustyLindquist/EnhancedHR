'use client';

import React from 'react';
import { Trash2, Plus, Play, FileText, MessageSquare, Clock, Download, Edit, Paperclip, Star, Award, User, HelpCircle, StickyNote, Wrench, TrendingUp, Drama, LucideIcon, Building, Layers, BookOpen } from 'lucide-react';
import ConversationGraphic from '../graphics/ConversationGraphic';
import InteractiveCardWrapper from './InteractiveCardWrapper';

export type CardType = 'COURSE' | 'MODULE' | 'LESSON' | 'RESOURCE' | 'CONVERSATION' | 'CONTEXT' | 'AI_INSIGHT' | 'PROFILE' | 'HELP' | 'NOTE' | 'TOOL' | 'TOOL_CONVERSATION' | 'ORG_COLLECTION' | 'ORG_COURSE';

// Icon mapping for dynamic icon names
const TOOL_ICON_MAP: Record<string, LucideIcon> = {
    'Wrench': Wrench,
    'TrendingUp': TrendingUp,
    'Drama': Drama,
    'MessageSquare': MessageSquare,
    'User': User,
    'FileText': FileText,
};

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
    collections?: string[]; // List of collection names for footer display
    iconName?: string; // Dynamic icon name for TOOL cards (e.g., 'Drama', 'TrendingUp')
    contextSubtype?: 'TEXT' | 'FILE'; // For CONTEXT cards to differentiate text vs file
    fileUrl?: string; // For FILE context cards and RESOURCE cards - URL to download the file
    fileName?: string; // For FILE context cards and RESOURCE cards - filename for download
    resourceType?: string; // For RESOURCE cards - file type (PDF, DOC, etc.)
    onAction?: () => void;
    onRemove?: () => void;
    onAdd?: () => void;
    onDownload?: () => void; // For FILE context cards - download handler
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
}

// Click handler for card body (excluding header area)
const handleCardBodyClick = (e: React.MouseEvent, onAction?: () => void) => {
    // Don't trigger if clicking on header actions area
    const target = e.target as HTMLElement;
    if (target.closest('[data-header-actions]')) {
        return;
    }
    onAction?.();
};

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
    collections,
    iconName,
    contextSubtype,
    fileUrl,
    fileName,
    resourceType,
    onAction,
    onRemove,
    onAdd,
    onDownload,
    draggable,
    onDragStart
}) => {
    // Get dynamic icon for TOOL cards
    const DynamicToolIcon = iconName && TOOL_ICON_MAP[iconName] ? TOOL_ICON_MAP[iconName] : Wrench;

    // Configuration based on Type
    const config = {
        COURSE: {
            headerColor: 'bg-[#0B1120]', // Fallback
            borderColor: 'border-blue-500/30',
            labelColor: 'text-slate-400',
            barColor: 'hidden', // Uses image
            icon: null,
            buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
            glowColor: 'rgba(120, 192, 240, 0.6)' // Brand blue light
        },
        MODULE: {
            headerColor: 'bg-[#0B1120]',
            borderColor: 'border-blue-500/30',
            labelColor: 'text-slate-400',
            barColor: 'hidden',
            icon: null,
            buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
            glowColor: 'rgba(120, 192, 240, 0.6)'
        },
        LESSON: {
            headerColor: 'bg-[#063F5F]',
            borderColor: 'border-[#78C0F0]/30',
            labelColor: 'text-[#78C0F0]',
            barColor: 'hidden',
            icon: null,
            buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
            glowColor: 'rgba(120, 192, 240, 0.6)',
            bodyColor: 'bg-[#063F5F]'
        },
        RESOURCE: { // Red/Terra-cotta
            headerColor: 'bg-[#4A2020]',
            borderColor: 'border-red-500/30',
            labelColor: 'text-red-200',
            barColor: 'bg-red-900/50', // Solid header bg
            icon: Paperclip,
            buttonStyle: 'text-slate-400 hover:text-white',
            glowColor: 'rgba(239, 68, 68, 0.5)' // Red
        },
        CONVERSATION: { // Blue/Teal -> Dark Mode Theme
            headerColor: 'bg-[#054C74]', // Brand Medium Blue
            borderColor: 'border-[#78C0F0]/30', // Light Blue Accent
            labelColor: 'text-[#78C0F0]',
            barColor: 'bg-[#054C74]',
            icon: ConversationGraphic,
            buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
            glowColor: 'rgba(120, 192, 240, 0.6)'
        },
        CONTEXT: { // Brand Orange
            headerColor: 'bg-[#7c2d12]', // Deep Orange/Amber base
            borderColor: 'border-orange-500/30',
            labelColor: 'text-orange-200',
            barColor: 'bg-[#ea580c]/80', // Orange-600
            icon: FileText,
            buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
            glowColor: 'rgba(234, 88, 12, 0.5)' // Orange
        },
        AI_INSIGHT: { // Bright Orange #FF9300 for AI-generated insights
            headerColor: 'bg-[#7a4500]', // Darker base for contrast
            borderColor: 'border-[#FF9300]/40',
            labelColor: 'text-orange-100',
            barColor: 'bg-[#FF9300]', // Bright orange as requested
            icon: FileText,
            buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
            glowColor: 'rgba(255, 147, 0, 0.6)' // #FF9300 glow
        },
        PROFILE: { // Brand Medium Blue
            headerColor: 'bg-[#054C74]',
            borderColor: 'border-cyan-400/30',
            labelColor: 'text-cyan-200',
            barColor: 'bg-[#0284c7]/80', // Sky-600
            icon: User,
            buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
            glowColor: 'rgba(34, 211, 238, 0.5)' // Cyan
        },
        HELP: { // Help/Features Card - User specified #4B8BB3
            headerColor: 'bg-[#4B8BB3]',
            borderColor: 'border-[#4B8BB3]/30',
            labelColor: 'text-white',
            barColor: 'bg-[#4B8BB3]',
            icon: HelpCircle,
            buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
            glowColor: 'rgba(75, 139, 179, 0.6)' // #4B8BB3 glow
        },
        NOTE: { // Notes Card - Classic Sticky Note Yellow #F5E6A3
            headerColor: 'bg-[#F5E6A3]',
            borderColor: 'border-[#D4C078]/60',
            labelColor: 'text-slate-700',
            barColor: 'bg-[#F5E6A3]',
            icon: StickyNote,
            buttonStyle: 'bg-black/10 hover:bg-black/20 text-slate-700',
            glowColor: 'rgba(245, 230, 163, 0.5)', // Warm yellow glow
            bodyColor: 'bg-[#F5E6A3]', // Solid sticky note yellow
            footerTextColor: 'text-slate-600'
        },
        TOOL: { // Tools Card - Teal #0D9488
            headerColor: 'bg-[#0D9488]',
            borderColor: 'border-teal-500/30',
            labelColor: 'text-teal-100',
            barColor: 'bg-[#0D9488]',
            icon: Wrench,
            buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
            glowColor: 'rgba(13, 148, 136, 0.6)', // Teal glow
            bodyColor: 'bg-[#0D9488]/90'
        },
        TOOL_CONVERSATION: { // Tool Conversation Card - Teal #0D9488
            headerColor: 'bg-[#0D9488]',
            borderColor: 'border-teal-500/30',
            labelColor: 'text-teal-100',
            barColor: 'bg-[#0D9488]',
            icon: MessageSquare,
            buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
            glowColor: 'rgba(13, 148, 136, 0.6)', // Teal glow
            bodyColor: 'bg-[#0D9488]/90'
        },
        ORG_COLLECTION: { // Org Collection Card - Blue/Corporate
            headerColor: 'bg-[#1e3a5f]',
            borderColor: 'border-blue-500/30',
            labelColor: 'text-blue-200',
            barColor: 'bg-[#1e3a5f]',
            icon: Building,
            buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
            glowColor: 'rgba(59, 130, 246, 0.5)', // Blue glow
            bodyColor: 'bg-[#1e3a5f]/90'
        },
        ORG_COURSE: { // Org Course Card - Warm amber/orange
            headerColor: 'bg-amber-950',
            borderColor: 'border-amber-500/30',
            labelColor: 'text-amber-200',
            barColor: 'bg-amber-600/80',
            icon: BookOpen,
            buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
            glowColor: 'rgba(217, 119, 6, 0.5)', // Amber glow
            bodyColor: 'bg-amber-950'
        }
    }[type];

    // Inference from image:
    // Top Row (Course/Module/Lesson) has an image background taking up the top half.
    // Bottom Row (Resource/Context/Conv) has a colored "Header Block".

    const isMediaCard = ['COURSE', 'MODULE', 'LESSON', 'ORG_COURSE'].includes(type);

    // Layout Tweaks:
    // Conversation, Context, AI_Insight, Resource, Profile, Help, Note, Tool, Tool_Conversation & Org_Collection need more text space (40% top / 60% bottom)
    const isTextHeavy = ['CONVERSATION', 'CONTEXT', 'AI_INSIGHT', 'RESOURCE', 'PROFILE', 'HELP', 'NOTE', 'TOOL', 'TOOL_CONVERSATION', 'ORG_COLLECTION'].includes(type);
    const topHeight = isTextHeavy ? 'h-[45%]' : 'h-[60%]';
    const bottomHeight = isTextHeavy ? 'h-[55%]' : 'h-[40%]';

    // For Course, Module, Lesson, Conversation, Context, AI_Insight, Profile, Help, Note, Tool, Tool_Conversation, Org_Collection, and Org_Course cards, the entire card body is clickable
    const isClickableCard = type === 'COURSE' || type === 'MODULE' || type === 'LESSON' || type === 'CONVERSATION' || type === 'CONTEXT' || type === 'AI_INSIGHT' || type === 'PROFILE' || type === 'HELP' || type === 'NOTE' || type === 'TOOL' || type === 'TOOL_CONVERSATION' || type === 'ORG_COLLECTION' || type === 'ORG_COURSE';

    const [isDraggable, setIsDraggable] = React.useState(false);
    const [shouldPreventClick, setShouldPreventClick] = React.useState(false);
    const didDragRef = React.useRef(false);

    const handleDragIntentChange = React.useCallback((isDragging: boolean) => {
        setIsDraggable(isDragging);
        // Don't set shouldPreventClick here - only set it when actual drag starts
    }, []);

    const handleClick = React.useCallback((e: React.MouseEvent) => {
        if (shouldPreventClick) {
            e.preventDefault();
            e.stopPropagation();
            setShouldPreventClick(false);
            return;
        }
        if (isClickableCard) {
            handleCardBodyClick(e, onAction);
        }
    }, [shouldPreventClick, isClickableCard, onAction]);

    return (
        <InteractiveCardWrapper
            glowColor={config.glowColor}
            disabled={false}
            onDragIntentChange={handleDragIntentChange}
        >
            <div
                draggable={draggable && isDraggable}
                onDragStart={(e) => {
                    if (isDraggable && onDragStart) {
                        // Mark that a drag actually started - this will prevent click
                        didDragRef.current = true;
                        setShouldPreventClick(true);
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
                    didDragRef.current = false;
                    setTimeout(() => setShouldPreventClick(false), 100);
                }}
                onClick={handleClick}
                className={`relative group w-full aspect-[4/3] min-h-[310px] rounded-3xl overflow-hidden border ${type === 'LESSON' ? 'border-[#78C0F0]/20' : type === 'NOTE' ? 'border-[#D4C078]/60' : type === 'ORG_COURSE' ? 'border-amber-500/30' : 'border-white/10'} ${type === 'LESSON' ? 'bg-[#063F5F]' : type === 'NOTE' ? 'bg-[#F5E6A3]' : type === 'ORG_COURSE' ? 'bg-amber-950' : 'bg-[#0B1120]'} shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] transition-shadow duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.4)] ${draggable && isDraggable ? 'cursor-grabbing' : draggable ? 'cursor-grab' : ''} ${isClickableCard && onAction ? 'cursor-pointer' : ''}`}
            >

            {/* --- Top Section --- */}
            <div className={`relative ${topHeight} w-full overflow-hidden ${isMediaCard ? 'bg-black' : config.barColor} transition-all duration-300`}>

                {/* Background Image for Media Cards */}
                {isMediaCard && imageUrl && (
                    <>
                        <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-90" />
                        {type === 'LESSON' ? (
                            <div className="absolute inset-0 bg-gradient-to-t from-[#063F5F] via-[#063F5F]/30 to-transparent"></div>
                        ) : type === 'ORG_COURSE' ? (
                            <div className="absolute inset-0 bg-gradient-to-t from-amber-950 via-amber-950/30 to-transparent"></div>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/30 to-transparent"></div>
                        )}
                    </>
                )}

                {/* Header Section (Type, Actions, Metadata) */}
                <div data-header-actions className="absolute top-0 left-0 w-full p-3 z-20 flex flex-col gap-2">

                    {/* Row 1: Type Label & Core Actions */}
                    <div className={`flex items-center justify-between ${type === 'NOTE' ? 'bg-slate-800/60' : 'bg-black/40'} backdrop-blur-sm px-3 py-1.5 rounded-lg border ${type === 'NOTE' ? 'border-slate-700/30' : 'border-white/5'} shadow-sm`}>
                        <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${type === 'NOTE' ? 'text-white/90' : 'text-white/70'} truncate mr-2`}>{type === 'AI_INSIGHT' ? 'CONTEXT' : type === 'HELP' ? 'FEATURES' : type === 'CONTEXT' && contextSubtype ? `CONTEXT (${contextSubtype})` : type.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {onRemove && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                                    className={`${type === 'NOTE' ? 'text-white/60 hover:text-white' : 'text-white/40 hover:text-white'} transition-colors p-1`}
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                            {/* Download button for FILE context cards and RESOURCE cards */}
                            {((type === 'CONTEXT' && contextSubtype === 'FILE') || type === 'RESOURCE') && fileUrl && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Open in new tab for download
                                        window.open(fileUrl, '_blank');
                                    }}
                                    className="text-white/40 hover:text-white transition-colors p-1"
                                    title="Download file"
                                >
                                    <Download size={14} />
                                </button>
                            )}
                            {onAdd && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAdd(); }}
                                    className={`${type === 'NOTE' ? 'text-white/60 hover:text-white' : 'text-white/40 hover:text-white'} transition-colors p-1`}
                                >
                                    <Plus size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Title Section */}
                {/* Conversation, Context, AI_Insight, Profile, Help, Note cards: centered between header bar and bottom of top section */}
                {/* Other text-heavy cards: centered with padding for header */}
                {/* Media cards: positioned at bottom */}
                <div className={`absolute left-0 right-0 z-10 px-4 ${
                    (type === 'CONVERSATION' || type === 'CONTEXT' || type === 'AI_INSIGHT' || type === 'PROFILE' || type === 'HELP' || type === 'NOTE' || type === 'TOOL' || type === 'TOOL_CONVERSATION')
                        ? 'top-[calc(50%+20px)] -translate-y-1/2'
                        : isTextHeavy
                            ? 'top-1/2 -translate-y-1/2 pt-8'
                            : 'bottom-4'
                }`}>
                    <h3 className={`font-bold ${type === 'NOTE' ? 'text-slate-800' : 'text-white'} leading-tight mb-1 ${type === 'NOTE' ? '' : 'drop-shadow-md'} line-clamp-2 ${isTextHeavy ? 'text-[17px]' : 'text-lg'}`}>
                        {title}
                    </h3>
                    {/* Author line with rating for Course cards */}
                    {(type === 'COURSE' || type === 'ORG_COURSE') ? (
                        <div className="flex items-center justify-between gap-2">
                            {subtitle && (
                                <p className="text-xs font-medium text-white/70 tracking-wide truncate">
                                    {subtitle}
                                </p>
                            )}
                            {rating !== undefined && (
                                <div className="flex items-center gap-1 text-amber-400 flex-shrink-0">
                                    <Star size={14} fill="currentColor" />
                                    <span className="text-sm font-bold leading-none">{rating.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                    ) : type !== 'CONVERSATION' && type !== 'CONTEXT' && type !== 'AI_INSIGHT' && type !== 'PROFILE' && type !== 'HELP' && type !== 'TOOL' && type !== 'TOOL_CONVERSATION' && subtitle ? (
                        <p className="text-xs font-medium text-white/70 tracking-wide truncate">
                            {subtitle}
                        </p>
                    ) : null}
                </div>

                {/* File Icon Overlay for Resource/Context/Tool */}
                {!isMediaCard && config.icon && (
                    <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-[-15deg] pointer-events-none">
                        {type === 'TOOL' ? (
                            <DynamicToolIcon size={160} />
                        ) : type === 'CONTEXT' && contextSubtype === 'FILE' ? (
                            <Paperclip size={160} />
                        ) : (
                            <config.icon size={160} />
                        )}
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
            <div className={`${bottomHeight} px-5 py-4 flex flex-col justify-between relative ${(config as any).bodyColor || 'bg-[#0B1120]'} transition-all duration-300`}>

                {/* Description / Content Preview */}
                <div className="flex-1 min-h-0 relative z-10">

                    {type === 'MODULE' || type === 'LESSON' ? (
                        <div className="mb-2">
                            <p className="text-[9px] font-bold text-brand-blue-light uppercase tracking-widest mb-1 opacity-70 truncate">
                                {`THIS IS A ${type} FROM`}
                            </p>
                            <p className="text-[13px] text-slate-300 line-clamp-2 font-light leading-snug">{description}</p>
                        </div>
                    ) : type === 'NOTE' ? (
                        <p className="text-[13px] text-slate-700 leading-relaxed line-clamp-3 font-light">
                            {description}
                        </p>
                    ) : (
                        <p className="text-[13px] text-slate-300 leading-relaxed line-clamp-3 font-light">
                            {description}
                        </p>
                    )}
                </div>

                {/* Footer (Meta + Action) */}
                <div className={`flex items-center justify-between mt-4 pt-2 border-t ${type === 'NOTE' ? 'border-slate-400/30' : 'border-white/5'} gap-2 relative z-10`}>
                    {/* Left side content - meta for cards that show it on left */}
                    <div className="flex items-center gap-3 text-slate-500 overflow-hidden min-w-0">
                        {/* Meta (date/duration) on left for cards that don't show date on right */}
                        {type !== 'CONVERSATION' && type !== 'CONTEXT' && type !== 'AI_INSIGHT' && type !== 'PROFILE' && type !== 'HELP' && type !== 'NOTE' && type !== 'TOOL' && type !== 'TOOL_CONVERSATION' && type !== 'RESOURCE' && meta && (
                            <div className="flex items-center gap-1.5 truncate">
                                <Clock size={12} className="flex-shrink-0" />
                                <span className="text-[10px] font-bold tracking-wider uppercase truncate">{meta}</span>
                            </div>
                        )}

                        {/* Resource type on left for RESOURCE cards */}
                        {type === 'RESOURCE' && resourceType && (
                            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 truncate">{resourceType}</span>
                        )}

                        {/* Course Credits */}
                        {(type === 'COURSE' || type === 'ORG_COURSE') && credits && (
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

                    {/* Course, Module, and Org Course cards: Show categories in footer instead of action button */}
                    {(type === 'COURSE' || type === 'MODULE' || type === 'ORG_COURSE') && categories && categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 justify-end flex-shrink-0">
                            {categories.slice(0, 3).map((cat, i) => (
                                <span key={i} className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/5 text-slate-400 border border-white/10 uppercase tracking-wide">
                                    {cat}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* NOTE cards: Show collections on left and date on right */}
                    {type === 'NOTE' && (
                        <>
                            {/* Left side: Collections list */}
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                {collections && collections.length > 0 ? (
                                    <span className="text-[10px] font-medium text-slate-600 truncate">
                                        {collections.slice(0, 2).join(', ')}
                                        {collections.length > 2 && ` +${collections.length - 2}`}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-slate-500 italic">No collections</span>
                                )}
                            </div>
                            {/* Right side: Date */}
                            {meta && (
                                <div className="flex items-center gap-1.5 text-slate-600 flex-shrink-0">
                                    <Clock size={12} />
                                    <span className="text-[10px] font-bold tracking-wider uppercase">{meta}</span>
                                </div>
                            )}
                        </>
                    )}

                    {/* Conversation, Context, AI_Insight, Profile, Help, Tool_Conversation, Resource cards: Show date on right (no button) */}
                    {(type === 'CONVERSATION' || type === 'CONTEXT' || type === 'AI_INSIGHT' || type === 'PROFILE' || type === 'HELP' || type === 'TOOL_CONVERSATION' || type === 'RESOURCE') && meta && (
                        <div className="flex items-center gap-1.5 text-slate-500 flex-shrink-0">
                            <Clock size={12} />
                            <span className="text-[10px] font-bold tracking-wider uppercase">{meta}</span>
                        </div>
                    )}

                    {/* Other cards (not Course, Module, Org_Course, Conversation, Context, AI_Insight, Profile, Help, Note, Tool, Tool_Conversation, or Resource): Show action button */}
                    {type !== 'COURSE' && type !== 'MODULE' && type !== 'ORG_COURSE' && type !== 'CONVERSATION' && type !== 'CONTEXT' && type !== 'AI_INSIGHT' && type !== 'PROFILE' && type !== 'HELP' && type !== 'NOTE' && type !== 'TOOL' && type !== 'TOOL_CONVERSATION' && type !== 'RESOURCE' && actionLabel && (
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

                </div>
            </div>

            {/* Color Band for Non-Media Cards (Top Border or distinct style?) */}
            {/* The design seems to have a colored top section. I used config.barColor for that. */}

            </div>
        </InteractiveCardWrapper>
    );
};

export default UniversalCard;
