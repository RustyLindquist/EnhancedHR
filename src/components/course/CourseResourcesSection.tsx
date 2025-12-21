'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { Resource, DragItem } from '../../types';
import ResourceCard from '../cards/ResourceCard';

interface CourseResourcesSectionProps {
    resources: Resource[];
    courseTitle: string;
    onAddToCollection: (item: DragItem) => void;
    onDragStart: (item: DragItem) => void;
}

const CourseResourcesSection: React.FC<CourseResourcesSectionProps> = ({
    resources,
    courseTitle,
    onAddToCollection,
    onDragStart
}) => {
    if (resources.length === 0) {
        return null;
    }

    const handleAdd = (resource: Resource) => {
        const dragItem: DragItem = {
            type: 'RESOURCE',
            id: resource.id,
            title: resource.title,
            subtitle: resource.type,
            meta: resource.size
        };
        onAddToCollection(dragItem);
    };

    const handleDragStart = (resource: Resource) => (e: React.DragEvent) => {
        const dragItem: DragItem = {
            type: 'RESOURCE',
            id: resource.id,
            title: resource.title,
            subtitle: resource.type,
            meta: resource.size
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dragItem));
        onDragStart(dragItem);
    };

    return (
        <div className="mt-8 animate-fade-in">
            {/* Section Header - Centered */}
            <div className="flex items-center justify-center gap-3 py-[20px]">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
                <div className="flex items-center gap-2">
                    <FileText size={14} className="text-brand-orange" />
                    <h2 className="text-[10px] font-bold tracking-[0.25em] uppercase text-slate-400">
                        COURSE RESOURCES
                    </h2>
                </div>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {resources.map((resource) => (
                    <ResourceCard
                        key={resource.id}
                        title={resource.title}
                        courseTitle={courseTitle}
                        fileSize={resource.size}
                        fileUrl={resource.url}
                        onAdd={() => handleAdd(resource)}
                        showRemove={false}
                        draggable
                        onDragStart={handleDragStart(resource)}
                    />
                ))}
            </div>
        </div>
    );
};

export default CourseResourcesSection;
