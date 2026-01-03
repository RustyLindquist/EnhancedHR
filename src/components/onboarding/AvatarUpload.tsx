'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { User, Upload, Check, Loader2, Camera } from 'lucide-react';
import { uploadAvatarAction } from '@/app/actions/profile';

interface AvatarUploadProps {
    currentAvatarUrl?: string | null;
    userId: string;
    size?: 'sm' | 'md' | 'lg';
    onUploadComplete?: (url: string) => void;
    onUploadError?: (error: string) => void;
    showEditButton?: boolean;
    className?: string;
}

const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
};

const iconSizes = {
    sm: 24,
    md: 36,
    lg: 48,
};

export default function AvatarUpload({
    currentAvatarUrl,
    userId,
    size = 'lg',
    onUploadComplete,
    onUploadError,
    showEditButton = false,
    className = '',
}: AvatarUploadProps) {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (successTimeoutRef.current) {
                clearTimeout(successTimeoutRef.current);
            }
        };
    }, []);

    const handleFileSelect = useCallback(async (file: File) => {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            onUploadError?.('Please use JPEG, PNG, GIF, or WebP images.');
            return;
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            onUploadError?.('Image must be less than 2MB. Please resize your image and try again.');
            return;
        }

        setIsUploading(true);
        setUploadSuccess(false);

        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const result = await uploadAvatarAction(formData);

            if (result.success && result.url) {
                setAvatarUrl(result.url);
                setUploadSuccess(true);
                onUploadComplete?.(result.url);

                // Reset success state after animation (with cleanup)
                if (successTimeoutRef.current) {
                    clearTimeout(successTimeoutRef.current);
                }
                successTimeoutRef.current = setTimeout(() => setUploadSuccess(false), 2000);
            } else {
                onUploadError?.(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            onUploadError?.('An unexpected error occurred');
        } finally {
            setIsUploading(false);
        }
    }, [onUploadComplete, onUploadError]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
        // Reset input value so same file can be re-uploaded
        e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={`relative inline-block ${className}`}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleInputChange}
                className="hidden"
            />

            {/* Avatar container */}
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    ${sizeClasses[size]}
                    relative rounded-full overflow-hidden cursor-pointer
                    border-2 transition-all duration-300
                    ${isDragging
                        ? 'border-brand-blue-light scale-105 shadow-[0_0_20px_rgba(120,192,240,0.4)]'
                        : 'border-white/20 hover:border-white/40'
                    }
                    ${isUploading ? 'opacity-75' : ''}
                    ${uploadSuccess ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]' : ''}
                    group
                `}
            >
                {/* Avatar image or placeholder */}
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                        <User size={iconSizes[size]} className="text-slate-400" />
                    </div>
                )}

                {/* Hover overlay */}
                <div className={`
                    absolute inset-0 bg-black/50 flex items-center justify-center
                    transition-opacity duration-200
                    ${isUploading || uploadSuccess ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                `}>
                    {isUploading ? (
                        <Loader2 size={iconSizes[size] * 0.6} className="text-white animate-spin" />
                    ) : uploadSuccess ? (
                        <Check size={iconSizes[size] * 0.6} className="text-emerald-400" />
                    ) : (
                        <Camera size={iconSizes[size] * 0.5} className="text-white" />
                    )}
                </div>

                {/* Upload ring animation */}
                {isUploading && (
                    <div className="absolute inset-0 rounded-full border-2 border-brand-blue-light animate-ping opacity-50" />
                )}
            </div>

            {/* Edit button (optional) */}
            {showEditButton && !isUploading && (
                <button
                    onClick={handleClick}
                    className="absolute -bottom-1 -right-1 p-2 bg-brand-blue-light rounded-full text-brand-black hover:bg-white transition-colors shadow-lg"
                >
                    <Camera size={14} />
                </button>
            )}
        </div>
    );
}
