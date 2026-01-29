'use client';

import React, { useState, useTransition, useCallback, useRef } from 'react';
import { FileText, Trash2, Loader2, CheckCircle, Plus, Link2, File, Image as ImageIcon, Table, ExternalLink, Upload, X } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { addCourseResource, deleteCourseResource, uploadCourseResourceFile } from '@/app/actions/course-builder';
import { Resource } from '@/types';

type ResourceType = 'PDF' | 'DOC' | 'XLS' | 'IMG' | 'LINK';
type AddMode = 'upload' | 'link';

// Supported file types for upload
const SUPPORTED_FILE_TYPES = [
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

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

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
    const [addMode, setAddMode] = useState<AddMode>('upload');
    const [uploadProgress, setUploadProgress] = useState<string | null>(null);

    // File upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Link form state
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newType, setNewType] = useState<ResourceType>('LINK');

    const resetForm = () => {
        setNewTitle('');
        setNewUrl('');
        setNewType('LINK');
        setSelectedFile(null);
        setIsAdding(false);
        setUploadProgress(null);
        setError(null);
    };

    // File validation
    const validateFile = (file: File): string | null => {
        if (!SUPPORTED_FILE_TYPES.includes(file.type) &&
            !file.name.match(/\.(pdf|docx?|pptx?|xlsx?|txt|md|csv|json|jpe?g|png|gif|webp)$/i)) {
            return 'Unsupported file type. Please upload PDF, Word, PowerPoint, Excel, images, or text files.';
        }
        if (file.size > MAX_FILE_SIZE) {
            return 'File too large. Maximum size is 25MB.';
        }
        return null;
    };

    // Handle file selection
    const handleFileSelect = (file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }
        setError(null);
        setSelectedFile(file);
    };

    // Handle file input change
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    // Drag and drop handlers
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

    // Handle file upload
    const handleFileUpload = useCallback(async () => {
        if (!selectedFile) {
            setError('Please select a file');
            return;
        }

        setError(null);
        setUploadProgress('Uploading file...');

        startTransition(async () => {
            try {
                const fileBuffer = await selectedFile.arrayBuffer();
                setUploadProgress('Processing and indexing...');

                const result = await uploadCourseResourceFile(
                    courseId,
                    selectedFile.name,
                    selectedFile.type,
                    fileBuffer
                );

                if (result.success) {
                    setShowSuccess(true);
                    resetForm();
                    setTimeout(() => {
                        setShowSuccess(false);
                        onSave();
                    }, 1000);
                } else {
                    setError(result.error || 'Failed to upload file');
                    setUploadProgress(null);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Upload failed');
                setUploadProgress(null);
            }
        });
    }, [courseId, selectedFile, onSave]);

    // Handle link addition (existing functionality)
    const handleAddLink = useCallback(() => {
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

    // Format file size for display
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
                    Upload files or add links to resources that learners can download alongside the course. Uploaded files are automatically indexed for AI search.
                </p>

                {/* Add Resource Form */}
                {isAdding && (
                    <div className="p-6 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-white">Add New Resource</h3>
                            <button
                                onClick={resetForm}
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Mode Toggle */}
                        <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
                            <button
                                onClick={() => setAddMode('upload')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    addMode === 'upload'
                                        ? 'bg-brand-blue-light/20 text-brand-blue-light'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Upload size={16} />
                                Upload File
                            </button>
                            <button
                                onClick={() => setAddMode('link')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    addMode === 'link'
                                        ? 'bg-brand-blue-light/20 text-brand-blue-light'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Link2 size={16} />
                                Add Link
                            </button>
                        </div>

                        {/* Upload Mode */}
                        {addMode === 'upload' && (
                            <>
                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={handleFileInputChange}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.csv,.json,.jpg,.jpeg,.png,.gif,.webp"
                                    className="hidden"
                                />

                                {/* Drop zone */}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`
                                        relative p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all
                                        ${isDragging
                                            ? 'border-brand-blue-light bg-brand-blue-light/10'
                                            : selectedFile
                                                ? 'border-green-500/50 bg-green-500/5'
                                                : 'border-white/20 hover:border-white/40 bg-white/[0.02]'
                                        }
                                    `}
                                >
                                    {selectedFile ? (
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-lg bg-white/10">
                                                <FileText size={24} className="text-brand-blue-light" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-white truncate">{selectedFile.name}</p>
                                                <p className="text-sm text-slate-400">{formatFileSize(selectedFile.size)}</p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedFile(null);
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Upload size={32} className="mx-auto mb-3 text-slate-500" />
                                            <p className="text-white font-medium mb-1">
                                                {isDragging ? 'Drop file here' : 'Click to upload or drag and drop'}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                PDF, Word, PowerPoint, Excel, images, or text files up to 25MB
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Upload button */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleFileUpload}
                                        disabled={isPending || !selectedFile}
                                        className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-bold hover:bg-brand-orange/80 transition-colors disabled:opacity-50"
                                    >
                                        {isPending ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                {uploadProgress || 'Processing...'}
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={14} />
                                                Upload Resource
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
                            </>
                        )}

                        {/* Link Mode */}
                        {addMode === 'link' && (
                            <>
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
                                        onClick={handleAddLink}
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
                                                Add Link
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
                            </>
                        )}
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
