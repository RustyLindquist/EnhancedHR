'use client';

import React, { useState } from 'react';
import { X, Check, Plus } from 'lucide-react';
import { updateCourseDetails, generateCourseDescription, getPublishedCategories } from '@/app/actions/course-builder';

interface OrgCourseDescriptionPanelProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: number;
    currentTitle: string;
    currentDescription: string;
    currentCategories: string[];
    currentStatus?: string;
    onSave: () => void;
}

/**
 * OrgCourseDescriptionPanel - Description editor panel for organization courses.
 *
 * This panel only shows draft/published status options (unlike the platform course
 * description panel which includes pending_review status).
 */
export default function OrgCourseDescriptionPanel({
    isOpen,
    onClose,
    courseId,
    currentTitle,
    currentDescription,
    currentCategories,
    currentStatus,
    onSave
}: OrgCourseDescriptionPanelProps) {
    const [title, setTitle] = useState(currentTitle);
    const [description, setDescription] = useState(currentDescription);
    const [categories, setCategories] = useState<string[]>(currentCategories.length > 0 ? currentCategories : ['General']);
    const [status, setStatus] = useState<'draft' | 'published'>(
        currentStatus === 'published' ? 'published' : 'draft'
    );
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Dynamic categories state
    const [availableCategories, setAvailableCategories] = useState<string[]>(['General']);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    // Fetch available categories on mount
    React.useEffect(() => {
        async function loadCategories() {
            setIsLoadingCategories(true);
            const result = await getPublishedCategories();
            if (result.success && result.categories) {
                let cats = result.categories;
                currentCategories.forEach(cat => {
                    if (cat && !cats.includes(cat)) {
                        cats = [...cats, cat];
                    }
                });
                setAvailableCategories(cats.sort());
            }
            setIsLoadingCategories(false);
        }
        loadCategories();
    }, [currentCategories]);

    // Reset form when panel opens
    React.useEffect(() => {
        if (isOpen) {
            setTitle(currentTitle);
            setDescription(currentDescription);
            setCategories(currentCategories.length > 0 ? currentCategories : ['General']);
            setStatus(currentStatus === 'published' ? 'published' : 'draft');
        }
    }, [isOpen, currentTitle, currentDescription, currentCategories, currentStatus]);

    // Toggle a category selection
    const toggleCategory = (category: string) => {
        const isSelected = categories.includes(category);
        if (isSelected) {
            if (categories.length <= 1) return;
            setCategories(categories.filter(c => c !== category));
        } else {
            setCategories([...categories, category].sort());
        }
    };

    // Handle adding a new category
    const handleAddCategory = () => {
        const trimmed = newCategoryName.trim();
        if (trimmed) {
            if (!availableCategories.includes(trimmed)) {
                setAvailableCategories(prev => [...prev, trimmed].sort());
            }
            if (!categories.includes(trimmed)) {
                setCategories([...categories, trimmed].sort());
            }
            setNewCategoryName('');
            setIsAddingCategory(false);
        }
    };

    const handleSave = async () => {
        if (categories.length === 0) {
            alert('At least one category is required');
            return;
        }

        setIsSaving(true);
        try {
            const result = await updateCourseDetails(courseId, {
                title,
                description,
                categories,
                status
            });

            if (result.success) {
                onSave();
            } else {
                console.error('Failed to update course:', result.error);
                alert('Failed to save changes: ' + result.error);
            }
        } catch (error) {
            console.error('Error saving course:', error);
            alert('An error occurred while saving');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateDescription = async () => {
        setIsGenerating(true);
        try {
            const result = await generateCourseDescription(courseId);
            if (result.success && result.description) {
                setDescription(result.description);
            } else {
                alert(result.error || 'Failed to generate description');
            }
        } catch (error) {
            console.error('Error generating description:', error);
            alert('An error occurred while generating the description');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative bg-[#0B1120] border border-white/10 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Course Details</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Course Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                            placeholder="Enter course title"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-slate-300">
                                Description
                            </label>
                            <button
                                onClick={handleGenerateDescription}
                                disabled={isGenerating}
                                className="text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    'Generate with AI'
                                )}
                            </button>
                        </div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
                            placeholder="Enter course description"
                        />
                    </div>

                    {/* Categories - Multi-select */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Categories
                        </label>

                        {/* Selected categories display */}
                        <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
                            {categories.map(cat => (
                                <span
                                    key={cat}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium"
                                >
                                    {cat}
                                    {categories.length > 1 && (
                                        <button
                                            onClick={() => toggleCategory(cat)}
                                            className="hover:text-red-400 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </span>
                            ))}
                        </div>

                        {/* Add category input or dropdown toggle */}
                        {isAddingCategory ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddCategory();
                                        if (e.key === 'Escape') {
                                            setIsAddingCategory(false);
                                            setNewCategoryName('');
                                        }
                                    }}
                                    placeholder="New category name"
                                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
                                    autoFocus
                                />
                                <button
                                    onClick={handleAddCategory}
                                    disabled={!newCategoryName.trim()}
                                    className="px-3 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition-colors disabled:opacity-50"
                                >
                                    Add
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAddingCategory(false);
                                        setNewCategoryName('');
                                    }}
                                    className="px-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <button
                                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                    disabled={isLoadingCategories}
                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-left text-slate-400 hover:border-white/20 transition-colors disabled:opacity-50 text-sm"
                                >
                                    {isLoadingCategories ? 'Loading categories...' : 'Select categories...'}
                                </button>

                                {/* Dropdown */}
                                {showCategoryDropdown && (
                                    <div className="absolute z-50 top-full left-0 right-0 mt-1 p-2 rounded-lg bg-slate-900 border border-white/10 shadow-xl max-h-60 overflow-y-auto">
                                        {availableCategories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => toggleCategory(cat)}
                                                className={`
                                                    w-full flex items-center justify-between px-3 py-2 rounded-md text-left text-sm transition-colors
                                                    ${categories.includes(cat)
                                                        ? 'bg-amber-500/20 text-amber-400'
                                                        : 'text-white hover:bg-white/5'
                                                    }
                                                `}
                                            >
                                                <span>{cat}</span>
                                                {categories.includes(cat) && (
                                                    <Check size={16} />
                                                )}
                                            </button>
                                        ))}

                                        {/* Add new category button */}
                                        <button
                                            onClick={() => {
                                                setShowCategoryDropdown(false);
                                                setIsAddingCategory(true);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-md text-left text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors border-t border-white/10 pt-3"
                                        >
                                            <Plus size={14} />
                                            Add new category
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Click outside to close dropdown */}
                        {showCategoryDropdown && (
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowCategoryDropdown(false)}
                            />
                        )}
                    </div>

                    {/* Status Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Status
                        </label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStatus('draft')}
                                className={`
                                    flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all
                                    ${status === 'draft'
                                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                    }
                                `}
                            >
                                Draft
                            </button>
                            <button
                                onClick={() => setStatus('published')}
                                className={`
                                    flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all
                                    ${status === 'published'
                                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                    }
                                `}
                            >
                                Published
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                            {status === 'draft'
                                ? 'Draft courses are only visible to org admins.'
                                : 'Published courses are visible to all organization members.'}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
