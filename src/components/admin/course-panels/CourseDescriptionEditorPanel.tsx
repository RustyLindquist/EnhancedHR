'use client';

import React, { useState, useTransition, useCallback } from 'react';
import { FileText, Loader2, CheckCircle } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { updateCourseDetails } from '@/app/actions/course-builder';

interface CourseDescriptionEditorPanelProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: number;
    currentTitle: string;
    currentDescription: string;
    currentCategory: string;
    currentStatus?: string;
    onSave: () => void;
}

const CATEGORIES = [
    'General',
    'Leadership',
    'Compliance',
    'Benefits',
    'Talent Management',
    'HR Technology',
    'Employee Relations',
    'Compensation',
    'Diversity & Inclusion',
    'Learning & Development'
];

const STATUSES = [
    { value: 'draft', label: 'Draft', color: 'text-slate-400' },
    { value: 'published', label: 'Published', color: 'text-green-400' },
    { value: 'archived', label: 'Archived', color: 'text-orange-400' }
];

export default function CourseDescriptionEditorPanel({
    isOpen,
    onClose,
    courseId,
    currentTitle,
    currentDescription,
    currentCategory,
    currentStatus = 'draft',
    onSave
}: CourseDescriptionEditorPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [formData, setFormData] = useState({
        title: currentTitle,
        description: currentDescription,
        category: currentCategory,
        status: currentStatus
    });
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSave = useCallback(() => {
        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }

        setError(null);
        startTransition(async () => {
            const result = await updateCourseDetails(courseId, {
                title: formData.title.trim(),
                description: formData.description.trim(),
                category: formData.category,
                status: formData.status as 'draft' | 'published' | 'archived'
            });

            if (result.success) {
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    onSave();
                }, 1000);
            } else {
                setError(result.error || 'Failed to save');
            }
        });
    }, [courseId, formData, onSave]);

    const headerActions = (
        <div className="flex items-center gap-4">
            {showSuccess && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle size={16} />
                    <span>Saved!</span>
                </div>
            )}
            <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2 bg-brand-orange text-white rounded-lg text-sm font-bold hover:bg-brand-orange/80 transition-colors disabled:opacity-50"
            >
                {isPending ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                    </>
                ) : (
                    'Save Changes'
                )}
            </button>
        </div>
    );

    return (
        <DropdownPanel
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Course Details"
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

                {/* Title */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Course Title *
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter course title"
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-medium placeholder-slate-600 outline-none focus:border-brand-blue-light/50"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Write a compelling description that introduces the course to learners..."
                        rows={6}
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none resize-none focus:border-brand-blue-light/50"
                    />
                    <p className="text-xs text-slate-600 mt-2">
                        A good description explains what learners will gain and why this course matters.
                    </p>
                </div>

                {/* Category and Status - Side by Side */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Category */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Category
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-brand-blue-light/50 appearance-none cursor-pointer"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat} className="bg-slate-900">
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-brand-blue-light/50 appearance-none cursor-pointer"
                        >
                            {STATUSES.map(status => (
                                <option key={status.value} value={status.value} className="bg-slate-900">
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </DropdownPanel>
    );
}
