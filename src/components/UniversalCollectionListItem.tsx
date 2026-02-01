'use client';

import React from 'react';
import { Trash2, Plus, BookOpen, Layers, Play, FileText, MessageSquare, StickyNote, Video, Paperclip, User, ChevronRight, Star, Download } from 'lucide-react';
import { CollectionItemDetail } from './UniversalCollectionCard';
import { getTypeDisplayLabel, getTypeGlowColor } from './cards/cardTypeConfigs';
import { DragItem, DragItemType } from '../types';

interface UniversalCollectionListItemProps {
    item: CollectionItemDetail;
    onClick: (item: CollectionItemDetail) => void;
    onRemove?: (id: string, type: string) => void; // Optional - not shown for Academy courses, lessons
    onAdd?: (item: CollectionItemDetail) => void;
    onDragStart?: (item: DragItem) => void;
    showCategoriesInsteadOfType?: boolean; // Show categories instead of type badge (for Academy view)
}

// Get the appropriate icon component for each item type
const getIconForType = (itemType: string) => {
    switch (itemType) {
        case 'COURSE':
        case 'ORG_COURSE':
            return BookOpen;
        case 'MODULE':
            return Layers;
        case 'LESSON':
        case 'ACTIVITY':
            return Play;
        case 'CONVERSATION':
        case 'TOOL_CONVERSATION':
            return MessageSquare;
        case 'NOTE':
            return StickyNote;
        case 'VIDEO':
            return Video;
        case 'RESOURCE':
        case 'FILE':
            return Paperclip;
        case 'PROFILE':
            return User;
        case 'AI_INSIGHT':
        case 'CONTEXT':
        case 'CUSTOM_CONTEXT':
        default:
            return FileText;
    }
};

// Get subtitle/description for display
const getSubtitle = (item: CollectionItemDetail): string => {
    const itemAny = item as any;
    switch (item.itemType) {
        case 'COURSE':
            // Show description in subtitle row (author moves to title row)
            // Don't limit length here - CSS truncate will handle it responsively
            return itemAny.description || '';
        case 'MODULE':
        case 'LESSON':
        case 'ACTIVITY':
            return itemAny.courseTitle || '';
        case 'CONVERSATION':
            return itemAny.lastMessage?.slice(0, 80) || 'No messages yet';
        case 'TOOL_CONVERSATION':
            return itemAny.tool_title || itemAny.lastMessage?.slice(0, 80) || '';
        case 'NOTE':
            return itemAny.content?.slice(0, 80)?.replace(/[#*_`~\[\]]/g, '') || '';
        case 'VIDEO':
            return itemAny.content?.description?.slice(0, 80) || '';
        case 'RESOURCE':
            return itemAny.courseTitle || itemAny.summary?.slice(0, 80) || '';
        case 'AI_INSIGHT':
            return itemAny.content?.insight?.slice(0, 80) || itemAny.content?.text?.slice(0, 80) || '';
        case 'CUSTOM_CONTEXT':
            return itemAny.content?.text?.slice(0, 80) || '';
        case 'FILE':
            return itemAny.content?.summary?.slice(0, 80) || 'Uploaded file';
        case 'PROFILE':
            return itemAny.content?.objectives?.slice(0, 80) || 'Profile details';
        default:
            return '';
    }
};

// Get meta info (duration, etc.)
const getMeta = (item: CollectionItemDetail): string | null => {
    const itemAny = item as any;
    if (itemAny.duration) return itemAny.duration;
    if (itemAny.resourceType) return itemAny.resourceType;
    return null;
};

// Get the date from the item
const getDate = (item: CollectionItemDetail): string | null => {
    const itemAny = item as any;
    const dateStr = itemAny.updated_at || itemAny.created_at;
    if (!dateStr) return null;
    try {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return null;
    }
};

// Get image URL for visual items
const getImageUrl = (item: CollectionItemDetail): string | null => {
    const itemAny = item as any;
    if (itemAny.image) return itemAny.image;
    if (itemAny.courseImage) return itemAny.courseImage;
    return null;
};

// Map itemType to DragItemType
const getDragItemType = (itemType: string): DragItemType => {
    switch (itemType) {
        case 'COURSE': return 'COURSE';
        case 'MODULE': return 'MODULE';
        case 'LESSON': return 'LESSON';
        case 'ACTIVITY': return 'ACTIVITY';
        case 'RESOURCE': return 'RESOURCE';
        case 'CONVERSATION': return 'CONVERSATION';
        case 'TOOL_CONVERSATION': return 'TOOL_CONVERSATION';
        case 'NOTE': return 'NOTE';
        case 'VIDEO': return 'VIDEO';
        case 'AI_INSIGHT':
        case 'CUSTOM_CONTEXT':
        case 'FILE': return 'CONTEXT';
        case 'PROFILE': return 'PROFILE';
        default: return 'CONTEXT';
    }
};

// Check if item type should show thumbnail
const shouldShowThumbnail = (itemType: string): boolean => {
    return ['COURSE', 'MODULE', 'LESSON', 'ACTIVITY', 'VIDEO'].includes(itemType);
};

// Get course rating
const getCourseRating = (item: CollectionItemDetail): number | null => {
    if (item.itemType !== 'COURSE') return null;
    const itemAny = item as any;
    // Check for rating - show any defined rating (matching UniversalCard behavior)
    if (itemAny.rating !== undefined && itemAny.rating !== null) {
        return itemAny.rating;
    }
    return null;
};

// Get course certification badges (SHRM, HRCI)
const getCourseBadges = (item: CollectionItemDetail): { shrm: boolean; hrci: boolean } => {
    if (item.itemType !== 'COURSE') return { shrm: false, hrci: false };
    const itemAny = item as any;
    const badges = itemAny.badges || [];
    return {
        shrm: badges.includes('SHRM'),
        hrci: badges.includes('HRCI')
    };
};

// Get course author/expert name
const getCourseAuthor = (item: CollectionItemDetail): string | null => {
    if (item.itemType !== 'COURSE') return null;
    const itemAny = item as any;
    return itemAny.author || null;
};

// Get course categories
const getCourseCategories = (item: CollectionItemDetail): string[] => {
    if (item.itemType !== 'COURSE') return [];
    const itemAny = item as any;
    return itemAny.categories || (itemAny.category ? [itemAny.category] : []);
};

// Get file URL for downloadable items (FILE, RESOURCE)
const getFileUrl = (item: CollectionItemDetail): string | null => {
    const itemAny = item as any;
    if (item.itemType === 'FILE') {
        return itemAny.content?.url || null;
    }
    if (item.itemType === 'RESOURCE') {
        return itemAny.url || null;
    }
    return null;
};

// Check if item type supports download
const supportsDownload = (itemType: string): boolean => {
    return ['FILE', 'RESOURCE'].includes(itemType);
};

const UniversalCollectionListItem: React.FC<UniversalCollectionListItemProps> = ({
    item,
    onClick,
    onRemove,
    onAdd,
    onDragStart,
    showCategoriesInsteadOfType = false
}) => {
    const Icon = getIconForType(item.itemType);
    const glowColor = getTypeGlowColor(item.itemType);
    const typeLabel = getTypeDisplayLabel(item.itemType);
    const subtitle = getSubtitle(item);
    const meta = getMeta(item);
    const date = getDate(item);
    const title = item.title || 'Untitled';
    const imageUrl = getImageUrl(item);
    const showThumbnail = shouldShowThumbnail(item.itemType) && imageUrl;
    const isCourse = item.itemType === 'COURSE';
    const courseRating = getCourseRating(item);
    const courseBadges = getCourseBadges(item);
    const courseAuthor = getCourseAuthor(item);
    const courseCategories = getCourseCategories(item);
    const fileUrl = getFileUrl(item);
    const canDownload = supportsDownload(item.itemType) && fileUrl;

    const handleDragStart = (e: React.DragEvent) => {
        if (!onDragStart) return;

        const dragItem: DragItem = {
            type: getDragItemType(item.itemType),
            id: item.id,
            title: title,
            subtitle: (item as any).author || (item as any).courseTitle || undefined,
            image: (item as any).image || undefined,
            meta: (item as any).duration || (item as any).meta || undefined,
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dragItem));
        // Hide native drag preview
        const emptyImg = new Image();
        emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(emptyImg, 0, 0);
        onDragStart(dragItem);
    };

    return (
        <div
            onClick={() => onClick(item)}
            draggable={!!onDragStart}
            onDragStart={handleDragStart}
            className="group relative flex items-center gap-4 px-4 py-3
                       bg-white/[0.03] hover:bg-white/[0.08]
                       border border-white/[0.06] hover:border-white/20
                       rounded-xl transition-all duration-300 cursor-pointer
                       overflow-hidden"
            style={{
                borderLeftWidth: '3px',
                borderLeftColor: glowColor,
                boxShadow: 'none',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 20px ${glowColor}30, 0 0 40px ${glowColor}15, inset 0 0 20px ${glowColor}08`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
                {/* Subtle gradient overlay on hover */}
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[10px]"
                    style={{
                        background: `linear-gradient(135deg, ${glowColor}08 0%, transparent 50%)`
                    }}
                />

            {/* Thumbnail for visual items OR Type Icon */}
            {showThumbnail ? (
                <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-black/30">
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    {/* Small type indicator overlay */}
                    <div
                        className="absolute bottom-0.5 right-0.5 p-1 rounded bg-black/60 backdrop-blur-sm"
                    >
                        <Icon size={10} style={{ color: glowColor }} />
                    </div>
                </div>
            ) : (
                <div
                    className="flex items-center justify-center w-12 h-12 rounded-lg flex-shrink-0
                               transition-transform duration-200 group-hover:scale-105"
                    style={{
                        backgroundColor: `${glowColor}15`,
                        boxShadow: `0 0 20px ${glowColor}10`
                    }}
                >
                    <Icon size={22} style={{ color: glowColor }} />
                </div>
            )}

            {/* Separator after icon/thumbnail */}
            <div className="w-px h-8 bg-white/10 flex-shrink-0" />

            {/* Content */}
            <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="text-sm font-semibold text-white truncate group-hover:text-white/95">
                        {title}
                    </h4>
                    {/* Course-specific info: Expert, Stars, Duration, Badges */}
                    {isCourse && (
                        <>
                            {courseAuthor && (
                                <>
                                    <span className="text-white/20 hidden lg:block">|</span>
                                    <span className="text-[11px] text-slate-400 flex-shrink-0 hidden lg:block">
                                        {courseAuthor}
                                    </span>
                                </>
                            )}
                            {courseRating !== null && (
                                <>
                                    <span className="text-white/20 hidden lg:block">|</span>
                                    <span className="flex items-center gap-1 text-amber-400/50 flex-shrink-0">
                                        <Star size={14} fill="currentColor" />
                                        <span className="text-sm font-bold">{courseRating.toFixed(1)}</span>
                                    </span>
                                </>
                            )}
                            {meta && (
                                <>
                                    <span className="text-white/20 hidden lg:block">|</span>
                                    <span className="text-[11px] text-slate-500 flex-shrink-0 hidden lg:block">
                                        {meta}
                                    </span>
                                </>
                            )}
                            {(courseBadges.shrm || courseBadges.hrci) && (
                                <span className="text-white/20 hidden md:block">|</span>
                            )}
                            {courseBadges.shrm && (
                                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0 hidden md:block">
                                    SHRM
                                </span>
                            )}
                            {courseBadges.hrci && (
                                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex-shrink-0 hidden md:block">
                                    HRCI
                                </span>
                            )}
                        </>
                    )}
                    {/* Non-course items: Show date next to title */}
                    {!isCourse && date && (
                        <>
                            <span className="text-white/20 hidden lg:block">|</span>
                            <span className="text-[11px] text-slate-500 flex-shrink-0 hidden lg:block">
                                {date}
                            </span>
                        </>
                    )}
                    {/* Non-course items: Show meta if available (e.g., resource type) */}
                    {!isCourse && meta && (
                        <>
                            <span className="text-white/20 hidden lg:block">|</span>
                            <span className="text-[11px] text-slate-500 flex-shrink-0 hidden lg:block">
                                {meta}
                            </span>
                        </>
                    )}
                </div>
                {subtitle && (
                    <p className="text-xs text-slate-400 truncate mt-0.5 pr-6 group-hover:text-slate-300 transition-colors">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Right section - Type Badge or Categories (last element) */}
            <div className="flex items-center gap-3 flex-shrink-0 relative z-10">
                {/* Separator before right section */}
                <div className="w-px h-8 bg-white/10 flex-shrink-0 hidden sm:block" />

                {/* Categories (for Academy courses) or Type Badge */}
                {showCategoriesInsteadOfType && isCourse && courseCategories.length > 0 ? (
                    <div className="hidden sm:flex flex-wrap gap-1 justify-end max-w-[180px]">
                        {courseCategories.slice(0, 2).map((cat, i) => (
                            <span
                                key={i}
                                className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded
                                           bg-white/5 text-slate-400 border border-white/10"
                            >
                                {cat}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span
                        className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md
                                   hidden sm:block w-24 text-center"
                        style={{
                            backgroundColor: `${glowColor}12`,
                            color: glowColor,
                            border: `1px solid ${glowColor}20`
                        }}
                    >
                        {typeLabel}
                    </span>
                )}

                {/* Arrow indicator */}
                <ChevronRight size={16} className="text-slate-600 ml-1" />
            </div>

                {/* Sliding Action Panel - Fully opaque with solid background */}
                <div
                    className="absolute right-0 top-0 bottom-0 flex items-center justify-end gap-2 pl-6 pr-4
                               transform translate-x-full group-hover:translate-x-0
                               transition-transform duration-300 ease-out
                               rounded-r-[10px] shadow-xl z-20"
                    style={{
                        background: 'linear-gradient(to right, transparent 0%, #1a3050 20%, #1a3050 100%)',
                    }}
                >
                    {/* Add to collection button */}
                    {onAdd && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAdd(item); }}
                            className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors border border-white/10 hover:border-white/20"
                            title="Add to collection"
                        >
                            <Plus size={16} className="text-white" />
                        </button>
                    )}
                    {/* Download button for FILE and RESOURCE items */}
                    {canDownload && (
                        <button
                            onClick={(e) => { e.stopPropagation(); window.open(fileUrl!, '_blank'); }}
                            className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors border border-white/10 hover:border-white/20"
                            title="Download file"
                        >
                            <Download size={16} className="text-white" />
                        </button>
                    )}
                    {/* Remove button - only when onRemove provided and not PROFILE */}
                    {onRemove && item.itemType !== 'PROFILE' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(String(item.id), item.itemType); }}
                            className="p-2 rounded-lg bg-white/15 hover:bg-red-500/40 transition-colors border border-white/10 hover:border-red-400/40"
                            title="Remove from collection"
                        >
                            <Trash2 size={16} className="text-white hover:text-red-300" />
                        </button>
                    )}
                </div>
            </div>
    );
};

export default UniversalCollectionListItem;
