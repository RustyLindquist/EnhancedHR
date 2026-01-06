'use client';

import React, { useState, useTransition, useCallback } from 'react';
import { Image, Upload, Link2, Trash2, Loader2, CheckCircle } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { updateCourseImage } from '@/app/actions/course-builder';

interface CourseImageEditorPanelProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: number;
    currentImage?: string;
    onSave: () => void;
}

export default function CourseImageEditorPanel({
    isOpen,
    onClose,
    courseId,
    currentImage,
    onSave
}: CourseImageEditorPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [imageUrl, setImageUrl] = useState(currentImage || '');
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSave = useCallback(() => {
        setError(null);
        startTransition(async () => {
            const result = await updateCourseImage(courseId, imageUrl || null);
            if (result.success) {
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    onSave();
                }, 1000);
            } else {
                setError(result.error || 'Failed to save image');
            }
        });
    }, [courseId, imageUrl, onSave]);

    const handleRemove = useCallback(() => {
        setImageUrl('');
    }, []);

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
            title="Edit Course Image"
            icon={Image}
            iconColor="text-brand-blue-light"
            headerActions={headerActions}
        >
            <div className="max-w-3xl space-y-8">
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Current Image Preview */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Current Image
                    </label>
                    <div className="relative w-full h-[200px] rounded-xl overflow-hidden border border-white/10 bg-slate-900">
                        {imageUrl ? (
                            <>
                                <img
                                    src={imageUrl}
                                    alt="Course preview"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={handleRemove}
                                    className="absolute top-3 right-3 p-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                                <Image size={48} className="mb-2 opacity-30" />
                                <p className="text-sm">No image set</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* URL Input */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Image URL
                    </label>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                        <Link2 size={16} className="text-slate-400" />
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                        />
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                        Enter a direct URL to an image file. Recommended dimensions: 1200x630px
                    </p>
                </div>

                {/* Upload Option - Placeholder for future implementation */}
                <div className="p-6 rounded-xl border-2 border-dashed border-white/10 text-center">
                    <Upload size={32} className="mx-auto mb-3 text-slate-600" />
                    <p className="text-sm text-slate-500">
                        Drag and drop an image here, or click to upload
                    </p>
                    <p className="text-xs text-slate-600 mt-2">
                        PNG, JPG, or WebP up to 5MB
                    </p>
                    <p className="text-xs text-slate-700 mt-4 italic">
                        (Upload feature coming soon)
                    </p>
                </div>
            </div>
        </DropdownPanel>
    );
}
