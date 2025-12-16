import React from 'react';
import { Course, Conversation, Module, Lesson, Resource, AIInsight, CustomContext, ContextFile, ProfileDetails } from '../types';
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
}

const UniversalCollectionCard: React.FC<UniversalCollectionCardProps> = ({ item, onRemove, onClick, onAdd }) => {

    let cardProps: any = {
        title: item.title || 'Untitled',
        onAction: () => onClick(item),
        onRemove: () => onRemove(String(item.id), item.itemType),
        onAdd: onAdd ? () => onAdd(item) : undefined
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
                type: 'CONTEXT',
                subtitle: 'AI Insight',
                description: insight.content?.insight,
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
                actionLabel: 'PREVIEW'
            };
            break;
        }
        case 'MODULE': {
            const modContext = item as any; // Context Item from DB
            const content = modContext.content || {};
            cardProps = {
                ...cardProps,
                type: 'MODULE',
                subtitle: content.subtitle || 'Module',
                meta: content.meta,
                imageUrl: content.image, // Use enriched image
                actionLabel: 'START'
            };
            break;
        }
        case 'LESSON': {
            const lessonContext = item as any; // Context Item
            const content = lessonContext.content || {};
            cardProps = {
                ...cardProps,
                type: 'LESSON',
                subtitle: content.subtitle || 'Lesson',
                meta: content.meta,
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
