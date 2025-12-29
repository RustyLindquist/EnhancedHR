'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Check } from 'lucide-react';
import MarkdownEditor from './MarkdownEditor';
import { Note } from '../types';
import { getNoteAction, updateNoteAction } from '../app/actions/notes';

interface CourseNotePanelEditorProps {
    noteId: string;
    onSaveSuccess?: () => void;
    onLoadComplete?: (note: Note) => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const CourseNotePanelEditor: React.FC<CourseNotePanelEditorProps> = ({
    noteId,
    onSaveSuccess,
    onLoadComplete
}) => {
    const [note, setNote] = useState<Note | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [isLoading, setIsLoading] = useState(true);

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedRef = useRef<{ title: string; content: string }>({ title: '', content: '' });

    // Load note when component mounts or noteId changes
    useEffect(() => {
        if (noteId) {
            setIsLoading(true);
            setSaveStatus('idle');
            getNoteAction(noteId)
                .then((loadedNote) => {
                    if (loadedNote) {
                        setNote(loadedNote);
                        setTitle(loadedNote.title);
                        setContent(loadedNote.content);
                        lastSavedRef.current = { title: loadedNote.title, content: loadedNote.content };
                        onLoadComplete?.(loadedNote);
                    }
                })
                .finally(() => setIsLoading(false));
        }
    }, [noteId, onLoadComplete]);

    // Cleanup timeout on unmount and trigger final save
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

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
            console.error('[CourseNotePanelEditor] Error saving note:', error);
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

    // Save status display
    const renderSaveStatus = () => {
        switch (saveStatus) {
            case 'saving':
                return (
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <Loader2 size={12} className="animate-spin" />
                        <span>Saving...</span>
                    </div>
                );
            case 'saved':
                return (
                    <div className="flex items-center gap-2 text-green-400 text-xs">
                        <Check size={12} />
                        <span>Saved</span>
                    </div>
                );
            case 'error':
                return (
                    <div className="text-red-400 text-xs">
                        <span>Error saving</span>
                    </div>
                );
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-[#9A9724]" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Save status */}
            <div className="h-6 flex items-center px-1 mb-2">
                {renderSaveStatus()}
            </div>

            {/* Title Input */}
            <div className="mb-4">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Untitled Note"
                    autoFocus
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white placeholder-slate-600 focus:outline-none focus:border-[#9A9724]/50 transition-all text-base"
                />
            </div>

            {/* WYSIWYG Markdown Editor */}
            <div className="flex-1 min-h-0">
                <MarkdownEditor
                    value={content}
                    onChange={handleContentChange}
                    placeholder="Start writing your note..."
                />
            </div>

            {/* Note metadata footer */}
            {note && (
                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 mt-3 border-t border-white/10">
                    <span>
                        Updated: {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                    <span>
                        Created: {new Date(note.created_at).toLocaleDateString()}
                    </span>
                </div>
            )}
        </div>
    );
};

export default CourseNotePanelEditor;
