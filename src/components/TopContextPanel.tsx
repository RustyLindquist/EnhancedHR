import React, { useState, useEffect, useRef } from 'react';
import { X, Save, FileText, User, Upload, Brain, Loader2, Pencil, Download, Calendar, FileType, HardDrive, ExternalLink, Paperclip, StickyNote } from 'lucide-react';
import { ContextItemType, UserContextItem, ProfileDetails } from '../types';
import { createContextItem, updateContextItem, createFileContextItem, replaceFileContextItem } from '../app/actions/context';
import GlobalTopPanel from './GlobalTopPanel';
import MarkdownRenderer from './MarkdownRenderer';
import { getFileIcon, formatFileSize, getFileExtension } from '../lib/file-display-utils';

interface TopContextPanelProps {
    isOpen: boolean;
    onClose: () => void;
    activeCollectionId: string;
    itemToEdit?: UserContextItem | null;
    initialType?: ContextItemType; // For "Add Context" vs "Add File"
    userId: string;
    onSaveSuccess?: () => void;
    // View/Edit mode support (following VideoPanel pattern)
    mode?: 'view' | 'edit';     // Initial mode. Default: 'edit' (backward compat)
    canEdit?: boolean;           // Show Edit button in view mode. Default: true (backward compat)
    // Optional custom handlers for special collections (e.g., Expert Resources)
    customCreateHandler?: (data: { type: ContextItemType; title: string; content: any }) => Promise<{ success: boolean; error?: string; id?: string }>;
    customUpdateHandler?: (id: string, updates: { title?: string; content?: any }) => Promise<{ success: boolean; error?: string }>;
    customFileCreateHandler?: (fileName: string, fileType: string, fileBuffer: ArrayBuffer, title?: string) => Promise<{ success: boolean; error?: string; id?: string }>;
}

const TopContextPanel: React.FC<TopContextPanelProps> = ({
    isOpen,
    onClose,
    activeCollectionId,
    itemToEdit,
    initialType = 'CUSTOM_CONTEXT',
    userId,
    onSaveSuccess,
    mode,
    canEdit = true,
    customCreateHandler,
    customUpdateHandler,
    customFileCreateHandler
}) => {
    const [title, setTitle] = useState('');
    const [textContent, setTextContent] = useState('');
    // File State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Profile Fields
    const [profileData, setProfileData] = useState<ProfileDetails['content']>({});

    const [isSaving, setIsSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string | null>(null);
    const [itemType, setItemType] = useState<ContextItemType>(initialType);
    // View/Edit mode state (following VideoPanel pattern)
    const [currentMode, setCurrentMode] = useState<'view' | 'edit'>(mode || 'edit');

    // Supported file types for upload
    const SUPPORTED_TYPES = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint',
        'text/plain',
        'text/markdown',
        'text/csv',
        'application/json',
        'image/jpeg',
        'image/png',
        'image/gif'
    ];

    // Reset or Load on Open
    useEffect(() => {
        if (isOpen) {
            if (itemToEdit) {
                setItemType(itemToEdit.type);
                setTitle(itemToEdit.title);
                if (itemToEdit.type === 'CUSTOM_CONTEXT' || itemToEdit.type === 'AI_INSIGHT') {
                    setTextContent((itemToEdit.content as any).text || (itemToEdit.content as any).insight || '');
                } else if (itemToEdit.type === 'PROFILE') {
                    setProfileData(itemToEdit.content);
                }
                // For existing FILE, CUSTOM_CONTEXT, and AI_INSIGHT items, default to view mode
                if ((itemToEdit.type === 'FILE' || itemToEdit.type === 'CUSTOM_CONTEXT' || itemToEdit.type === 'AI_INSIGHT') && itemToEdit.id) {
                    setCurrentMode(mode || 'view');
                } else {
                    setCurrentMode(mode || 'edit');
                }
            } else {
                // New Item — always edit mode
                setItemType(initialType);
                setTitle('');
                setTextContent('');
                setSelectedFile(null);
                setUploadProgress(null);
                setProfileData({});
                setCurrentMode('edit');
            }
        }
    }, [isOpen, itemToEdit, initialType, mode]);

    // Handle panel close — reset mode
    const handleClose = () => {
        setSelectedFile(null);
        setUploadProgress(null);
        onClose();
    };

    // Handle file selection from input or drop
    const handleFileSelect = (file: File) => {
        // Check file type
        if (!SUPPORTED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|docx|pptx?|txt|md|csv|json|jpg|jpeg|png|gif)$/i)) {
            alert('Unsupported file type. Supported: PDF, DOCX, PPTX, TXT, MD, CSV, JSON, JPG, PNG, GIF');
            return;
        }
        // Check file size (max 25MB)
        if (file.size > 25 * 1024 * 1024) {
            alert('File too large. Maximum size is 25MB.');
            return;
        }
        setSelectedFile(file);
        if (!title) {
            setTitle(file.name);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setUploadProgress(null);
        try {
            const targetCollectionId = activeCollectionId;
            let result: { success: boolean; error?: string; id?: string };

            // Handle file replacement on existing FILE items
            if (itemType === 'FILE' && selectedFile && itemToEdit) {
                setUploadProgress('Uploading replacement file...');
                const fileBuffer = await selectedFile.arrayBuffer();

                setUploadProgress('Processing...');
                if (customFileCreateHandler) {
                    // For expert resources, use the create handler (which handles the 3-phase upload)
                    // but pass the title. The old item will need separate cleanup.
                    result = await customFileCreateHandler(
                        selectedFile.name,
                        selectedFile.type,
                        fileBuffer,
                        title || undefined
                    );
                    // If creation succeeded, delete the old item via update with replacement flag
                    // For now, use the replace server action as a simpler path
                } else {
                    result = await replaceFileContextItem(
                        itemToEdit.id,
                        selectedFile.name,
                        selectedFile.type,
                        fileBuffer,
                        title || undefined
                    );
                }
                setUploadProgress('Done');
            }
            // Handle new FILE type with full upload pipeline
            else if (itemType === 'FILE' && selectedFile && !itemToEdit) {
                setUploadProgress('Uploading file...');
                const fileBuffer = await selectedFile.arrayBuffer();

                setUploadProgress('Parsing content...');
                if (customFileCreateHandler) {
                    result = await customFileCreateHandler(
                        selectedFile.name,
                        selectedFile.type,
                        fileBuffer,
                        title || undefined
                    );
                } else {
                    result = await createFileContextItem(
                        targetCollectionId,
                        selectedFile.name,
                        selectedFile.type,
                        fileBuffer,
                        title || undefined
                    );
                }
                setUploadProgress('Generating embeddings...');
            } else {
                // Handle other types (CUSTOM_CONTEXT, PROFILE, AI_INSIGHT, FILE title-only edit)
                let contentToSave: any = {};

                if (itemType === 'CUSTOM_CONTEXT') {
                    contentToSave = { text: textContent };
                } else if (itemType === 'AI_INSIGHT') {
                    contentToSave = { ...itemToEdit?.content, insight: textContent };
                } else if (itemType === 'PROFILE') {
                    contentToSave = profileData;
                } else if (itemType === 'FILE') {
                    // Editing existing file — just update metadata (no new file selected)
                    contentToSave = itemToEdit?.content || {};
                }

                if (itemToEdit && itemToEdit.id !== 'virtual-profile-placeholder') {
                    // Update existing
                    if (customUpdateHandler) {
                        result = await customUpdateHandler(itemToEdit.id, {
                            title: title || 'Untitled',
                            content: contentToSave
                        });
                    } else {
                        result = await updateContextItem(itemToEdit.id, {
                            title: title || 'Untitled',
                            content: contentToSave
                        });
                    }
                } else {
                    // Create new
                    if (customCreateHandler) {
                        result = await customCreateHandler({
                            type: itemType,
                            title: title || (itemType === 'PROFILE' ? 'My Profile' : 'Untitled Context'),
                            content: contentToSave
                        });
                    } else {
                        result = await createContextItem({
                            collection_id: targetCollectionId,
                            type: itemType,
                            title: title || (itemType === 'PROFILE' ? 'My Profile' : 'Untitled Context'),
                            content: contentToSave
                        });
                    }
                }
            }

            if (!result!.success) {
                throw new Error(result!.error || 'Failed to save item');
            }
            setSelectedFile(null);
            if (onSaveSuccess) onSaveSuccess();

            // After save, switch to view mode if editing existing item with view support, otherwise close
            if (itemToEdit && (itemType === 'FILE' || itemType === 'CUSTOM_CONTEXT' || itemType === 'AI_INSIGHT')) {
                setCurrentMode('view');
            } else {
                handleClose();
            }
        } catch (error) {
            console.error("Failed to save context", error);
            alert(error instanceof Error ? error.message : "Failed to save context item.");
        } finally {
            setIsSaving(false);
            setUploadProgress(null);
        }
    };

    // Check if current item is a note (stored as CUSTOM_CONTEXT with isNote flag)
    const isNote = itemType === 'CUSTOM_CONTEXT' && (itemToEdit?.content as any)?.isNote === true;

    // --- Header Title ---
    const renderTitle = () => {
        const getViewModeTitle = () => {
            if (itemType === 'FILE') return 'File Resource';
            if (isNote) return 'Note';
            if (itemType === 'AI_INSIGHT') return 'AI Insight';
            if (itemType === 'CUSTOM_CONTEXT') return 'Custom Context';
            return 'Context Item';
        };

        return (
            <>
                <div className={`p-2 rounded-lg ${itemType === 'PROFILE' ? 'bg-brand-green/10 text-brand-green' :
                    itemType === 'AI_INSIGHT' ? 'bg-purple-500/10 text-purple-400' :
                        itemType === 'FILE' ? 'bg-blue-500/10 text-blue-400' :
                            isNote ? 'bg-amber-500/10 text-amber-400' : 'bg-orange-500/10 text-orange-400'
                    }`}>
                    {itemType === 'PROFILE' && <User size={20} />}
                    {itemType === 'AI_INSIGHT' && <Brain size={20} />}
                    {itemType === 'CUSTOM_CONTEXT' && (isNote ? <StickyNote size={20} /> : <FileText size={20} />)}
                    {itemType === 'FILE' && <Paperclip size={20} />}
                </div>
                <h2 className="text-xl font-bold text-white">
                    {currentMode === 'view'
                        ? getViewModeTitle()
                        : itemType === 'PROFILE' ? 'Profile Details'
                        : (itemToEdit && itemToEdit.id !== 'virtual-profile-placeholder' ? 'Edit Context Item' : 'Add Context Item')}
                </h2>
            </>
        );
    };

    // --- Header Actions ---
    const renderHeaderActions = () => {
        // View mode actions
        if (currentMode === 'view' && itemToEdit) {
            // FILE view mode: Edit button + Download button
            if (itemType === 'FILE') {
                const fileUrl = (itemToEdit.content as any)?.url;
                const fileName = (itemToEdit.content as any)?.fileName;
                return (
                    <div className="flex items-center gap-3">
                        {canEdit && (
                            <button
                                onClick={() => setCurrentMode('edit')}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all"
                            >
                                <Pencil size={14} />
                                Edit
                            </button>
                        )}
                        {fileUrl && (
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={fileName}
                                className="flex items-center gap-2 px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wide bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-400 hover:to-cyan-400 transition-all shadow-lg shadow-blue-500/25"
                            >
                                Download
                                <Download size={14} />
                            </a>
                        )}
                    </div>
                );
            }
            // Text view mode (CUSTOM_CONTEXT / AI_INSIGHT): Edit button only
            if (itemType === 'CUSTOM_CONTEXT' || itemType === 'AI_INSIGHT') {
                return canEdit ? (
                    <button
                        onClick={() => setCurrentMode('edit')}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all"
                    >
                        <Pencil size={14} />
                        Edit
                    </button>
                ) : null;
            }
        }

        // Edit mode: Save button
        return (
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="
                    flex items-center gap-2 px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wide
                    bg-brand-blue-light text-brand-black hover:bg-white transition-colors shadow-[0_0_20px_rgba(120,192,240,0.3)]
                    disabled:opacity-50 disabled:cursor-not-allowed
                "
            >
                {isSaving ? 'Saving...' : 'Save'}
                {!isSaving && <Save size={14} />}
            </button>
        );
    };

    // --- File View Mode ---
    const renderFileViewMode = () => {
        if (!itemToEdit) return null;

        const content = itemToEdit.content as any;
        const fileUrl = content?.url;
        const fileName = content?.fileName;
        const mimeType = content?.fileType;
        const fileSize = content?.fileSize;
        const summary = content?.summary;
        const FileIcon = getFileIcon(mimeType);
        const extension = getFileExtension(fileName);
        const isImage = mimeType?.startsWith('image/');
        const isPdf = mimeType?.includes('pdf');

        const formattedDate = new Date(itemToEdit.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        return (
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-transparent border border-blue-500/20 rounded-2xl p-8">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl" />

                    <div className="relative flex items-start gap-5">
                        <div className="relative">
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30">
                                <FileIcon size={32} className="text-white" />
                            </div>
                            {extension && (
                                <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">
                                    {extension}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold text-white mb-3">
                                {itemToEdit.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                                <div className="flex items-center gap-2">
                                    <FileType size={14} />
                                    <span className="truncate max-w-[200px]">{fileName || 'Unknown file'}</span>
                                </div>
                                {fileSize && (
                                    <div className="flex items-center gap-2">
                                        <HardDrive size={14} />
                                        <span>{formatFileSize(fileSize)}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>{formattedDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* File Preview Area */}
                {isImage && fileUrl && (
                    <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden p-4">
                        <img
                            src={fileUrl}
                            alt={itemToEdit.title}
                            className="max-w-full max-h-[500px] mx-auto rounded-lg object-contain"
                        />
                    </div>
                )}
                {isPdf && fileUrl && (
                    <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden">
                        <iframe
                            src={fileUrl}
                            className="w-full h-[600px]"
                            title={itemToEdit.title}
                            style={{ border: 'none' }}
                        />
                    </div>
                )}
                {!isImage && !isPdf && (
                    <div className="bg-black/30 border border-white/10 rounded-2xl p-12 flex flex-col items-center text-center">
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 mb-4">
                            <FileIcon size={48} className="text-blue-400" />
                        </div>
                        {extension && (
                            <p className="text-slate-400 text-sm font-medium">{extension} Document</p>
                        )}
                    </div>
                )}

                {/* AI Summary Card */}
                {summary && (
                    <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
                        <div className="p-8">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                                File Summary
                            </h3>
                            <p className="text-slate-300 leading-relaxed text-lg">
                                {summary}
                            </p>
                        </div>
                    </div>
                )}

                {/* Quick Actions Card */}
                {fileUrl && (
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                            Quick Actions
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all"
                            >
                                <ExternalLink size={16} />
                                <span className="font-medium">Open in New Tab</span>
                            </a>
                            <a
                                href={fileUrl}
                                download={fileName}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 hover:from-blue-500/30 hover:to-cyan-500/30 hover:text-blue-300 transition-all md:hidden"
                            >
                                <Download size={16} />
                                <span className="font-medium">Download File</span>
                            </a>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // --- Text View Mode (CUSTOM_CONTEXT / AI_INSIGHT) ---
    const renderTextViewMode = () => {
        if (!itemToEdit) return null;

        const content = itemToEdit.content as any;
        const displayText = content?.text || content?.insight || '';

        const formattedDate = new Date(itemToEdit.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        const gradientColors = isNote
            ? 'from-amber-500 to-orange-500'
            : itemType === 'AI_INSIGHT'
                ? 'from-purple-500 to-pink-500'
                : 'from-orange-500 to-red-500';

        return (
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Title */}
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {itemToEdit.title}
                    </h1>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Calendar size={14} />
                        <span>{formattedDate}</span>
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden">
                    <div className={`h-1 bg-gradient-to-r ${gradientColors}`} />
                    <div className="p-8">
                        {displayText ? (
                            <div className="prose prose-invert prose-lg max-w-none">
                                <MarkdownRenderer content={displayText} />
                            </div>
                        ) : (
                            <p className="text-slate-500 italic">No content</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // --- File Edit Mode (existing file) ---
    const renderFileEditMode = () => {
        const content = itemToEdit?.content as any;
        const existingFileName = content?.fileName;
        const existingFileSize = content?.fileSize;
        const existingFileType = content?.fileType;
        const ExistingFileIcon = existingFileType ? getFileIcon(existingFileType) : FileText;

        return (
            <>
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md,.csv,.json,.jpg,.jpeg,.png,.gif"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                    }}
                />

                {/* Selected replacement file */}
                {selectedFile ? (
                    <div className="border border-blue-500/30 bg-blue-500/5 rounded-2xl p-6 flex items-center justify-between group animate-fade-in-up">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h3 className="text-white font-medium">{selectedFile.name}</h3>
                                <p className="text-xs text-blue-400">
                                    {(selectedFile.size / 1024).toFixed(1)} KB &bull; New file &mdash; replaces current
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedFile(null)}
                            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-red-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                ) : itemToEdit ? (
                    /* Show current file info with Replace button */
                    <div className="border border-white/10 bg-white/5 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
                                    <ExistingFileIcon size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-medium">{existingFileName || 'Current file'}</h3>
                                    <p className="text-xs text-slate-400">
                                        {formatFileSize(existingFileSize)} &bull; Current file
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-white/10 rounded-full text-sm font-bold text-white hover:bg-white/20 transition-colors"
                            >
                                Replace File
                            </button>
                        </div>
                    </div>
                ) : (
                    /* New file upload area */
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.add('border-brand-blue-light', 'bg-brand-blue-light/10');
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.remove('border-brand-blue-light', 'bg-brand-blue-light/10');
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.remove('border-brand-blue-light', 'bg-brand-blue-light/10');
                            const file = e.dataTransfer.files?.[0];
                            if (file) handleFileSelect(file);
                        }}
                        className="border-2 border-dashed border-white/10 rounded-2xl p-16 flex flex-col items-center justify-center text-slate-500 hover:border-brand-blue-light/50 hover:bg-white/5 transition-all cursor-pointer group"
                    >
                        <div className="p-4 bg-white/5 rounded-full mb-4 group-hover:scale-110 transition-transform">
                            <Upload size={32} className="text-slate-400 group-hover:text-brand-blue-light" />
                        </div>
                        <p className="text-lg font-medium text-slate-300">Drag and drop file here</p>
                        <p className="text-sm opacity-50 mt-2 mb-6">Support for PDF, DOCX, PPTX, TXT, MD, CSV, JSON, JPG, PNG, GIF (max 25MB)</p>
                        <button
                            type="button"
                            className="px-6 py-2 bg-white/10 rounded-full text-sm font-bold text-white hover:bg-white/20 transition-colors"
                        >
                            Browse Files
                        </button>
                    </div>
                )}

                {/* Upload progress indicator */}
                {uploadProgress && (
                    <div className="flex items-center gap-3 text-brand-blue-light mt-4">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">{uploadProgress}</span>
                    </div>
                )}
            </>
        );
    };

    return (
        <GlobalTopPanel
            isOpen={isOpen}
            onClose={handleClose}
            title={renderTitle()}
            headerActions={renderHeaderActions()}
        >
            {/* View mode for FILE, CUSTOM_CONTEXT, AI_INSIGHT */}
            {currentMode === 'view' && itemType === 'FILE' ? (
                renderFileViewMode()
            ) : currentMode === 'view' && (itemType === 'CUSTOM_CONTEXT' || itemType === 'AI_INSIGHT') ? (
                renderTextViewMode()
            ) : (
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Title Input */}
                    {itemType !== 'PROFILE' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
                                {itemType === 'AI_INSIGHT' ? 'Insight Source' : 'Title / Identifier'}
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={itemType === 'AI_INSIGHT'}
                                placeholder="e.g. Project Alpha Specs"
                                className={`w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-brand-blue-light transition-all text-lg
                                       ${itemType === 'AI_INSIGHT' ? 'opacity-60 cursor-not-allowed' : ''}
                                   `}
                            />
                            {itemType === 'AI_INSIGHT' && (
                                <p className="text-[10px] text-purple-400 mt-2 flex items-center gap-1">
                                    <Brain size={12} />
                                    Extracted from conversation
                                </p>
                            )}
                        </div>
                    )}

                    {/* Content Editors */}
                    {(itemType === 'CUSTOM_CONTEXT' || itemType === 'AI_INSIGHT') && (
                        <div className="h-[300px]">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Context / Insight</label>
                            <textarea
                                value={textContent}
                                onChange={(e) => setTextContent(e.target.value)}
                                placeholder="Enter detailed context here..."
                                className="w-full h-full bg-black/40 border border-white/10 rounded-xl p-4 text-slate-300 focus:outline-none focus:border-brand-blue-light transition-all resize-none text-base leading-relaxed font-light"
                            />
                            <p className="text-xs text-slate-500 mt-2 text-right">Press Enter for new line.</p>
                        </div>
                    )}

                    {itemType === 'PROFILE' && (
                        <div className="space-y-8">
                            {/* Top Grid: Short Inputs */}
                            <div className="grid grid-cols-2 gap-6">
                                {[
                                    { k: 'role', l: 'Role / Job Title' },
                                    { k: 'yearsInRole', l: 'Years in Role' },
                                    { k: 'yearsInCompany', l: 'Years in Company' },
                                    { k: 'yearsInHR', l: 'Years in HR' },
                                    { k: 'linkedInUrl', l: 'LinkedIn URL' },
                                    { k: 'directReports', l: 'Number of Direct Reports' },
                                ].map(({ k, l }) => (
                                    <div key={k}>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">{l}</label>
                                        <input
                                            type="text"
                                            value={(profileData as any)[k] || ''}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, [k]: e.target.value }))}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-green transition-all"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Bottom List: Long Text Areas */}
                            <div className="space-y-6">
                                {[
                                    { k: 'objectives', l: 'Objectives & Goals' },
                                    { k: 'measuresOfSuccess', l: 'Measures of Success' },
                                    { k: 'areasOfConcern', l: 'Current Areas of Concern' },
                                    { k: 'areasOfInterest', l: 'Current Areas of Interest' },
                                ].map(({ k, l }) => (
                                    <div key={k}>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">{l}</label>
                                        <textarea
                                            rows={5}
                                            value={(profileData as any)[k] || ''}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, [k]: e.target.value }))}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-brand-green transition-all resize-y"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {itemType === 'FILE' && renderFileEditMode()}
                </div>
            )}
        </GlobalTopPanel>
    );
};

export default TopContextPanel;
