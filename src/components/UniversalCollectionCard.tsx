import React from 'react';
import { Course, Conversation, Module, Lesson, Resource, AIInsight, CustomContext, ContextFile, ProfileDetails, DragItem, DragItemType } from '../types';
import UniversalCard, { CardType } from './cards/UniversalCard';

// Unified type for all renderable items in a collection
export type CollectionItemDetail =
    | (Course & { itemType: 'COURSE' })
    | (Conversation & { itemType: 'CONVERSATION' })
    | (Module & { itemType: 'MODULE'; courseTitle?: string })
    | (Lesson & { itemType: 'LESSON'; courseTitle?: string; moduleTitle?: string })
    | (Resource & { itemType: 'RESOURCE'; courseTitle?: string })
    | (AIInsight & { itemType: 'AI_INSIGHT' })
    | (CustomContext & { itemType: 'CUSTOM_CONTEXT' })
    | (ContextFile & { itemType: 'FILE' })
    | (ProfileDetails & { itemType: 'PROFILE' });

interface UniversalCollectionCardProps {
    item: CollectionItemDetail;
    onRemove: (id: string, type: string) => void;
    onClick: (item: CollectionItemDetail) => void;
    onAdd?: (item: CollectionItemDetail) => void;
    onDragStart?: (item: DragItem) => void;
}

const UniversalCollectionCard: React.FC<UniversalCollectionCardProps> = ({ item, onRemove, onClick, onAdd, onDragStart }) => {

    // Map itemType to DragItemType
    const getDragItemType = (itemType: string): DragItemType => {
        switch (itemType) {
            case 'COURSE': return 'COURSE';
            case 'MODULE': return 'MODULE';
            case 'LESSON': return 'LESSON';
            case 'RESOURCE': return 'RESOURCE';
            case 'CONVERSATION': return 'CONVERSATION';
            case 'AI_INSIGHT':
            case 'CUSTOM_CONTEXT':
            case 'FILE': return 'CONTEXT';
            case 'PROFILE': return 'PROFILE';
            default: return 'CONTEXT';
        }
    };

    const handleDragStart = (e: React.DragEvent) => {
        const dragItem: DragItem = {
            type: getDragItemType(item.itemType),
            id: item.id,
            title: item.title || 'Untitled',
            subtitle: (item as any).author || (item as any).courseTitle || undefined,
            image: (item as any).image || undefined,
            meta: (item as any).duration || (item as any).meta || undefined,
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dragItem));
        // Hide native drag preview since we use CustomDragLayer
        const emptyImg = new Image();
        emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(emptyImg, 0, 0);
        onDragStart?.(dragItem);
    };

    let cardProps: any = {
        title: item.title || 'Untitled',
        onAction: () => onClick(item),
        onRemove: () => onRemove(String(item.id), item.itemType),
        onAdd: onAdd ? () => onAdd(item) : undefined,
        draggable: !!onDragStart,
        onDragStart: onDragStart ? handleDragStart : undefined
    };

    // Mapping Logic
    switch (item.itemType) {
        case 'COURSE': {
            const course = item as Course;
            cardProps = {
                ...cardProps,
                type: 'COURSE',
                subtitle: course.author,
                description: course.description,
                imageUrl: course.image,
                meta: course.duration,
                categories: [course.category],
                rating: course.rating,
                credits: {
                    shrm: course.badges?.includes('SHRM'),
                    hrci: course.badges?.includes('HRCI')
                },
                actionLabel: 'VIEW'
            };
            break;
        }
        case 'CONVERSATION': {
            const conv = item as Conversation;
            cardProps = {
                ...cardProps,
                type: 'CONVERSATION',
                description: conv.lastMessage || 'No messages yet.',
                meta: conv.updated_at ? new Date(conv.updated_at).toLocaleDateString() : 'Just now',
                actionLabel: 'CHAT'
            };
            break;
        }
        case 'AI_INSIGHT': {
            const insight = item as any;
            cardProps = {
                ...cardProps,
                type: 'AI_INSIGHT',
                title: 'AI Insight',
                description: insight.content?.insight || insight.content?.text || insight.title,
                meta: insight.created_at ? new Date(insight.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
                actionLabel: 'VIEW'
            };
            break;
        }
        case 'CUSTOM_CONTEXT': {
            const context = item as any;
            cardProps = {
                ...cardProps,
                type: 'CONTEXT',
                description: context.content?.text,
                meta: context.created_at ? new Date(context.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
                actionLabel: 'EDIT'
            };
            break;
        }
        case 'PROFILE': {
            const profile = item as any;
            cardProps = {
                ...cardProps,
                type: 'PROFILE',
                title: 'My Profile Details',
                description: profile.content?.objectives || profile.content?.measuresOfSuccess || 'No details added.',
                meta: profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
                actionLabel: 'EDIT',
                onRemove: undefined
            };
            break;
        }
        case 'FILE': {
            const file = item as any;
            cardProps = {
                ...cardProps,
                type: 'RESOURCE',
                subtitle: 'Uploaded Document',
                description: file.content?.fileType || 'File',
                meta: file.created_at ? new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
                actionLabel: 'PREVIEW'
            };
            break;
        }
        case 'MODULE': {
            const modItem = item as any;
            const content = modItem.content || {}; // Legacy/Fallback
            cardProps = {
                ...cardProps,
                type: 'MODULE',
                subtitle: modItem.author || content.author || 'EnhancedHR Expert',
                description: modItem.courseTitle || content.courseTitle || 'Module',
                meta: modItem.duration || content.meta,
                imageUrl: modItem.image || content.image,
                actionLabel: 'START'
            };
            break;
        }
        case 'LESSON': {
            const lessonItem = item as any;
            const content = lessonItem.content || {};
            cardProps = {
                ...cardProps,
                type: 'LESSON',
                subtitle: lessonItem.moduleTitle || content.subtitle || 'Lesson',
                meta: lessonItem.duration || content.meta,
                imageUrl: lessonItem.image || content.image,
                actionLabel: 'START'
            };
            break;
        }
        case 'RESOURCE': {
            const resContext = item as any;
            const content = resContext.content || {};
            cardProps = {
                ...cardProps,
                type: 'RESOURCE',
                subtitle: content.subtitle || 'Resource',
                description: content.description || 'Reference Material',
                actionLabel: 'OPEN'
            };
            break;
        }
        default:
            cardProps.type = 'RESOURCE'; // Fallback
    }

    return <UniversalCard {...cardProps} />;
};

export default UniversalCollectionCard;
