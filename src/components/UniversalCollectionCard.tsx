import React from 'react';
import { Course, Conversation, Module, Lesson, Resource } from '../types';
import CardStack from './CardStack';
import ConversationCard from './ConversationCard';
import { FileText, Video, List, BookOpen, Trash2, Shield, PlayCircle, Box } from 'lucide-react';

// Unified type for all renderable items in a collection
export type CollectionItemDetail =
    | (Course & { itemType: 'COURSE' })
    | (Conversation & { itemType: 'CONVERSATION' })
    | (Module & { itemType: 'MODULE'; courseTitle?: string })
    | (Lesson & { itemType: 'LESSON'; courseTitle?: string; moduleTitle?: string })
    | (Resource & { itemType: 'RESOURCE'; courseTitle?: string });

interface UniversalCollectionCardProps {
    item: CollectionItemDetail;
    onRemove: (id: string, type: string) => void;
    onClick: (item: CollectionItemDetail) => void;
}

const UniversalCollectionCard: React.FC<UniversalCollectionCardProps> = ({ item, onRemove, onClick }) => {

    // --- COURSE ---
    if (item.itemType === 'COURSE') {
        const course = item as Course;
        return (
            <div className="relative group">
                {/* Overlay Remove Button for Collection View */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(String(course.id), 'COURSE');
                    }}
                    className="absolute top-2 right-2 z-50 p-2 bg-black/60 text-slate-400 hover:text-red-400 hover:bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                    title="Remove from collection"
                >
                    <Trash2 size={16} />
                </button>
                <CardStack
                    {...course}
                    depth="single"
                    onClick={() => onClick(item)}
                    // Disable the default add button or change its behavior? 
                    // CardStack displays 'isSaved' state. We can pass isSaved={true}.
                    isSaved={true}
                />
            </div>
        );
    }

    // --- CONVERSATION ---
    if (item.itemType === 'CONVERSATION') {
        const conversation = item as Conversation;
        return (
            <div className="relative group">
                <ConversationCard
                    {...conversation}
                    onClick={() => onClick(item)}
                    onDelete={() => onRemove(conversation.id, 'CONVERSATION')}
                />
            </div>
        );
    }

    // --- GENERIC CARD (Module, Lesson, Resource) ---
    // We'll create a generic glass card for these smaller items

    let Icon = Box;
    let label = 'Item';
    let subLabel = '';

    if (item.itemType === 'MODULE') {
        Icon = List;
        label = 'Module';
        subLabel = item.courseTitle || 'Course Module';
    } else if (item.itemType === 'LESSON') {
        Icon = item.type === 'video' ? Video : item.type === 'quiz' ? Shield : FileText;
        label = 'Lesson';
        subLabel = item.moduleTitle || item.courseTitle || 'Course Lesson';
    } else if (item.itemType === 'RESOURCE') {
        Icon = BookOpen;
        label = item.type || 'Resource';
        subLabel = item.courseTitle || 'Course Material';
    }

    return (
        <div
            onClick={() => onClick(item)}
            className="
                relative group cursor-pointer w-full h-48 perspective-1000
            "
        >
            <div className="
                relative w-full h-full z-20
                bg-[#0f172a]/70
                backdrop-blur-2xl 
                border border-white/10
                rounded-2xl flex flex-col
                shadow-xl
                transition-all duration-300 group-hover:-translate-y-2 
                group-hover:shadow-[0_20px_40px_-12px_rgba(120,192,240,0.15)]
                group-hover:border-white/20
                overflow-hidden
            ">

                {/* Header */}
                <div className="p-5 border-b border-white/5 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${item.itemType === 'MODULE' ? 'bg-purple-500/10 text-purple-400' :
                                item.itemType === 'LESSON' ? 'bg-brand-blue/10 text-brand-blue' :
                                    'bg-emerald-500/10 text-emerald-400'
                            }`}>
                            <Icon size={20} />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
                            <h3 className="text-md font-bold text-white leading-tight group-hover:text-brand-blue-light transition-colors line-clamp-1">
                                {item.title}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 p-5 relative">
                    <p className="text-sm text-slate-400 line-clamp-2">
                        {subLabel}
                    </p>
                    {/* Specific details based on type */}
                    {(item.itemType === 'LESSON' || item.itemType === 'MODULE') && (
                        <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                            <PlayCircle size={12} />
                            {item.duration || '0m'}
                        </div>
                    )}
                </div>

                {/* Footer / Remove Action */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item.id, item.itemType);
                    }}
                    className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors z-30"
                    title="Remove from collection"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

export default UniversalCollectionCard;
