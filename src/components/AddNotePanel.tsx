'use client';

import React, { useState, useEffect } from 'react';
import { StickyNote, Save } from 'lucide-react';
import { createContextItem, updateContextItem } from '../app/actions/context';
import { UserContextItem } from '../types';
import GlobalTopPanel from './GlobalTopPanel';
import MarkdownEditor from './MarkdownEditor';

interface AddNotePanelProps {
    isOpen: boolean;
    onClose: () => void;
    collectionId: string;
    itemToEdit?: UserContextItem | null;
    onSaveSuccess?: () => void;
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
    customCreateHandler,
    customUpdateHandler
}) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Reset or Load on Open
    useEffect(() => {
        if (isOpen) {
            if (itemToEdit) {
                setTitle(itemToEdit.title);
                const text = (itemToEdit.content as any).text || '';
                setContent(text);
            } else {
                setTitle('');
                setContent('');
            }
        }
    }, [isOpen, itemToEdit]);

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
            onClose();
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
                {itemToEdit ? 'Edit Note' : 'Add Note'}
            </h2>
        </>
    );

    // --- Header Actions ---
    const renderHeaderActions = () => (
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

    return (
        <GlobalTopPanel
            isOpen={isOpen}
            onClose={onClose}
            title={renderTitle()}
            headerActions={renderHeaderActions()}
        >
            <div className="max-w-4xl mx-auto space-y-6 pb-32 pt-[30px]">
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
        </GlobalTopPanel>
    );
};

export default AddNotePanel;
