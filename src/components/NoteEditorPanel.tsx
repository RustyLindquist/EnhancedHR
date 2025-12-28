'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StickyNote, Trash2, BookOpen, Check, Loader2 } from 'lucide-react';
import MarkdownEditor from './MarkdownEditor';
import { Note } from '../types';
import { getNoteAction, updateNoteAction, deleteNoteAction } from '../app/actions/notes';
import GlobalTopPanel from './GlobalTopPanel';

interface NoteEditorPanelProps {
    isOpen: boolean;
    onClose: () => void;
    noteId: string | null;
    onSaveSuccess?: () => void;
    onDeleteSuccess?: (noteId: string) => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const NoteEditorPanel: React.FC<NoteEditorPanelProps> = ({
    isOpen,
    onClose,
    noteId,
    onSaveSuccess,
    onDeleteSuccess
}) => {
    const [note, setNote] = useState<Note | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedRef = useRef<{ title: string; content: string }>({ title: '', content: '' });

    // Load note when panel opens
    useEffect(() => {
        if (isOpen && noteId) {
            setIsLoading(true);
            setSaveStatus('idle');
            getNoteAction(noteId)
                .then((loadedNote) => {
                    if (loadedNote) {
                        setNote(loadedNote);
                        setTitle(loadedNote.title);
                        setContent(loadedNote.content);
                        lastSavedRef.current = { title: loadedNote.title, content: loadedNote.content };
                    }
                })
                .finally(() => setIsLoading(false));
        } else if (!isOpen) {
            // Reset state when panel closes
            setNote(null);
            setTitle('');
            setContent('');
            setSaveStatus('idle');
            setShowDeleteConfirm(false);
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        }
    }, [isOpen, noteId]);

    // Auto-save with debounce
    const debouncedSave = useCallback(async (newTitle: string, newContent: string) => {
        if (!noteId) return;

        // Don't save if nothing changed
        if (newTitle === lastSavedRef.current.title && newContent === lastSavedRef.current.content) {
            return;
        }

        setSaveStatus('saving');

        try {
            const updated = await updateNoteAction(noteId, {
                title: newTitle || 'Untitled Note',
                content: newContent
            });

            if (updated) {
                lastSavedRef.current = { title: newTitle, content: newContent };
                setSaveStatus('saved');
                onSaveSuccess?.();

                // Reset to idle after 2 seconds
                setTimeout(() => {
                    setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev));
                }, 2000);
            } else {
                setSaveStatus('error');
            }
        } catch (error) {
            console.error('[NoteEditorPanel] Error saving note:', error);
            setSaveStatus('error');
        }
    }, [noteId, onSaveSuccess]);

    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);
        setSaveStatus('saving');

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            debouncedSave(newTitle, content);
        }, 500);
    };

    const handleContentChange = (newContent: string) => {
        setContent(newContent);
        setSaveStatus('saving');

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            debouncedSave(title, newContent);
        }, 500);
    };

    const handleDelete = async () => {
        if (!noteId || isDeleting) return;

        setIsDeleting(true);
        try {
            const result = await deleteNoteAction(noteId);
            if (result.success) {
                onDeleteSuccess?.(noteId);
                onClose();
            } else {
                alert('Failed to delete note: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('[NoteEditorPanel] Error deleting note:', error);
            alert('Failed to delete note');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    // Format save status display
    const renderSaveStatus = () => {
        switch (saveStatus) {
            case 'saving':
                return (
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving...</span>
                    </div>
                );
            case 'saved':
                return (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                        <Check size={14} />
                        <span>Saved</span>
                    </div>
                );
            case 'error':
                return (
                    <div className="text-red-400 text-sm">
                        <span>Error saving</span>
                    </div>
                );
            default:
                return null;
        }
    };

    // --- Header Title ---
    const renderTitle = () => (
        <>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <StickyNote size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">
                {note?.course_title ? (
                    <span className="flex items-center gap-2">
                        Edit Note
                        <span className="text-sm font-normal text-slate-400 flex items-center gap-1">
                            <BookOpen size={14} />
                            from {note.course_title}
                        </span>
                    </span>
                ) : (
                    'Edit Note'
                )}
            </h2>
        </>
    );

    // --- Header Actions ---
    const renderHeaderActions = () => (
        <div className="flex items-center gap-4">
            {renderSaveStatus()}

            {showDeleteConfirm ? (
                <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-full px-4 py-2">
                    <span className="text-red-400 text-sm">Delete this note?</span>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-red-400 hover:text-red-300 font-bold text-sm"
                    >
                        {isDeleting ? 'Deleting...' : 'Yes'}
                    </button>
                    <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="text-slate-400 hover:text-white text-sm"
                    >
                        No
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <Trash2 size={16} />
                    Delete
                </button>
            )}
        </div>
    );

    return (
        <GlobalTopPanel
            isOpen={isOpen}
            onClose={onClose}
            title={renderTitle()}
            headerActions={renderHeaderActions()}
        >
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-amber-400" />
                </div>
            ) : (
                <div className="max-w-4xl mx-auto space-y-6 pb-32 pt-[30px]">
                    {/* Title Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
                            Note Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="Untitled Note"
                            autoFocus
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all text-lg"
                        />
                    </div>

                    {/* WYSIWYG Markdown Editor */}
                    <div>
                        <MarkdownEditor
                            value={content}
                            onChange={handleContentChange}
                            placeholder="Start writing your note..."
                        />
                    </div>

                    {/* Note metadata footer */}
                    {note && (
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-white/10">
                            <span>
                                Last updated: {new Date(note.updated_at).toLocaleString()}
                            </span>
                            <span>
                                Created: {new Date(note.created_at).toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </GlobalTopPanel>
    );
};

export default NoteEditorPanel;
