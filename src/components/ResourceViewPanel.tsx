'use client';

import React from 'react';
import {
    FileText,
    StickyNote,
    Paperclip,
    Download,
    Calendar,
    FileType,
    HardDrive,
    ExternalLink,
    Lightbulb,
    FileImage,
    FileSpreadsheet,
    FileCode,
    File
} from 'lucide-react';
import { UserContextItem } from '../types';
import GlobalTopPanel from './GlobalTopPanel';
import MarkdownRenderer from './MarkdownRenderer';

interface ResourceViewPanelProps {
    isOpen: boolean;
    onClose: () => void;
    resource: UserContextItem | null;
}

// Helper: Get appropriate icon based on file MIME type
const getFileIcon = (fileType: string | undefined) => {
    if (!fileType) return File;
    if (fileType.startsWith('image/')) return FileImage;
    if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) return FileSpreadsheet;
    if (fileType.includes('pdf')) return FileText;
    if (fileType.includes('code') || fileType.includes('javascript') || fileType.includes('json') || fileType.includes('text/plain')) return FileCode;
    return File;
};

// Helper: Format file size to human-readable format
const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Helper: Extract file extension from filename
const getFileExtension = (fileName: string | undefined): string => {
    if (!fileName) return '';
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
};

const ResourceViewPanel: React.FC<ResourceViewPanelProps> = ({
    isOpen,
    onClose,
    resource
}) => {
    if (!resource) return null;

    const isNote = (resource.content as any)?.isNote === true;
    const isFile = resource.type === 'FILE';
    const textContent = (resource.content as any)?.text || '';
    const fileUrl = (resource.content as any)?.url;
    const fileName = (resource.content as any)?.fileName;
    const fileSummary = (resource.content as any)?.summary;
    const fileType = (resource.content as any)?.fileType;
    const fileSize = (resource.content as any)?.fileSize;

    const formattedDate = new Date(resource.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // --- Header Title ---
    const renderTitle = () => (
        <>
            <div className={`p-2 rounded-lg ${isNote ? 'bg-amber-500/10 text-amber-400' : isFile ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                {isNote ? <StickyNote size={20} /> : isFile ? <Paperclip size={20} /> : <FileText size={20} />}
            </div>
            <h2 className="text-xl font-bold text-white">
                {isNote ? 'Note' : isFile ? 'File Resource' : 'Custom Context'}
            </h2>
        </>
    );

    // --- Header Actions (Download for files) ---
    const renderHeaderActions = () => {
        if (isFile && fileUrl) {
            return (
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
            );
        }
        return null;
    };

    // --- Notes View ---
    const renderNoteView = () => (
        <div className="space-y-6">
            {/* Title */}
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                    {resource.title}
                </h1>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Calendar size={14} />
                    <span>{formattedDate}</span>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                <div className="p-8">
                    {textContent ? (
                        <div className="prose prose-invert prose-lg max-w-none">
                            <MarkdownRenderer content={textContent} />
                        </div>
                    ) : (
                        <p className="text-slate-500 italic">No content</p>
                    )}
                </div>
            </div>
        </div>
    );

    // --- File View ---
    const renderFileView = () => {
        const FileIcon = getFileIcon(fileType);
        const extension = getFileExtension(fileName);

        return (
            <div className="space-y-6">
                {/* Header Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-transparent border border-blue-500/20 rounded-2xl p-8">
                    {/* Decorative blur elements */}
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
                                {resource.title}
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

                {/* Summary Card */}
                {fileSummary && (
                    <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
                        <div className="p-8">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                                File Summary
                            </h3>
                            <p className="text-slate-300 leading-relaxed text-lg">
                                {fileSummary}
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions Card */}
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

    // --- Custom Context View ---
    const renderContextView = () => (
        <div className="space-y-6">
            {/* Title */}
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                    {resource.title}
                </h1>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Calendar size={14} />
                    <span>{formattedDate}</span>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500" />
                <div className="p-8">
                    {textContent ? (
                        <div className="prose prose-invert prose-lg max-w-none">
                            <MarkdownRenderer content={textContent} />
                        </div>
                    ) : (
                        <p className="text-slate-500 italic">No content</p>
                    )}
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                        <Lightbulb size={20} className="text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-orange-400 mb-1">About Custom Context</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            This context is provided by Platform Admins to help guide your content creation.
                            Use this information when working with the AI assistant for better, more aligned results.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <GlobalTopPanel
            isOpen={isOpen}
            onClose={onClose}
            title={renderTitle()}
            headerActions={renderHeaderActions()}
        >
            <div className="max-w-4xl mx-auto pb-32 pt-[30px]">
                {isNote && renderNoteView()}
                {isFile && renderFileView()}
                {!isNote && !isFile && renderContextView()}
            </div>
        </GlobalTopPanel>
    );
};

export default ResourceViewPanel;
