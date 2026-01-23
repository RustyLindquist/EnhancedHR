'use client';

import React from 'react';
import { FileText, StickyNote, Paperclip, Download } from 'lucide-react';
import { UserContextItem } from '../types';
import GlobalTopPanel from './GlobalTopPanel';
import MarkdownRenderer from './MarkdownRenderer';

interface ResourceViewPanelProps {
    isOpen: boolean;
    onClose: () => void;
    resource: UserContextItem | null;
}

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

    // --- Header Title ---
    const renderTitle = () => (
        <>
            <div className={`p-2 rounded-lg ${isNote ? 'bg-amber-500/10 text-amber-400' : isFile ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                {isNote ? <StickyNote size={20} /> : isFile ? <Paperclip size={20} /> : <FileText size={20} />}
            </div>
            <h2 className="text-xl font-bold text-white">
                {isNote ? 'Note' : isFile ? 'File' : 'Context'}
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
                    className="flex items-center gap-2 px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wide bg-blue-500 text-white hover:bg-blue-400 transition-colors"
                >
                    Download
                    <Download size={14} />
                </a>
            );
        }
        return null;
    };

    return (
        <GlobalTopPanel
            isOpen={isOpen}
            onClose={onClose}
            title={renderTitle()}
            headerActions={renderHeaderActions()}
        >
            <div className="max-w-4xl mx-auto space-y-6 pb-32 pt-[30px]">
                {/* Title */}
                <h1 className="text-2xl font-bold text-white">
                    {resource.title}
                </h1>

                {/* Content */}
                {isFile ? (
                    <div className="bg-black/30 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-lg bg-blue-500/10">
                                <Paperclip size={24} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-white font-medium">{fileName || resource.title}</p>
                                <p className="text-slate-500 text-sm">
                                    {(resource.content as any)?.fileType || 'Unknown type'}
                                </p>
                            </div>
                        </div>
                        {fileSummary && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
                                    Summary
                                </p>
                                <p className="text-slate-300 leading-relaxed">
                                    {fileSummary}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-black/30 border border-white/10 rounded-xl p-6">
                        {textContent ? (
                            <MarkdownRenderer content={textContent} />
                        ) : (
                            <p className="text-slate-500 italic">No content</p>
                        )}
                    </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-slate-500">
                        Added on {new Date(resource.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
            </div>
        </GlobalTopPanel>
    );
};

export default ResourceViewPanel;
