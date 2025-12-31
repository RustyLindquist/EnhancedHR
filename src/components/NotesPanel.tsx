'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, StickyNote, Plus, ArrowLeft, HelpCircle, Loader2, ChevronDown } from 'lucide-react';
import { Note } from '../types';
import { getGeneralNotesAction, getNotesAction, createNoteAction, deleteNoteAction } from '../app/actions/notes';
import CourseNotePanelEditor from './CourseNotePanelEditor';
import UniversalCard from './cards/UniversalCard';

interface NotesPanelProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onAddNoteToCollection?: (item: { type: 'NOTE'; id: string; title: string }) => void;
    onNoteDragStart?: (item: { type: 'NOTE'; id: string; title: string }) => void;
    onOpenHelp?: (topicId: string) => void;
}

type ViewMode = 'list' | 'editor';

const NotesPanel: React.FC<NotesPanelProps> = ({
    isOpen,
    setIsOpen,
    onAddNoteToCollection,
    onNoteDragStart,
    onOpenHelp
}) => {
    // Panel resize state
    const [width, setWidth] = useState(384);
    const [isDragging, setIsDragging] = useState(false);
    const [isHandleHovered, setIsHandleHovered] = useState(false);

    // Notes state
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [notes, setNotes] = useState<Note[]>([]);  // General notes (tool context - no course_id)
    const [allNotes, setAllNotes] = useState<Note[]>([]);  // All notes for dropdown navigation
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [currentNoteTitle, setCurrentNoteTitle] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Delete confirmation state
    const [noteToDelete, setNoteToDelete] = useState<{ id: string; title: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Ref for dropdown click-outside detection
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Handle panel resizing
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const newWidth = document.body.clientWidth - e.clientX;
            if (newWidth >= 300 && newWidth <= 800) {
                setWidth(newWidth);
            }
        };
        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.cursor = 'default';
        };
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isDragging]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!dropdownOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    // Fetch general notes (not associated with any course) for tool context
    const fetchNotes = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch both: general notes for the list, all notes for dropdown navigation
            const [generalData, allData] = await Promise.all([
                getGeneralNotesAction(),  // Notes with course_id IS NULL
                getNotesAction()           // All notes for dropdown
            ]);
            setNotes(generalData);
            setAllNotes(allData);
        } catch (error) {
            console.error('[NotesPanel] Error fetching notes:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    // Create new note (not associated with any course)
    const handleCreateNote = useCallback(async () => {
        if (isCreating) return;
        setIsCreating(true);
        try {
            const newNote = await createNoteAction({
                title: 'Untitled Note',
                content: '',
                course_id: undefined // Not associated with any course
            });
            if (newNote) {
                setSelectedNoteId(newNote.id);
                setCurrentNoteTitle(newNote.title);
                setViewMode('editor');
                fetchNotes();
            }
        } catch (error) {
            console.error('[NotesPanel] Error creating note:', error);
        } finally {
            setIsCreating(false);
        }
    }, [isCreating, fetchNotes]);

    // Open existing note in editor
    const handleOpenNote = (note: Note) => {
        setSelectedNoteId(note.id);
        setCurrentNoteTitle(note.title);
        setViewMode('editor');
        setDropdownOpen(false);
    };

    // Go back to list view
    const handleBackToList = () => {
        setViewMode('list');
        setSelectedNoteId(null);
        fetchNotes();
    };

    // Handle save success
    const handleSaveSuccess = () => {
        fetchNotes();
    };

    // Initiate delete
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
                setNotes(prev => prev.filter(n => n.id !== noteToDelete.id));
            }
        } catch (error) {
            console.error('[NotesPanel] Error deleting note:', error);
        } finally {
            setNoteToDelete(null);
            setIsDeleting(false);
        }
    };

    // Cancel delete
    const handleDeleteCancel = () => {
        setNoteToDelete(null);
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Render placeholder card (matches AIPanelNotesTab style)
    const renderPlaceholderCard = () => (
        <button
            onClick={handleCreateNote}
            disabled={isCreating}
            className="w-full text-left rounded-lg overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg opacity-60 hover:opacity-100 border-2 border-dashed border-[#9A9724]/50"
            style={{ boxShadow: '0 0 15px rgba(154, 151, 36, 0.1)' }}
        >
            {/* Header */}
            <div className="bg-[#9A9724]/40 px-3 py-2 flex items-center gap-2">
                <StickyNote size={14} className="text-white/60" />
                <span className="text-white/70 text-sm font-medium">
                    {isCreating ? 'Creating...' : 'New Note'}
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

    // Handle opening help - uses prop callback if provided
    const handleOpenHelp = (topic: string) => {
        if (onOpenHelp) {
            onOpenHelp(topic);
        }
    };

    // Render list view
    const renderListView = () => (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Notes List - padding for hover effects, overflow-x-clip to prevent scrollbar while allowing visual overflow */}
            <div className="flex-1 overflow-y-auto overflow-x-clip space-y-3 pl-2 pr-1 py-2">
                {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 size={24} className="animate-spin text-[#9A9724]" />
                    </div>
                ) : (
                    <>
                        {notes.map((note) => (
                            <div key={note.id} className="relative z-0 hover:z-10">
                                <UniversalCard
                                    type="NOTE"
                                    title={note.title || 'Untitled Note'}
                                    description={note.content?.slice(0, 100) || 'No content'}
                                    meta={formatDate(note.updated_at)}
                                    onAction={() => handleOpenNote(note)}
                                    onRemove={() => handleDeleteInitiate(note)}
                                    onAdd={onAddNoteToCollection ? () => onAddNoteToCollection({ type: 'NOTE', id: note.id, title: note.title }) : undefined}
                                    draggable={!!onNoteDragStart}
                                    onDragStart={onNoteDragStart ? () => onNoteDragStart({ type: 'NOTE', id: note.id, title: note.title }) : undefined}
                                />
                            </div>
                        ))}
                        {notes.length === 0 && renderPlaceholderCard()}
                    </>
                )}
            </div>

            {/* Learn More Footer - matches CollectionSurface/AIPanel footer height (h-28) */}
            <div className="h-28 flex-shrink-0 -mx-6 -mb-6 border-t border-white/10 flex items-center justify-center bg-gradient-to-t from-black/20 to-transparent">
                <button
                    onClick={() => handleOpenHelp('notes')}
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
                    title={currentNoteTitle}
                    onTitleChange={setCurrentNoteTitle}
                    onSaveSuccess={handleSaveSuccess}
                />
            )}
        </div>
    );

    return (
        <div
            className={`
                flex-shrink-0
                bg-transparent
                border-l border-white/10
                flex flex-col z-[90] h-full
                relative
                ${!isDragging ? 'transition-all duration-300 ease-in-out' : ''}
            `}
            style={{ width: isOpen ? width : 64 }}
        >
            {/* Vertical Beam Effect - 1px wide, slow expansion */}
            <div
                className={`
                    absolute -left-[1px] top-0 bottom-0 w-px bg-[#9A9724]
                    shadow-[0_0_15px_rgba(154,151,36,0.8)] z-40 pointer-events-none
                    transition-transform duration-[1500ms] ease-out origin-center
                    ${isHandleHovered ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}
                `}
            ></div>

            {/* Resize Handle - Only visible when open */}
            {isOpen && (
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-50 group cursor-col-resize p-4"
                    onMouseDown={() => setIsDragging(true)}
                    onMouseEnter={() => setIsHandleHovered(true)}
                    onMouseLeave={() => setIsHandleHovered(false)}
                >
                    {/* Note Color Handle: #9A9724 (Yellow/Gold) */}
                    <div className="w-3 h-16 bg-[#7A7720] border border-white/20 rounded-full flex flex-col items-center justify-center gap-1.5 shadow-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(154,151,36,0.8)] hover:bg-[#9A9724]">
                        <div className="w-0.5 h-0.5 rounded-full bg-brand-black/60"></div>
                        <div className="w-0.5 h-0.5 rounded-full bg-brand-black/60"></div>
                        <div className="w-0.5 h-0.5 rounded-full bg-brand-black/60"></div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={`h-24 flex-shrink-0 flex items-center ${isOpen ? 'justify-between pl-10 pr-6' : 'justify-center'} border-b border-white/5 bg-white/5 backdrop-blur-md relative`}>
                {/* Toggle Button - Placed on border */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute -left-3 top-9 bg-white/10 border border-white/10 rounded-full p-1 text-white/40 hover:bg-[#9A9724] hover:border-white/20 hover:text-white hover:shadow-[0_0_10px_rgba(154,151,36,0.5)] transition-all shadow-lg z-50 backdrop-blur-md"
                >
                    {isOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {isOpen && (
                    <div className="flex items-center overflow-hidden w-full justify-between">
                        {/* Title */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#9A9724]/20 border border-[#9A9724]/30 flex items-center justify-center">
                                <StickyNote size={16} className="text-[#9A9724]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm tracking-widest uppercase text-[#9A9724] drop-shadow-[0_0_5px_rgba(154,151,36,0.5)]">
                                    Notes
                                </span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                    {notes.length} note{notes.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        {/* Create Note Button */}
                        <button
                            onClick={handleCreateNote}
                            disabled={isCreating}
                            className="group flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 active:scale-95"
                            title="Create a new note"
                        >
                            {isCreating ? (
                                <Loader2 size={16} className="text-slate-400 animate-spin" />
                            ) : (
                                <Plus size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-b from-transparent to-black/20">
                {isOpen && (
                    <div className="flex-1 px-6 pt-4 pb-6 overflow-hidden flex flex-col">
                        {/* Header - Back button or dropdown based on view */}
                        <div className={`flex items-center gap-2 flex-shrink-0 ${viewMode === 'editor' ? 'mb-2' : 'mb-4'}`}>
                            {viewMode === 'editor' ? (
                                <>
                                    <button
                                        onClick={handleBackToList}
                                        className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex-shrink-0"
                                    >
                                        <ArrowLeft size={16} className="text-slate-400" />
                                    </button>
                                    <input
                                        type="text"
                                        value={currentNoteTitle}
                                        onChange={(e) => setCurrentNoteTitle(e.target.value)}
                                        placeholder="Untitled Note"
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#9A9724]/50 transition-all text-sm"
                                    />
                                </>
                            ) : (
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
                                                        onClick={() => handleOpenNote(note)}
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
                )}
            </div>
        </div>
    );
};

export default NotesPanel;
