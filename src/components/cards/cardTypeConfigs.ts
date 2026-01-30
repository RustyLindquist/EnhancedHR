import { FileText, MessageSquare, User, HelpCircle, StickyNote, Wrench, Building, BookOpen, Video, Paperclip, LucideIcon } from 'lucide-react';

export type CardType = 'COURSE' | 'MODULE' | 'LESSON' | 'ACTIVITY' | 'RESOURCE' | 'CONVERSATION' | 'CONTEXT' | 'AI_INSIGHT' | 'PROFILE' | 'HELP' | 'NOTE' | 'TOOL' | 'TOOL_CONVERSATION' | 'ORG_COLLECTION' | 'ORG_COURSE' | 'VIDEO';

export interface CardTypeConfig {
    headerColor: string;
    borderColor: string;
    labelColor: string;
    barColor: string;
    icon: LucideIcon | null;
    buttonStyle: string;
    glowColor: string;
    bodyColor?: string;
    footerTextColor?: string;
}

export const CARD_TYPE_CONFIGS: Record<CardType, CardTypeConfig> = {
    COURSE: {
        headerColor: 'bg-[#0B1120]',
        borderColor: 'border-blue-500/30',
        labelColor: 'text-slate-400',
        barColor: 'hidden',
        icon: null,
        buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
        glowColor: 'rgba(120, 192, 240, 0.6)'
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
        glowColor: 'rgba(200, 240, 255, 0.9)',
        bodyColor: 'bg-[#063F5F]'
    },
    ACTIVITY: {
        headerColor: 'bg-[#800725]',
        borderColor: 'border-red-700/30',
        labelColor: 'text-red-200',
        barColor: 'hidden',
        icon: null,
        buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
        glowColor: 'rgba(255, 180, 200, 0.9)',
        bodyColor: 'bg-[#800725]'
    },
    RESOURCE: {
        headerColor: 'bg-transparent',
        borderColor: 'border-[#521B23]/40',
        labelColor: 'text-red-200',
        barColor: 'bg-transparent',
        icon: Paperclip,
        buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
        glowColor: 'rgba(255, 150, 150, 0.95)',
        bodyColor: 'bg-black/25'
    },
    CONVERSATION: {
        headerColor: 'bg-transparent',
        borderColor: 'border-[#78C0F0]/30',
        labelColor: 'text-[#78C0F0]',
        barColor: 'bg-transparent',
        icon: MessageSquare,
        buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
        glowColor: 'rgba(120, 192, 240, 0.7)',
        bodyColor: 'bg-black/25'
    },
    CONTEXT: {
        headerColor: 'bg-transparent',
        borderColor: 'border-[#BD4B18]/40',
        labelColor: 'text-orange-100',
        barColor: 'bg-transparent',
        icon: FileText,
        buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
        glowColor: 'rgba(255, 180, 130, 0.95)',
        bodyColor: 'bg-black/25'
    },
    AI_INSIGHT: {
        headerColor: 'bg-[#7a4500]',
        borderColor: 'border-[#FF9300]/40',
        labelColor: 'text-orange-100',
        barColor: 'bg-[#FF9300]',
        icon: FileText,
        buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
        glowColor: 'rgba(255, 147, 0, 0.6)'
    },
    PROFILE: {
        headerColor: 'bg-[#054C74]',
        borderColor: 'border-cyan-400/30',
        labelColor: 'text-cyan-200',
        barColor: 'bg-[#0284c7]/80',
        icon: User,
        buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
        glowColor: 'rgba(34, 211, 238, 0.5)'
    },
    HELP: {
        headerColor: 'bg-[#4B8BB3]',
        borderColor: 'border-[#4B8BB3]/30',
        labelColor: 'text-white',
        barColor: 'bg-[#4B8BB3]',
        icon: HelpCircle,
        buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
        glowColor: 'rgba(75, 139, 179, 0.6)'
    },
    NOTE: {
        headerColor: 'bg-transparent',
        borderColor: 'border-[#FF9300]/40',
        labelColor: 'text-white',
        barColor: 'bg-transparent',
        icon: StickyNote,
        buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
        glowColor: 'rgba(255, 230, 140, 0.95)',
        bodyColor: 'bg-black/25',
        footerTextColor: 'text-white/70'
    },
    TOOL: {
        headerColor: 'bg-[#0D9488]',
        borderColor: 'border-teal-500/30',
        labelColor: 'text-teal-100',
        barColor: 'bg-[#0D9488]',
        icon: Wrench,
        buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
        glowColor: 'rgba(13, 148, 136, 0.6)',
        bodyColor: 'bg-[#0D9488]/90'
    },
    TOOL_CONVERSATION: {
        headerColor: 'bg-[#0D9488]',
        borderColor: 'border-teal-500/30',
        labelColor: 'text-teal-100',
        barColor: 'bg-[#0D9488]',
        icon: MessageSquare,
        buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
        glowColor: 'rgba(13, 148, 136, 0.6)',
        bodyColor: 'bg-[#0D9488]/90'
    },
    ORG_COLLECTION: {
        headerColor: 'bg-[#1e3a5f]',
        borderColor: 'border-blue-500/30',
        labelColor: 'text-blue-200',
        barColor: 'bg-[#1e3a5f]',
        icon: Building,
        buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
        glowColor: 'rgba(59, 130, 246, 0.5)',
        bodyColor: 'bg-[#1e3a5f]/90'
    },
    ORG_COURSE: {
        headerColor: 'bg-amber-950',
        borderColor: 'border-amber-500/30',
        labelColor: 'text-amber-200',
        barColor: 'bg-amber-600/80',
        icon: BookOpen,
        buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
        glowColor: 'rgba(217, 119, 6, 0.5)',
        bodyColor: 'bg-amber-950'
    },
    VIDEO: {
        headerColor: 'bg-transparent',
        borderColor: 'border-purple-500/30',
        labelColor: 'text-purple-100',
        barColor: 'bg-transparent',
        icon: Video,
        buttonStyle: 'bg-white/10 hover:bg-white/20 text-white',
        glowColor: 'rgba(168, 85, 247, 0.7)',
        bodyColor: 'bg-black/25'
    }
};

/**
 * Get human-readable label for a card item type
 */
export const getTypeDisplayLabel = (itemType: string): string => {
    const labels: Record<string, string> = {
        COURSE: 'Course',
        MODULE: 'Module',
        LESSON: 'Lesson',
        ACTIVITY: 'Activity',
        RESOURCE: 'Resource',
        CONVERSATION: 'Conversation',
        TOOL_CONVERSATION: 'Tool Chat',
        CONTEXT: 'Context',
        CUSTOM_CONTEXT: 'Context',
        AI_INSIGHT: 'AI Insight',
        PROFILE: 'Profile',
        NOTE: 'Note',
        VIDEO: 'Video',
        FILE: 'File',
        HELP: 'Help',
        TOOL: 'Tool',
        ORG_COLLECTION: 'Collection',
        ORG_COURSE: 'Org Course',
    };
    return labels[itemType] || itemType;
};

/**
 * Get the icon component for a card type
 * Maps itemType to the corresponding LucideIcon
 */
export const getTypeIcon = (itemType: string): LucideIcon | null => {
    // Map itemType to CardType for config lookup
    const typeMap: Record<string, CardType> = {
        COURSE: 'COURSE',
        MODULE: 'MODULE',
        LESSON: 'LESSON',
        ACTIVITY: 'ACTIVITY',
        RESOURCE: 'RESOURCE',
        CONVERSATION: 'CONVERSATION',
        TOOL_CONVERSATION: 'TOOL_CONVERSATION',
        CONTEXT: 'CONTEXT',
        CUSTOM_CONTEXT: 'CONTEXT',
        AI_INSIGHT: 'AI_INSIGHT',
        PROFILE: 'PROFILE',
        NOTE: 'NOTE',
        VIDEO: 'VIDEO',
        FILE: 'CONTEXT',
        HELP: 'HELP',
        TOOL: 'TOOL',
        ORG_COLLECTION: 'ORG_COLLECTION',
        ORG_COURSE: 'ORG_COURSE',
    };

    const cardType = typeMap[itemType];
    if (!cardType) return null;

    return CARD_TYPE_CONFIGS[cardType]?.icon || null;
};

/**
 * Get the glow color for a card type
 */
export const getTypeGlowColor = (itemType: string): string => {
    const typeMap: Record<string, CardType> = {
        COURSE: 'COURSE',
        MODULE: 'MODULE',
        LESSON: 'LESSON',
        ACTIVITY: 'ACTIVITY',
        RESOURCE: 'RESOURCE',
        CONVERSATION: 'CONVERSATION',
        TOOL_CONVERSATION: 'TOOL_CONVERSATION',
        CONTEXT: 'CONTEXT',
        CUSTOM_CONTEXT: 'CONTEXT',
        AI_INSIGHT: 'AI_INSIGHT',
        PROFILE: 'PROFILE',
        NOTE: 'NOTE',
        VIDEO: 'VIDEO',
        FILE: 'CONTEXT',
        HELP: 'HELP',
        TOOL: 'TOOL',
        ORG_COLLECTION: 'ORG_COLLECTION',
        ORG_COURSE: 'ORG_COURSE',
    };

    const cardType = typeMap[itemType];
    if (!cardType) return 'rgba(120, 192, 240, 0.6)'; // Default to brand blue

    return CARD_TYPE_CONFIGS[cardType]?.glowColor || 'rgba(120, 192, 240, 0.6)';
};
