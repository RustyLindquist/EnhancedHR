'use client';

import React from 'react';
import {
    Paperclip,
    Download,
    ExternalLink,
    FileText,
    FileImage,
    FileSpreadsheet,
    File
} from 'lucide-react';
import { Resource } from '../../types';
import GlobalTopPanel from '../GlobalTopPanel';

interface CourseResourcePanelProps {
    isOpen: boolean;
    onClose: () => void;
    resource: Resource | null;
    courseTitle: string;
}

const getFileIcon = (type: string) => {
    switch (type) {
        case 'IMG': return FileImage;
        case 'PDF': return FileText;
        case 'XLS': return FileSpreadsheet;
        case 'DOC': return FileText;
        default: return File;
    }
};

const CourseResourcePanel: React.FC<CourseResourcePanelProps> = ({
    isOpen,
    onClose,
    resource,
    courseTitle
}) => {
    if (!resource) return null;

    const isImage = resource.type === 'IMG' || /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)(\?|$)/i.test(resource.url);
    const FileIcon = getFileIcon(resource.type);
    const extension = resource.title.includes('.') ? resource.title.split('.').pop()?.toUpperCase() : resource.type;

    const renderTitle = () => (
        <>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                <Paperclip size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Course Resource</h2>
        </>
    );

    const renderHeaderActions = () => (
        <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            download={resource.title}
            className="flex items-center gap-2 px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wide bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-400 hover:to-orange-400 transition-all shadow-lg shadow-red-500/25"
        >
            Download
            <Download size={14} />
        </a>
    );

    return (
        <GlobalTopPanel
            isOpen={isOpen}
            onClose={onClose}
            title={renderTitle()}
            headerActions={renderHeaderActions()}
        >
            <div className="max-w-4xl mx-auto pb-32 pt-[30px]">
                <div className="space-y-6">
                    {/* Header Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-red-500/20 via-orange-500/10 to-transparent border border-red-500/20 rounded-2xl p-8">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />

                        <div className="relative flex items-start gap-5">
                            <div className="relative">
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/30">
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
                                        <Paperclip size={14} />
                                        <span>{resource.type} file</span>
                                    </div>
                                    {resource.size && (
                                        <div className="flex items-center gap-2">
                                            <File size={14} />
                                            <span>{resource.size}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-red-400/70">
                                        <span>from {courseTitle}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Image Preview */}
                    {isImage && (
                        <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden">
                            <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500" />
                            <div className="p-4">
                                <img
                                    src={resource.url}
                                    alt={resource.title}
                                    className="w-full max-h-[50vh] object-contain rounded-lg"
                                />
                            </div>
                        </div>
                    )}

                    {/* Actions Card */}
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                            Quick Actions
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all"
                            >
                                <ExternalLink size={16} />
                                <span className="font-medium">Open in New Tab</span>
                            </a>
                            <a
                                href={resource.url}
                                download={resource.title}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 text-red-400 hover:from-red-500/30 hover:to-orange-500/30 hover:text-red-300 transition-all"
                            >
                                <Download size={16} />
                                <span className="font-medium">Download File</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </GlobalTopPanel>
    );
};

export default CourseResourcePanel;
