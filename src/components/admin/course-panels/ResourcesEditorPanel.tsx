'use client';

import React, { useState, useTransition, useCallback } from 'react';
import { FileText, Trash2, Loader2, CheckCircle, Plus, Link2, File, Image as ImageIcon, Table, ExternalLink } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { addCourseResource, deleteCourseResource } from '@/app/actions/course-builder';
import { Resource } from '@/types';

type ResourceType = 'PDF' | 'DOC' | 'XLS' | 'IMG' | 'LINK';

interface ResourcesEditorPanelProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: number;
    resources: Resource[];
    onSave: () => void;
}

const resourceTypeIcons: Record<ResourceType, React.ReactNode> = {
    PDF: <FileText size={16} className="text-red-400" />,
    DOC: <File size={16} className="text-blue-400" />,
    XLS: <Table size={16} className="text-green-400" />,
    IMG: <ImageIcon size={16} className="text-purple-400" />,
    LINK: <ExternalLink size={16} className="text-brand-blue-light" />
};

export default function ResourcesEditorPanel({
    isOpen,
    onClose,
    courseId,
    resources,
    onSave
}: ResourcesEditorPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // New resource form
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newType, setNewType] = useState<ResourceType>('LINK');

    const resetForm = () => {
        setNewTitle('');
        setNewUrl('');
        setNewType('LINK');
        setIsAdding(false);
    };

    const handleAddResource = useCallback(() => {
        if (!newTitle.trim() || !newUrl.trim()) {
            setError('Title and URL are required');
            return;
        }

        setError(null);
        startTransition(async () => {
            const result = await addCourseResource(courseId, {
                title: newTitle.trim(),
                url: newUrl.trim(),
                type: newType
            });

            if (result.success) {
                setShowSuccess(true);
                resetForm();
                setTimeout(() => {
                    setShowSuccess(false);
                    onSave();
                }, 1000);
            } else {
                setError(result.error || 'Failed to add resource');
            }
        });
    }, [courseId, newTitle, newUrl, newType, onSave]);

    const handleDeleteResource = useCallback((resourceId: string) => {
        setError(null);
        startTransition(async () => {
            const result = await deleteCourseResource(resourceId, courseId);
            if (result.success) {
                onSave();
            } else {
                setError(result.error || 'Failed to delete resource');
            }
        });
    }, [courseId, onSave]);

    // Auto-detect type from URL
    const detectType = (url: string): ResourceType => {
        const lower = url.toLowerCase();
        if (lower.includes('.pdf')) return 'PDF';
        if (lower.includes('.doc') || lower.includes('.docx')) return 'DOC';
        if (lower.includes('.xls') || lower.includes('.xlsx')) return 'XLS';
        if (lower.includes('.jpg') || lower.includes('.png') || lower.includes('.gif') || lower.includes('.webp')) return 'IMG';
        return 'LINK';
    };

    const handleUrlChange = (url: string) => {
        setNewUrl(url);
        if (url) {
            setNewType(detectType(url));
        }
    };

    const headerActions = (
        <div className="flex items-center gap-4">
            {showSuccess && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle size={16} />
                    <span>Saved!</span>
                </div>
            )}
            {!isAdding && (
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-5 py-2 bg-brand-orange text-white rounded-lg text-sm font-bold hover:bg-brand-orange/80 transition-colors"
                >
                    <Plus size={16} />
                    Add Resource
                </button>
            )}
        </div>
    );

    return (
        <DropdownPanel
            isOpen={isOpen}
            onClose={onClose}
            title="Course Resources"
            icon={FileText}
            iconColor="text-brand-blue-light"
            headerActions={headerActions}
        >
            <div className="max-w-3xl space-y-6">
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <p className="text-sm text-slate-400">
                    Add downloadable resources like PDFs, documents, or links that learners can access alongside the course.
                </p>

                {/* Add Resource Form */}
                {isAdding && (
                    <div className="p-6 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                        <h3 className="font-bold text-white">Add New Resource</h3>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="e.g., Course Workbook"
                                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none focus:border-brand-blue-light/50"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                URL *
                            </label>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                <Link2 size={16} className="text-slate-400" />
                                <input
                                    type="url"
                                    value={newUrl}
                                    onChange={(e) => handleUrlChange(e.target.value)}
                                    placeholder="https://drive.google.com/... or direct file URL"
                                    className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Type
                            </label>
                            <div className="flex gap-2">
                                {(['PDF', 'DOC', 'XLS', 'IMG', 'LINK'] as ResourceType[]).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setNewType(type)}
                                        className={`
                                            flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
                                            ${newType === type
                                                ? 'bg-brand-blue-light/10 border-brand-blue-light/50'
                                                : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }
                                        `}
                                    >
                                        {resourceTypeIcons[type]}
                                        <span className="text-xs font-medium text-white">{type}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleAddResource}
                                disabled={isPending || !newTitle.trim() || !newUrl.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-bold hover:bg-brand-orange/80 transition-colors disabled:opacity-50"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={14} />
                                        Add Resource
                                    </>
                                )}
                            </button>
                            <button
                                onClick={resetForm}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Resources List */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Current Resources ({resources.length})
                    </label>
                    <div className="space-y-2">
                        {resources.length > 0 ? (
                            resources.map((resource) => (
                                <div
                                    key={resource.id}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 group"
                                >
                                    <div className="p-2 rounded-lg bg-white/5">
                                        {resourceTypeIcons[resource.type as ResourceType]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-white truncate">{resource.title}</h4>
                                        <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-slate-500 hover:text-brand-blue-light truncate block"
                                        >
                                            {resource.url}
                                        </a>
                                    </div>
                                    {resource.size && (
                                        <span className="text-xs text-slate-500">{resource.size}</span>
                                    )}
                                    <button
                                        onClick={() => handleDeleteResource(resource.id)}
                                        disabled={isPending}
                                        className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-slate-500 border border-dashed border-white/10 rounded-xl">
                                <FileText size={32} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">No resources added yet</p>
                                <p className="text-xs text-slate-600 mt-1">Click Add Resource to get started</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DropdownPanel>
    );
}
