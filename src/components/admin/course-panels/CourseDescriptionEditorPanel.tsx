'use client';

import React, { useState, useTransition, useCallback } from 'react';
import { FileText, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { updateCourseDetails, generateCourseDescription } from '@/app/actions/course-builder';

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
    { value: 'draft', label: 'Draft', color: 'text-yellow-400' },
    { value: 'pending_review', label: 'Pending Review', color: 'text-blue-400' },
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
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateDescription = useCallback(async () => {
        setError(null);
        setIsGenerating(true);

        try {
            const result = await generateCourseDescription(courseId);

            if (result.success && result.description) {
                setFormData(prev => ({ ...prev, description: result.description! }));
            } else {
                setError(result.error || 'Failed to generate description');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while generating the description');
        } finally {
            setIsGenerating(false);
        }
    }, [courseId]);

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
                status: formData.status as 'draft' | 'pending_review' | 'published' | 'archived'
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
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Description
                        </label>
                        <button
                            onClick={handleGenerateDescription}
                            disabled={isGenerating || isPending}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={12} className="animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={12} />
                                    Generate from Transcript
                                </>
                            )}
                        </button>
                    </div>

                    {/* Generation in progress indicator */}
                    {isGenerating && (
                        <div className="mb-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm flex items-center gap-3">
                            <Loader2 size={16} className="animate-spin" />
                            <div>
                                <p className="font-medium">Analyzing course content...</p>
                                <p className="text-xs text-purple-400/70 mt-0.5">This may take a moment</p>
                            </div>
                        </div>
                    )}

                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Write a compelling description that introduces the course to learners..."
                        rows={6}
                        disabled={isGenerating}
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none resize-none focus:border-brand-blue-light/50 disabled:opacity-50"
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
