'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StickyNote, ChevronDown, Plus, ArrowLeft, HelpCircle, Loader2 } from 'lucide-react';
import { Note } from '../types';
import { getNotesAction, getNotesByCourseAction, createNoteAction, deleteNoteAction } from '../app/actions/notes';
import CourseNotePanelEditor from './CourseNotePanelEditor';
import UniversalCard from './cards/UniversalCard';

interface DragItem {
    type: 'NOTE';
    id: string;
    title: string;
}

interface AIPanelNotesTabProps {
    courseId: number;
    onOpenHelp: (topicId: string) => void;
    onAddToCollection?: (item: { type: 'NOTE'; id: string; title: string }) => void;
    onDragStart?: (item: DragItem) => void;
    onCreatingChange?: (isCreating: boolean) => void;
    createNoteTrigger?: number; // Increment this to trigger note creation from parent
}

type ViewMode = 'list' | 'editor';

const AIPanelNotesTab: React.FC<AIPanelNotesTabProps> = ({
    courseId,
    onOpenHelp,
    onAddToCollection,
    onDragStart,
    onCreatingChange,
    createNoteTrigger
}) => {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [courseNotes, setCourseNotes] = useState<Note[]>([]);
    const [allNotes, setAllNotes] = useState<Note[]>([]);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Delete confirmation state
    const [noteToDelete, setNoteToDelete] = useState<{ id: string; title: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Ref for dropdown click-outside detection
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Notify parent of isCreating changes
    useEffect(() => {
        onCreatingChange?.(isCreating);
    }, [isCreating, onCreatingChange]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!dropdownOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        // Add listener with a slight delay to avoid immediate close on the same click
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    // Fetch notes on mount
    const fetchNotes = useCallback(async () => {
        setIsLoading(true);
        try {
            const [courseData, allData] = await Promise.all([
                getNotesByCourseAction(courseId),
                getNotesAction()
            ]);
            setCourseNotes(courseData);
            setAllNotes(allData);
        } catch (error) {
            console.error('[AIPanelNotesTab] Error fetching notes:', error);
        } finally {
            setIsLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    // Create new note for this course
    const handleCreateNote = useCallback(async () => {
        if (isCreating) return;
        setIsCreating(true);
        try {
            const newNote = await createNoteAction({
                title: 'Untitled Note',
                content: '',
                course_id: courseId
            });
            if (newNote) {
                setSelectedNoteId(newNote.id);
                setViewMode('editor');
                // Refresh notes list
                fetchNotes();
            }
        } catch (error) {
            console.error('[AIPanelNotesTab] Error creating note:', error);
        } finally {
            setIsCreating(false);
        }
    }, [isCreating, courseId, fetchNotes]);

    // Trigger note creation when parent increments createNoteTrigger
    const lastTriggerRef = useRef(createNoteTrigger);
    useEffect(() => {
        if (createNoteTrigger !== undefined && createNoteTrigger !== lastTriggerRef.current && createNoteTrigger > 0) {
            handleCreateNote();
        }
        lastTriggerRef.current = createNoteTrigger;
    }, [createNoteTrigger, handleCreateNote]);

    // Open existing note in editor
    const handleOpenNote = (noteId: string) => {
        setSelectedNoteId(noteId);
        setViewMode('editor');
        setDropdownOpen(false);
    };

    // Go back to list view
    const handleBackToList = () => {
        setViewMode('list');
        setSelectedNoteId(null);
        // Refresh notes to show any updates
        fetchNotes();
    };

    // Handle save success - refresh notes
    const handleSaveSuccess = () => {
        fetchNotes();
    };

    // Initiate delete (show confirmation)
    const handleDeleteInitiate = (note: Note) => {
        setNoteToDelete({ id: note.id, title: note.title });
    };

    // Confirm delete
    const handleDeleteConfirm = async () => {
        if (!noteToDelete || isDeleting) return;
        setIsDeleting(true);
        try {
            const result = await deleteNoteAction(noteToDelete.id);
            if (result.success) {
                setCourseNotes(prev => prev.filter(n => n.id !== noteToDelete.id));
                setAllNotes(prev => prev.filter(n => n.id !== noteToDelete.id));
            }
        } catch (error) {
            console.error('[AIPanelNotesTab] Error deleting note:', error);
        } finally {
            setNoteToDelete(null);
            setIsDeleting(false);
        }
    };

    // Cancel delete
    const handleDeleteCancel = () => {
        setNoteToDelete(null);
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Render placeholder card (when no course notes exist)
    const renderPlaceholderCard = () => (
        <button
            onClick={handleCreateNote}
            disabled={isCreating}
            className="w-full text-left rounded-lg overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg opacity-60 hover:opacity-100 border-2 border-dashed border-[#9A9724]/50"
            style={{
                boxShadow: '0 0 15px rgba(154, 151, 36, 0.1)'
            }}
        >
            {/* Header */}
            <div className="bg-[#9A9724]/40 px-3 py-2 flex items-center gap-2">
                <StickyNote size={14} className="text-white/60" />
                <span className="text-white/70 text-sm font-medium">
                    {isCreating ? 'Creating...' : 'Course Note'}
                </span>
                <span className="text-white/40 text-xs ml-auto">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
            </div>
            {/* Body */}
            <div className="bg-[#9A9724]/30 px-3 py-3 flex items-center justify-center">
                <span className="text-white/50 text-xs flex items-center gap-2">
                    {isCreating ? (
                        <Loader2 size={12} className="animate-spin" />
                    ) : (
                        <>
                            <Plus size={12} />
                            Click to create your first note
                        </>
                    )}
                </span>
            </div>
        </button>
    );

    // Render list view
    const renderListView = () => (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Notes List - overflow-x-hidden prevents horizontal scrollbar from scaled cards */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 pr-1">
                {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 size={24} className="animate-spin text-[#9A9724]" />
                    </div>
                ) : (
                    <>
                        {courseNotes.map((note) => (
                            <div key={note.id} className="transform scale-[0.85] origin-top-left" style={{ width: 'calc(100% / 0.85)' }}>
                                <UniversalCard
                                    type="NOTE"
                                    title={note.title || 'Untitled Note'}
                                    description={note.content?.slice(0, 100) || 'No content'}
                                    meta={formatDate(note.updated_at)}
                                    onAction={() => handleOpenNote(note.id)}
                                    onRemove={() => handleDeleteInitiate(note)}
                                    onAdd={onAddToCollection ? () => onAddToCollection({ type: 'NOTE', id: note.id, title: note.title }) : undefined}
                                    draggable={!!onDragStart}
                                    onDragStart={onDragStart ? () => onDragStart({ type: 'NOTE', id: note.id, title: note.title }) : undefined}
                                />
                            </div>
                        ))}
                        {courseNotes.length === 0 && renderPlaceholderCard()}
                    </>
                )}
            </div>

            {/* Learn More Footer - matches CollectionSurface/AIPanel footer height (h-28) */}
            <div className="h-28 flex-shrink-0 -mx-6 -mb-6 border-t border-white/10 flex items-center justify-center bg-gradient-to-t from-black/20 to-transparent">
                <button
                    onClick={() => onOpenHelp('notes')}
                    className="flex items-center gap-2 text-slate-400 hover:text-[#78C0F0] transition-colors text-sm"
                >
                    <HelpCircle size={16} />
                    <span>Learn more about notes</span>
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {noteToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-slate-900 border border-white/10 rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
                        <h3 className="text-white font-bold mb-2">Delete Note?</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Are you sure you want to delete "{noteToDelete.title}"? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleDeleteCancel}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Render editor view
    const renderEditorView = () => (
        <div className="h-full">
            {selectedNoteId && (
                <CourseNotePanelEditor
                    noteId={selectedNoteId}
                    onSaveSuccess={handleSaveSuccess}
                />
            )}
        </div>
    );

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header - All Notes dropdown only (list view) or Back button (editor view) */}
            <div className={`flex items-center gap-3 flex-shrink-0 ${viewMode === 'editor' ? 'mb-2' : 'mb-4'}`}>
                {viewMode === 'editor' ? (
                    // Back button when in editor mode
                    <button
                        onClick={handleBackToList}
                        className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={16} className="text-slate-400" />
                    </button>
                ) : (
                    // List mode: All Notes dropdown only (+ button is in AIPanel header)
                    <div ref={dropdownRef} className="relative flex-1">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="w-full flex items-center justify-between bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-300 hover:border-white/20 transition-colors"
                        >
                            <span className="text-sm">All Notes</span>
                            <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-white/10 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                {allNotes.length === 0 ? (
                                    <div className="px-3 py-2 text-slate-500 text-sm">No notes yet</div>
                                ) : (
                                    allNotes.map((note) => (
                                        <button
                                            key={note.id}
                                            onClick={() => handleOpenNote(note.id)}
                                            className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors flex items-center gap-2"
                                        >
                                            <StickyNote size={14} className="text-[#9A9724]" />
                                            <span className="text-sm text-white truncate flex-1">
                                                {note.title || 'Untitled Note'}
                                            </span>
                                            {note.course_title && (
                                                <span className="text-xs text-slate-500 truncate max-w-[100px]">
                                                    {note.course_title}
                                                </span>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0">
                {viewMode === 'list' ? renderListView() : renderEditorView()}
            </div>
        </div>
    );
};

export default AIPanelNotesTab;
