'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';

// --- Exported constants ---

export const SUPPORTED_FILE_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
];

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.csv,.json,.jpg,.jpeg,.png,.gif,.webp';

// --- Exported helpers ---

export function validateFile(file: File): string | null {
    if (
        !SUPPORTED_FILE_TYPES.includes(file.type) &&
        !file.name.match(/\.(pdf|docx?|pptx?|xlsx?|txt|md|csv|json|jpe?g|png|gif|webp)$/i)
    ) {
        return 'Unsupported file type. Please upload PDF, Word, PowerPoint, Excel, images, or text files.';
    }
    if (file.size > MAX_FILE_SIZE) {
        return 'File too large. Maximum size is 25MB.';
    }
    return null;
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// --- Component ---

export interface FileUploadZoneProps {
    onFilesSelected: (files: File[]) => void;
    onRemoveFile: (index: number) => void;
    selectedFiles: File[];
    maxFiles?: number;
    disabled?: boolean;
    uploadingIndex?: number;
    className?: string;
}

export default function FileUploadZone({
    onFilesSelected,
    onRemoveFile,
    selectedFiles,
    maxFiles,
    disabled = false,
    uploadingIndex,
    className = '',
}: FileUploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isSingleMode = maxFiles === 1;
    const hasReachedLimit = maxFiles !== undefined && selectedFiles.length >= maxFiles;

    const processFiles = useCallback(
        (fileList: FileList | File[]) => {
            const incoming = Array.from(fileList);
            const validFiles: File[] = [];

            for (const file of incoming) {
                if (isSingleMode && (selectedFiles.length + validFiles.length) >= 1) break;
                if (maxFiles !== undefined && (selectedFiles.length + validFiles.length) >= maxFiles) break;

                const error = validateFile(file);
                if (error) continue;

                if (
                    selectedFiles.some((f) => f.name === file.name) ||
                    validFiles.some((f) => f.name === file.name)
                ) {
                    continue;
                }

                validFiles.push(file);
            }

            if (validFiles.length > 0) {
                onFilesSelected(validFiles);
            }
        },
        [onFilesSelected, selectedFiles, isSingleMode, maxFiles]
    );

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFiles(files);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFiles(files);
        }
    };

    const openFilePicker = () => {
        if (!disabled) fileInputRef.current?.click();
    };

    // Single-file "replace" view
    if (isSingleMode && selectedFiles.length === 1) {
        const file = selectedFiles[0];
        const isUploading = uploadingIndex === 0;

        return (
            <div className={className}>
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileInputChange}
                    accept={ACCEPTED_EXTENSIONS}
                    className="hidden"
                    disabled={disabled}
                />
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="p-2 rounded-lg bg-white/10">
                        <FileText size={16} className="text-brand-blue-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                    </div>
                    {isUploading ? (
                        <Loader2 size={16} className="text-brand-blue-light animate-spin" />
                    ) : (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={openFilePicker}
                                disabled={disabled}
                                className="px-2 py-1 text-xs text-slate-400 hover:text-brand-blue-light transition-colors disabled:opacity-50"
                            >
                                Replace
                            </button>
                            <button
                                onClick={() => onRemoveFile(0)}
                                disabled={disabled}
                                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Multi-file / empty view
    return (
        <div className={className}>
            <input
                ref={fileInputRef}
                type="file"
                multiple={!isSingleMode}
                onChange={handleFileInputChange}
                accept={ACCEPTED_EXTENSIONS}
                className="hidden"
                disabled={disabled}
            />

            {!hasReachedLimit && (
                <div
                    onClick={openFilePicker}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                        relative p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        ${isDragging
                            ? 'border-brand-blue-light bg-brand-blue-light/10'
                            : selectedFiles.length > 0
                                ? 'border-green-500/50 bg-green-500/5'
                                : 'border-white/20 hover:border-white/40 bg-white/[0.02]'
                        }
                    `}
                >
                    <div className="text-center">
                        <Upload size={28} className="mx-auto mb-2 text-slate-500" />
                        <p className="text-white font-medium mb-1">
                            {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-slate-500">
                            PDF, Word, PowerPoint, Excel, images, or text files up to 25MB each
                        </p>
                    </div>
                </div>
            )}

            {selectedFiles.length > 0 && (
                <div className="space-y-2 mt-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-400">
                            {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} ready to upload
                        </span>
                        {selectedFiles.length > 1 && (
                            <button
                                onClick={() => {
                                    for (let i = selectedFiles.length - 1; i >= 0; i--) {
                                        onRemoveFile(i);
                                    }
                                }}
                                disabled={disabled}
                                className="text-xs text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                            >
                                Clear all
                            </button>
                        )}
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                        {selectedFiles.map((file, index) => {
                            const isUploading = uploadingIndex === index;
                            return (
                                <div
                                    key={`${file.name}-${index}`}
                                    className={`flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 ${
                                        isUploading ? 'ring-2 ring-brand-blue-light' : ''
                                    }`}
                                >
                                    <div className="p-2 rounded-lg bg-white/10">
                                        <FileText size={16} className="text-brand-blue-light" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{file.name}</p>
                                        <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                                    </div>
                                    {isUploading ? (
                                        <Loader2 size={16} className="text-brand-blue-light animate-spin" />
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveFile(index);
                                            }}
                                            disabled={disabled}
                                            className="p-1.5 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
