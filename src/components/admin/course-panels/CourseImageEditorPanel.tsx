'use client';

import React, { useState, useTransition, useCallback, useRef } from 'react';
import { Image, Upload, Link2, Trash2, Loader2, CheckCircle } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { updateCourseImage, uploadCourseImageAction } from '@/app/actions/course-builder';

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
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileSelect = useCallback(async (file: File) => {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Please use JPEG, PNG, or WebP images.');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB. Please resize your image and try again.');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const result = await uploadCourseImageAction(courseId, formData);

            if (result.success && result.url) {
                setImageUrl(result.url);
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    onSave();
                }, 1000);
            } else {
                setError(result.error || 'Upload failed');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('An unexpected error occurred during upload');
        } finally {
            setIsUploading(false);
        }
    }, [courseId, onSave]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
        // Reset input value so same file can be re-uploaded
        e.target.value = '';
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

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
                disabled={isPending || isUploading}
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
            {/* Wrapper to prevent browser default drag behavior across the entire panel */}
            <div
                className="max-w-3xl space-y-8"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleInputChange}
                    className="hidden"
                />

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

                {/* Upload Option */}
                <div
                    onClick={handleUploadClick}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                        p-6 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all
                        ${isDragging
                            ? 'border-brand-blue-light bg-brand-blue-light/10 scale-[1.02]'
                            : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                        }
                        ${isUploading ? 'opacity-75 pointer-events-none' : ''}
                    `}
                >
                    {isUploading ? (
                        <>
                            <Loader2 size={32} className="mx-auto mb-3 text-brand-blue-light animate-spin" />
                            <p className="text-sm text-slate-400">
                                Uploading image...
                            </p>
                        </>
                    ) : (
                        <>
                            <Upload size={32} className={`mx-auto mb-3 ${isDragging ? 'text-brand-blue-light' : 'text-slate-500'}`} />
                            <p className={`text-sm ${isDragging ? 'text-brand-blue-light' : 'text-slate-400'}`}>
                                Drag and drop an image here, or click to upload
                            </p>
                            <p className="text-xs text-slate-600 mt-2">
                                PNG, JPG, or WebP up to 5MB (recommended: 2400×800px)
                            </p>
                        </>
                    )}
                </div>

                {/* URL Input */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Or Enter Image URL
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
                        Enter a direct URL to an image file (PNG, JPG, or WebP).
                    </p>
                </div>

                {/* Recommended Dimensions Info */}
                <div className="p-4 rounded-xl bg-brand-blue-light/10 border border-brand-blue-light/20">
                    <h4 className="text-sm font-semibold text-brand-blue-light mb-2">
                        Recommended Dimensions
                    </h4>
                    <p className="text-white font-mono text-lg mb-2">
                        2400 × 800 px
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        This wide banner format (3:1 aspect ratio) is optimized for full-screen viewing on retina displays.
                        The image will be cropped to fit, so keep important content centered.
                    </p>
                </div>
            </div>
        </DropdownPanel>
    );
}
