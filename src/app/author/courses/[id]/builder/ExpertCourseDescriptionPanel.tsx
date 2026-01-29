'use client';

import React, { useState, useTransition, useCallback, useEffect } from 'react';
import { FileText, Loader2, CheckCircle, Plus, X, Check } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { updateExpertCourseDetails } from '@/app/actions/expert-course-builder';
import { getPublishedCategories } from '@/app/actions/course-builder';

interface ExpertCourseDescriptionPanelProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: number;
    currentTitle: string;
    currentDescription: string;
    currentCategories: string[]; // Changed from currentCategory: string
    onSave: () => void;
}

export default function ExpertCourseDescriptionPanel({
    isOpen,
    onClose,
    courseId,
    currentTitle,
    currentDescription,
    currentCategories,
    onSave
}: ExpertCourseDescriptionPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [formData, setFormData] = useState({
        title: currentTitle,
        description: currentDescription,
        categories: currentCategories.length > 0 ? currentCategories : ['General']
    });
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Dynamic categories state
    const [availableCategories, setAvailableCategories] = useState<string[]>(['General']);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    // Fetch categories from published courses on mount
    useEffect(() => {
        async function loadCategories() {
            setIsLoadingCategories(true);
            const result = await getPublishedCategories();
            if (result.success && result.categories) {
                let cats = result.categories;
                // Add any current categories not in the list
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

    // Toggle a category selection
    const toggleCategory = useCallback((category: string) => {
        setFormData(prev => {
            const isSelected = prev.categories.includes(category);
            if (isSelected) {
                // Don't allow removing the last category
                if (prev.categories.length <= 1) {
                    return prev;
                }
                return {
                    ...prev,
                    categories: prev.categories.filter(c => c !== category)
                };
            } else {
                return {
                    ...prev,
                    categories: [...prev.categories, category].sort()
                };
            }
        });
    }, []);

    // Handle adding a new category
    const handleAddCategory = useCallback(() => {
        const trimmed = newCategoryName.trim();
        if (trimmed) {
            if (!availableCategories.includes(trimmed)) {
                setAvailableCategories(prev => [...prev, trimmed].sort());
            }
            // Also select the new category
            setFormData(prev => ({
                ...prev,
                categories: prev.categories.includes(trimmed)
                    ? prev.categories
                    : [...prev.categories, trimmed].sort()
            }));
            setNewCategoryName('');
            setIsAddingCategory(false);
        }
    }, [newCategoryName, availableCategories]);

    const handleSave = useCallback(() => {
        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }

        if (formData.categories.length === 0) {
            setError('At least one category is required');
            return;
        }

        setError(null);
        startTransition(async () => {
            const result = await updateExpertCourseDetails(courseId, {
                title: formData.title.trim(),
                description: formData.description.trim(),
                categories: formData.categories
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

                {/* Categories - Multi-select */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Categories
                    </label>

                    {/* Selected categories display */}
                    <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
                        {formData.categories.map(cat => (
                            <span
                                key={cat}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-blue-light/20 text-brand-blue-light text-sm font-medium"
                            >
                                {cat}
                                {formData.categories.length > 1 && (
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
                                className="flex-1 p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none focus:border-brand-blue-light/50 text-sm"
                                autoFocus
                            />
                            <button
                                onClick={handleAddCategory}
                                disabled={!newCategoryName.trim()}
                                className="px-3 rounded-lg bg-brand-orange text-white text-sm font-medium hover:bg-brand-orange/80 transition-colors disabled:opacity-50"
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
                                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-left text-slate-400 hover:border-white/20 transition-colors disabled:opacity-50 text-sm"
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
                                                ${formData.categories.includes(cat)
                                                    ? 'bg-brand-blue-light/20 text-brand-blue-light'
                                                    : 'text-white hover:bg-white/5'
                                                }
                                            `}
                                        >
                                            <span>{cat}</span>
                                            {formData.categories.includes(cat) && (
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

                {/* Note about status */}
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm text-blue-300">
                        <strong>Note:</strong> Your course is currently in <span className="font-bold text-yellow-400">Draft</span> status.
                        When you're ready, use the "Submit for Review" button in the header to submit it for admin approval.
                    </p>
                </div>
            </div>
        </DropdownPanel>
    );
}
