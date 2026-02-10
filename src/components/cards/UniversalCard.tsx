'use client';

import React from 'react';
import { Trash2, Plus, Play, FileText, MessageSquare, Clock, Download, Edit, Paperclip, Star, Award, User, HelpCircle, StickyNote, Wrench, TrendingUp, Drama, LucideIcon, Building, Layers, BookOpen, Video, RefreshCw } from 'lucide-react';
import ConversationGraphic from '../graphics/ConversationGraphic';
import InteractiveCardWrapper from './InteractiveCardWrapper';
import { CARD_TYPE_CONFIGS, CardType } from './cardTypeConfigs';

export type { CardType } from './cardTypeConfigs';

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Extract Vimeo video ID
function extractVimeoId(url: string): string | null {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
}

// Get thumbnail URL for external video
function getVideoThumbnailUrl(url: string): string | null {
    // YouTube thumbnail
    const youtubeId = extractYouTubeId(url);
    if (youtubeId) {
        return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    }
    // Vimeo doesn't have a simple thumbnail API, would need API call
    return null;
}

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
    credits?: { shrm?: number | boolean; hrci?: number | boolean; shrmCredits?: number; hrciCredits?: number }; // Available credits
    collections?: string[]; // List of collection names for footer display
    iconName?: string; // Dynamic icon name for TOOL cards (e.g., 'Drama', 'TrendingUp')
    contextSubtype?: 'TEXT' | 'FILE'; // For CONTEXT cards to differentiate text vs file
    fileUrl?: string; // For FILE context cards and RESOURCE cards - URL to download the file
    fileName?: string; // For FILE context cards and RESOURCE cards - filename for download
    resourceType?: string; // For RESOURCE cards - file type (PDF, DOC, etc.)
    videoPlaybackId?: string; // For VIDEO cards - Mux playback ID for thumbnail
    videoExternalUrl?: string; // For VIDEO cards - external URL (YouTube, Vimeo, etc.)
    videoStatus?: 'uploading' | 'processing' | 'ready' | 'error'; // For VIDEO cards - processing status
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
    videoPlaybackId,
    videoExternalUrl,
    videoStatus,
    onAction,
    onRemove,
    onAdd,
    onDownload,
    draggable,
    onDragStart
}) => {
    // Get dynamic icon for TOOL cards
    const DynamicToolIcon = iconName && TOOL_ICON_MAP[iconName] ? TOOL_ICON_MAP[iconName] : Wrench;

    // Get configuration from shared configs, with fallback overrides for special cases
    const baseConfig = CARD_TYPE_CONFIGS[type];
    // Override icon for CONVERSATION to use the custom graphic component
    const config = type === 'CONVERSATION'
        ? { ...baseConfig, icon: ConversationGraphic }
        : baseConfig;

    // Card type categorization
    // New layout cards: COURSE, MODULE, LESSON - image below header
    const isNewLayoutCard = ['COURSE', 'MODULE', 'LESSON', 'ACTIVITY'].includes(type);
    // Video card has its own layout: header -> title -> thumbnail
    const isVideoCard = type === 'VIDEO';
    // Legacy media cards with background image
    const isMediaCard = false;
    // Text-heavy cards with colored header sections
    const isTextHeavy = ['CONVERSATION', 'CONTEXT', 'AI_INSIGHT', 'RESOURCE', 'PROFILE', 'HELP', 'NOTE', 'TOOL', 'TOOL_CONVERSATION', 'ORG_COLLECTION', 'ORG_COURSE', 'USERS_GROUPS', 'ORG_ANALYTICS', 'ASSIGNED_LEARNING'].includes(type);
    // Org hub cards use glassy transparent style and hide the type header
    const isOrgHubCard = ['USERS_GROUPS', 'ORG_ANALYTICS', 'ASSIGNED_LEARNING', 'ORG_COLLECTION', 'ORG_COURSE'].includes(type);

    // Height calculations for legacy layout
    const topHeight = isTextHeavy ? 'h-[45%]' : 'h-[60%]';
    const bottomHeight = isTextHeavy ? 'h-[55%]' : 'h-[40%]';

    // For Course, Module, Lesson, Activity, Conversation, Context, AI_Insight, Profile, Help, Note, Tool, Tool_Conversation, Org_Collection, Org_Course, and Video cards, the entire card body is clickable
    const isClickableCard = type === 'COURSE' || type === 'MODULE' || type === 'LESSON' || type === 'ACTIVITY' || type === 'CONVERSATION' || type === 'CONTEXT' || type === 'AI_INSIGHT' || type === 'PROFILE' || type === 'HELP' || type === 'NOTE' || type === 'TOOL' || type === 'TOOL_CONVERSATION' || type === 'ORG_COLLECTION' || type === 'ORG_COURSE' || type === 'VIDEO' || type === 'USERS_GROUPS' || type === 'ORG_ANALYTICS' || type === 'ASSIGNED_LEARNING';

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
                className={`relative group w-full flex flex-col rounded-3xl overflow-hidden border ${type === 'LESSON' ? 'border-[#78C0F0]/20' : type === 'NOTE' ? 'border-[#FF9300]/30' : type === 'CONTEXT' ? 'border-[#BD4B18]/30' : type === 'CONVERSATION' ? 'border-[#085684]/30' : type === 'RESOURCE' ? 'border-[#521B23]/30' : type === 'VIDEO' ? 'border-purple-500/30' : isOrgHubCard ? config.borderColor : 'border-white/10'} ${type === 'COURSE' ? 'bg-gradient-to-br from-[#23355B] to-[#0B1120]' : type === 'MODULE' ? 'bg-gradient-to-br from-[#1B283B] to-[#235573]' : type === 'LESSON' ? 'bg-gradient-to-br from-[#054C74] to-[#50A7E2]' : type === 'ACTIVITY' ? 'bg-gradient-to-br from-[#800725] to-[#9E031A]' : type === 'NOTE' ? 'bg-gradient-to-br from-[#A87938] to-[#FF9300]' : type === 'CONTEXT' ? 'bg-gradient-to-br from-[#BD4B18] to-[#943C14]' : type === 'CONVERSATION' ? 'bg-gradient-to-br from-[#063B59] to-[#085684]' : type === 'RESOURCE' ? 'bg-gradient-to-br from-[#521B23] to-[#3A1218]' : type === 'VIDEO' ? 'bg-gradient-to-br from-[#4A2F4A] to-[#7A3579]' : isOrgHubCard ? 'bg-white/[0.03] backdrop-blur-xl' : 'bg-[#0B1120]'} shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.4)] ${draggable && isDraggable ? 'cursor-grabbing' : draggable ? 'cursor-grab' : ''} ${isClickableCard && onAction ? 'cursor-pointer' : ''} aspect-[4/3] min-h-[310px]`}
            >

            {/* ========== NEW LAYOUT FOR COURSE/MODULE/LESSON ========== */}
            {isNewLayoutCard ? (
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Header Row - Separate dark pill at top with its own padding */}
                    <div data-header-actions className="flex items-center justify-between bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/5 shadow-sm relative z-10 mx-3 mt-3">
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/70">
                            {type}
                        </span>
                        <div className="flex items-center gap-2">
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
                                    <Plus size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Featured Image Section - Full width, fixed 120px height */}
                    <div className="relative h-[120px] w-full mt-2 overflow-hidden bg-black/20 flex items-center justify-center flex-shrink-0">
                        {imageUrl ? (
                            <img src={imageUrl} alt={title} className="w-full h-full object-cover opacity-70" />
                        ) : (
                            <span className="text-white/30 text-xs font-medium tracking-widest uppercase">
                                Featured Image
                            </span>
                        )}
                    </div>

                    {/* Content Area - Below image with padding */}
                    <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                        {/* Content Section */}
                        <div className="flex-1 flex flex-col pt-3 px-4">
                            {/* Star Rating (Course only) - Above title, right-aligned */}
                            {type === 'COURSE' && rating !== undefined && (
                                <div className="flex items-center justify-end gap-1 text-amber-400 mb-1">
                                    <Star size={14} fill="currentColor" />
                                    <span className="text-[13px] font-bold">{rating.toFixed(1)}</span>
                                </div>
                            )}

                            {/* Title */}
                            <h3 className="font-semibold text-white text-[15px] leading-tight line-clamp-2 mb-1">
                                {title}
                            </h3>

                            {/* From: Course (Module/Lesson/Activity) */}
                            {(type === 'MODULE' || type === 'LESSON' || type === 'ACTIVITY') && description && (
                                <p className="text-[11px] text-white/60 mb-0.5 truncate">
                                    From: {description}
                                </p>
                            )}

                            {/* Author */}
                            {subtitle && (
                                <p className="text-[11px] text-white/60 truncate">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {/* Footer - Hidden for ACTIVITY cards */}
                        {type !== 'ACTIVITY' && (
                            <div className="flex items-center justify-between mt-auto mx-4 py-2 border-t border-white/10">
                                <div className="flex items-center gap-2 text-white/50">
                                    {meta && (
                                        <>
                                            <Clock size={12} />
                                            <span className="text-[10px] font-bold tracking-wider uppercase">
                                                {meta}
                                            </span>
                                        </>
                                    )}
                                    {/* SHRM/HRCI badges (Course only) */}
                                    {type === 'COURSE' && credits && (credits.shrm || credits.hrci) && (
                                        <div className="flex items-center gap-1.5 ml-1">
                                            {credits.shrm && (
                                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#4f46e5]/30 text-[#a5b4fc] border border-[#4f46e5]/40">
                                                    SHRM{credits.shrmCredits ? ` ${credits.shrmCredits.toFixed(1)}` : ''}
                                                </span>
                                            )}
                                            {credits.hrci && (
                                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#9333ea]/30 text-[#d8b4fe] border border-[#9333ea]/40">
                                                    HRCI{credits.hrciCredits ? ` ${credits.hrciCredits.toFixed(1)}` : ''}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* Right side empty for conditional badges like "For You", "#1 Trending" */}
                            </div>
                        )}
                    </div>
                </div>
            ) : isVideoCard ? (
            /* ========== VIDEO CARD LAYOUT ========== */
            <div className="flex flex-col h-full p-3">
                {/* Header Bar */}
                <div data-header-actions className="flex items-center justify-between bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/5 shadow-sm">
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/70">
                        VIDEO
                    </span>
                    <div className="flex items-center gap-2">
                        {onRemove && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                                className="text-white/40 hover:text-white transition-colors p-1"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                        {onDownload && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                                className="text-white/40 hover:text-white transition-colors p-1"
                            >
                                <Download size={14} />
                            </button>
                        )}
                        {onAdd && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onAdd(); }}
                                className="text-white/40 hover:text-white transition-colors p-1"
                            >
                                <Plus size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-[17px] font-bold text-white leading-tight mt-3 px-1 line-clamp-2">
                    {title}
                </h3>

                {/* Video Thumbnail Area */}
                <div className="flex-1 mt-3 rounded-xl overflow-hidden bg-black/30 relative min-h-[120px]">
                    {(() => {
                        // Get thumbnail URL from Mux playback ID or external URL
                        const thumbnailUrl = videoPlaybackId
                            ? `https://image.mux.com/${videoPlaybackId}/thumbnail.jpg?time=0`
                            : videoExternalUrl
                                ? getVideoThumbnailUrl(videoExternalUrl)
                                : null;

                        if (thumbnailUrl && videoStatus === 'ready') {
                            return (
                                <>
                                    <img
                                        src={thumbnailUrl}
                                        alt={title}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                    {/* Bottom gradient overlay - 25% black starting halfway */}
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/25 to-transparent"></div>
                                    {/* Play icon */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="p-3 rounded-full bg-black/50 backdrop-blur-sm border border-white/20">
                                            <Play size={24} className="text-white ml-0.5" fill="currentColor" />
                                        </div>
                                    </div>
                                </>
                            );
                        }
                        return (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2 text-purple-300/50">
                                    {videoStatus === 'uploading' && (
                                        <>
                                            <div className="animate-pulse"><Video size={40} /></div>
                                            <span className="text-xs uppercase tracking-wider">Uploading...</span>
                                        </>
                                    )}
                                    {videoStatus === 'processing' && (
                                        <>
                                            <div className="animate-spin"><RefreshCw size={28} /></div>
                                            <span className="text-xs uppercase tracking-wider">Processing...</span>
                                        </>
                                    )}
                                    {videoStatus === 'error' && (
                                        <>
                                            <Video size={40} className="text-red-400/70" />
                                            <span className="text-xs uppercase tracking-wider text-red-400/70">Error</span>
                                        </>
                                    )}
                                    {!videoStatus && (
                                        <>
                                            <Video size={40} />
                                            <span className="text-xs uppercase tracking-wider">VIDEO COVER IMAGE</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
            ) : (
            /* ========== LEGACY LAYOUT FOR OTHER CARDS ========== */
            <div className="flex-1 flex flex-col min-h-0">

            {/* --- Top Section --- */}
            <div className={`relative w-full overflow-hidden ${isTextHeavy ? 'flex-[0.45]' : 'flex-[0.6]'} min-h-0 ${isMediaCard ? 'bg-black' : config.barColor} transition-all duration-300`}>

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

                    {/* Row 1: Type Label & Core Actions - Hidden for org hub cards */}
                    {!isOrgHubCard && (
                    <div className="flex items-center justify-between bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/5 shadow-sm">
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/70 truncate mr-2">{type === 'AI_INSIGHT' ? 'CONTEXT' : type === 'HELP' ? 'FEATURES' : type === 'CONTEXT' && contextSubtype ? `CONTEXT (${contextSubtype})` : type.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {onRemove && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                                    className="text-white/40 hover:text-white transition-colors p-1"
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
                                    className="text-white/40 hover:text-white transition-colors p-1"
                                >
                                    <Plus size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                    )}
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
                    {/* Categories and Rating row for Course cards (above title) */}
                    {(type === 'COURSE' || type === 'ORG_COURSE') && (categories?.length || rating !== undefined) && (
                        <div className="flex items-center justify-between gap-2 mb-1">
                            {/* Left side: Categories */}
                            {categories && categories.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                    {categories.slice(0, 2).map((cat, i) => (
                                        <span key={i} className="text-[10px] font-medium uppercase tracking-wide text-white/60">
                                            {cat}
                                        </span>
                                    ))}
                                </div>
                            ) : <div />}
                            {/* Right side: Star rating */}
                            {rating !== undefined && (
                                <div className="flex items-center gap-1 text-amber-400 flex-shrink-0">
                                    <Star size={14} fill="currentColor" />
                                    <span className="text-sm font-bold leading-none">{rating.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                    )}
                    <h3 className={`font-bold text-white leading-tight mb-1 drop-shadow-md line-clamp-2 ${isTextHeavy ? 'text-[17px]' : 'text-lg'}`}>
                        {title}
                    </h3>
                    {/* Author line for Course cards (below title) */}
                    {(type === 'COURSE' || type === 'ORG_COURSE') ? (
                        subtitle && (
                            <p className="text-xs font-medium text-white/70 tracking-wide truncate">
                                {subtitle}
                            </p>
                        )
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
            <div className={`${isTextHeavy ? 'flex-[0.55]' : 'flex-[0.4]'} min-h-0 px-5 py-4 flex flex-col relative ${(config as any).bodyColor || 'bg-[#0B1120]'} transition-all duration-300`}>

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
                        <p className="text-[13px] text-white/80 leading-relaxed line-clamp-3 font-light">
                            {description}
                        </p>
                    ) : (
                        <p className="text-[13px] text-slate-300 leading-relaxed line-clamp-3 font-light">
                            {description}
                        </p>
                    )}
                </div>

                {/* Footer (Meta + Action) */}
                <div className={`flex items-center justify-between mt-auto pt-2 border-t border-white/10 gap-2 relative z-10`}>
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
                                    <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-[#4f46e5]/20 text-[#818cf8] border border-[#4f46e5]/30" title="SHRM Credits">SHRM{credits.shrmCredits ? ` ${credits.shrmCredits.toFixed(1)}` : ''}</span>
                                )}
                                {credits.hrci && (
                                    <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-[#9333ea]/20 text-[#c084fc] border border-[#9333ea]/30" title="HRCI Credits">HRCI{credits.hrciCredits ? ` ${credits.hrciCredits.toFixed(1)}` : ''}</span>
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
                                    <span className="text-[10px] font-medium text-white/60 truncate">
                                        {collections.slice(0, 2).join(', ')}
                                        {collections.length > 2 && ` +${collections.length - 2}`}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-white/40 italic">No collections</span>
                                )}
                            </div>
                            {/* Right side: Date */}
                            {meta && (
                                <div className="flex items-center gap-1.5 text-white/60 flex-shrink-0">
                                    <Clock size={12} />
                                    <span className="text-[10px] font-bold tracking-wider uppercase">{meta}</span>
                                </div>
                            )}
                        </>
                    )}

                    {/* Conversation, Context, AI_Insight, Profile, Help, Tool_Conversation, Resource cards: Show date on right (no button) */}
                    {(type === 'CONVERSATION' || type === 'CONTEXT' || type === 'AI_INSIGHT' || type === 'PROFILE' || type === 'HELP' || type === 'TOOL_CONVERSATION' || type === 'RESOURCE') && meta && (
                        <div className="flex items-center gap-1.5 text-white/60 flex-shrink-0">
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
            )}
            </div>
        </InteractiveCardWrapper>
    );
};

export default UniversalCard;
