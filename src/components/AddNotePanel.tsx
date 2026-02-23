'use client';

import React, { useState, useEffect } from 'react';
import { StickyNote, Save, Pencil, Calendar } from 'lucide-react';
import { createContextItem, updateContextItem } from '../app/actions/context';
import { UserContextItem } from '../types';
import GlobalTopPanel from './GlobalTopPanel';
import MarkdownEditor from './MarkdownEditor';
import MarkdownRenderer from './MarkdownRenderer';

interface AddNotePanelProps {
    isOpen: boolean;
    onClose: () => void;
    collectionId: string;
    itemToEdit?: UserContextItem | null;
    onSaveSuccess?: () => void;
    // View/Edit mode support (following VideoPanel pattern)
    mode?: 'view' | 'edit';     // Initial mode. Default: 'edit' (backward compat)
    canEdit?: boolean;           // Show Edit button in view mode. Default: true (backward compat)
    // Optional custom handlers for special collections (e.g., Expert Resources)
    customCreateHandler?: (data: { type: 'CUSTOM_CONTEXT'; title: string; content: any }) => Promise<{ success: boolean; error?: string }>;
    customUpdateHandler?: (id: string, updates: { title?: string; content?: any }) => Promise<{ success: boolean; error?: string }>;
}

const AddNotePanel: React.FC<AddNotePanelProps> = ({
    isOpen,
    onClose,
    collectionId,
    itemToEdit,
    onSaveSuccess,
    mode,
    canEdit = true,
    customCreateHandler,
    customUpdateHandler
}) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    // View/Edit mode state (following VideoPanel pattern)
    const [currentMode, setCurrentMode] = useState<'view' | 'edit'>(mode || 'edit');

    // Reset or Load on Open
    useEffect(() => {
        if (isOpen) {
            if (itemToEdit) {
                setTitle(itemToEdit.title);
                const text = (itemToEdit.content as any).text || '';
                setContent(text);
                // Existing notes default to view mode
                setCurrentMode(itemToEdit.id ? (mode || 'view') : 'edit');
            } else {
                setTitle('');
                setContent('');
                setCurrentMode('edit');
            }
        }
    }, [isOpen, itemToEdit, mode]);

    const handleSave = async () => {
        if (!title.trim()) {
            return;
        }

        setIsSaving(true);
        try {
            const contentToSave = { text: content, isNote: true };
            let result: { success: boolean; error?: string };

            if (itemToEdit && itemToEdit.id) {
                // Update existing
                if (customUpdateHandler) {
                    result = await customUpdateHandler(itemToEdit.id, {
                        title: title.trim(),
                        content: contentToSave
                    });
                } else {
                    result = await updateContextItem(itemToEdit.id, {
                        title: title.trim(),
                        content: contentToSave
                    });
                }
            } else {
                // Create new
                if (customCreateHandler) {
                    result = await customCreateHandler({
                        type: 'CUSTOM_CONTEXT',
                        title: title.trim() || 'Untitled Note',
                        content: contentToSave
                    });
                } else {
                    result = await createContextItem({
                        collection_id: collectionId,
                        type: 'CUSTOM_CONTEXT',
                        title: title.trim() || 'Untitled Note',
                        content: contentToSave
                    });
                }
            }

            if (!result.success) {
                throw new Error(result.error || 'Save failed');
            }

            if (onSaveSuccess) onSaveSuccess();
            // After save, switch to view mode if editing existing note, otherwise close
            if (itemToEdit && itemToEdit.id) {
                setCurrentMode('view');
            } else {
                onClose();
            }
        } catch (error) {
            console.error("Failed to save note", error);
            alert(error instanceof Error ? error.message : "Failed to save note.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- Header Title ---
    const renderTitle = () => (
        <>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <StickyNote size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">
                {currentMode === 'view' ? 'Note' : (itemToEdit ? 'Edit Note' : 'Add Note')}
            </h2>
        </>
    );

    // --- Header Actions ---
    const renderHeaderActions = () => {
        // View mode: Edit button only (if canEdit)
        if (currentMode === 'view' && itemToEdit) {
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

        // Edit mode: Save button
        return (
            <button
                onClick={handleSave}
                disabled={isSaving || !title.trim()}
                className="
                    flex items-center gap-2 px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wide
                    bg-amber-500 text-brand-black hover:bg-amber-400 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.3)]
                    disabled:opacity-50 disabled:cursor-not-allowed
                "
            >
                {isSaving ? 'Saving...' : 'Save Note'}
                {!isSaving && <Save size={14} />}
            </button>
        );
    };

    // --- Note View Mode ---
    const renderNoteViewMode = () => {
        if (!itemToEdit) return null;

        const formattedDate = new Date(itemToEdit.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

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
                    <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                    <div className="p-8">
                        {content ? (
                            <div className="prose prose-invert prose-lg max-w-none">
                                <MarkdownRenderer content={content} />
                            </div>
                        ) : (
                            <p className="text-slate-500 italic">No content</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <GlobalTopPanel
            isOpen={isOpen}
            onClose={onClose}
            title={renderTitle()}
            headerActions={renderHeaderActions()}
        >
            {currentMode === 'view' ? (
                renderNoteViewMode()
            ) : (
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Title Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
                            Note Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter a title for your note..."
                            autoFocus
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all text-lg"
                        />
                    </div>

                    {/* Markdown Editor */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
                            Note Content
                        </label>
                        <MarkdownEditor
                            value={content}
                            onChange={setContent}
                            placeholder="Write your note here..."
                        />
                    </div>
                </div>
            )}
        </GlobalTopPanel>
    );
};

export default AddNotePanel;
