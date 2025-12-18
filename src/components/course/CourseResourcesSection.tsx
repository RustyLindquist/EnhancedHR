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
        <div className="mt-10 animate-fade-in">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-orange/10">
                    <FileText size={16} className="text-brand-orange" />
                </div>
                <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-orange">
                    COURSE RESOURCES
                </h2>
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-slate-500">{resources.length} files</span>
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
