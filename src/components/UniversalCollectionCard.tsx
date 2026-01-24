import React from 'react';
import { Course, Conversation, Module, Lesson, Resource, AIInsight, CustomContext, ContextFile, ProfileDetails, DragItem, DragItemType, Note, ToolConversation, VideoContent } from '../types';
import UniversalCard, { CardType } from './cards/UniversalCard';

// Unified type for all renderable items in a collection
export type CollectionItemDetail =
    | (Course & { itemType: 'COURSE' })
    | (Conversation & { itemType: 'CONVERSATION' })
    | (ToolConversation & { itemType: 'TOOL_CONVERSATION' })
    | (Module & { itemType: 'MODULE'; courseTitle?: string; courseImage?: string; courseAuthor?: string })
    | (Lesson & { itemType: 'LESSON'; courseTitle?: string; moduleTitle?: string; courseImage?: string; courseAuthor?: string })
    | (Lesson & { itemType: 'ACTIVITY'; courseTitle?: string; courseImage?: string; courseAuthor?: string })
    | (Resource & { itemType: 'RESOURCE'; courseTitle?: string })
    | (AIInsight & { itemType: 'AI_INSIGHT' })
    | (CustomContext & { itemType: 'CUSTOM_CONTEXT' })
    | (ContextFile & { itemType: 'FILE' })
    | (ProfileDetails & { itemType: 'PROFILE' })
    | (Note & { itemType: 'NOTE' })
    | (VideoContent & { itemType: 'VIDEO' });

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
        case 'TOOL_CONVERSATION': {
            const toolConv = item as ToolConversation;
            cardProps = {
                ...cardProps,
                type: 'TOOL_CONVERSATION',
                subtitle: toolConv.tool_title || 'Tool',
                description: toolConv.lastMessage || 'No messages yet.',
                meta: toolConv.updated_at ? new Date(toolConv.updated_at).toLocaleDateString() : 'Just now',
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
                contextSubtype: 'TEXT',
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
                type: 'CONTEXT',
                contextSubtype: 'FILE',
                subtitle: 'Uploaded File',
                description: file.content?.summary || file.content?.fileType || 'File',
                meta: file.created_at ? new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
                actionLabel: 'PREVIEW',
                fileUrl: file.content?.url,
                fileName: file.content?.fileName || file.title
            };
            break;
        }
        case 'MODULE': {
            const modItem = item as any;
            const content = modItem.content || {}; // Legacy/Fallback
            cardProps = {
                ...cardProps,
                type: 'MODULE',
                subtitle: modItem.courseAuthor || modItem.author || content.author || 'EnhancedHR Expert',
                description: modItem.courseTitle || content.courseTitle || 'Module',
                meta: modItem.duration || content.meta,
                imageUrl: modItem.courseImage || modItem.image || content.image,
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
                subtitle: lessonItem.courseAuthor || content.subtitle || 'EnhancedHR Expert',
                description: lessonItem.courseTitle || content.courseTitle || 'Lesson',
                meta: lessonItem.duration || content.meta,
                imageUrl: lessonItem.courseImage || lessonItem.image || content.image,
                actionLabel: 'START'
            };
            break;
        }
        case 'ACTIVITY': {
            const activityItem = item as any;
            const content = activityItem.content || {};
            cardProps = {
                ...cardProps,
                type: 'ACTIVITY',
                subtitle: activityItem.courseAuthor || content.subtitle || 'EnhancedHR Expert',
                description: activityItem.courseTitle || content.courseTitle || 'Activity',
                imageUrl: activityItem.courseImage || activityItem.image || content.image,
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
                subtitle: resContext.courseTitle || content.subtitle || 'Course Resource',
                description: resContext.summary || content.description || 'Course resource attachment',
                resourceType: resContext.resourceType || resContext.type || content.resourceType || 'File',
                meta: resContext.created_at ? new Date(resContext.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
                fileUrl: resContext.url,
                fileName: resContext.title
            };
            break;
        }
        case 'NOTE': {
            const note = item as Note;
            // Strip markdown and truncate for preview
            const plainContent = (note.content || '').replace(/[#*_`~\[\]]/g, '').trim();
            const preview = plainContent.length > 150 ? plainContent.slice(0, 150) + '...' : plainContent;
            cardProps = {
                ...cardProps,
                type: 'NOTE',
                title: note.title || 'Untitled Note',
                description: preview || 'No content',
                meta: note.updated_at ? new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
                actionLabel: 'EDIT'
            };
            break;
        }
        case 'VIDEO': {
            const video = item as any;
            cardProps = {
                ...cardProps,
                type: 'VIDEO',
                description: video.content?.description || '',
                meta: video.created_at ? new Date(video.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
                videoPlaybackId: video.content?.muxPlaybackId,
                videoExternalUrl: video.content?.externalUrl,
                videoStatus: video.content?.status,
                actionLabel: 'VIEW'
            };
            break;
        }
        default:
            cardProps.type = 'RESOURCE'; // Fallback
    }

    return <UniversalCard {...cardProps} />;
};

export default UniversalCollectionCard;
