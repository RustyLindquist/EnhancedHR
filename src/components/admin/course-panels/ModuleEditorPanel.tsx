'use client';

import React, { useState, useTransition, useCallback } from 'react';
import { Layers, Trash2, Loader2, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { updateModule, deleteModule, createModule } from '@/app/actions/course-builder';

interface ModuleEditorPanelProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: number;
    moduleId: string | null;
    moduleTitle?: string;
    moduleOrder?: number;
    isNewModule?: boolean;
    onSave: () => void;
    onDelete?: () => void;
}

export default function ModuleEditorPanel({
    isOpen,
    onClose,
    courseId,
    moduleId,
    moduleTitle = '',
    moduleOrder = 0,
    isNewModule = false,
    onSave,
    onDelete
}: ModuleEditorPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [title, setTitle] = useState(moduleTitle);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Reset form when panel opens
    React.useEffect(() => {
        if (isOpen) {
            setTitle(moduleTitle);
            setError(null);
            setShowDeleteConfirm(false);
        }
    }, [isOpen, moduleTitle]);

    const handleSave = useCallback(() => {
        if (!title.trim()) {
            setError('Module title is required');
            return;
        }

        setError(null);
        startTransition(async () => {
            let result;
            if (isNewModule) {
                result = await createModule(courseId, title.trim());
            } else if (moduleId) {
                result = await updateModule(moduleId, { title: title.trim() });
            } else {
                setError('Module ID is missing');
                return;
            }

            if (result.success) {
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    onSave();
                }, 1000);
            } else {
                setError(result.error || 'Failed to save module');
            }
        });
    }, [courseId, moduleId, title, isNewModule, onSave]);

    const handleDelete = useCallback(() => {
        if (!moduleId) return;

        setError(null);
        startTransition(async () => {
            const result = await deleteModule(moduleId);
            if (result.success) {
                onDelete?.();
                onClose();
            } else {
                setError(result.error || 'Failed to delete module');
            }
        });
    }, [moduleId, onDelete, onClose]);

    const headerActions = (
        <div className="flex items-center gap-4">
            {showSuccess && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle size={16} />
                    <span>Saved!</span>
                </div>
            )}
            <button
                onClick={handleSave}
                disabled={isPending || !title.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-brand-orange text-white rounded-lg text-sm font-bold hover:bg-brand-orange/80 transition-colors disabled:opacity-50"
            >
                {isPending ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                    </>
                ) : isNewModule ? (
                    <>
                        <Plus size={16} />
                        Create Module
                    </>
                ) : (
                    'Save Changes'
                )}
            </button>
        </div>
    );

    return (
        <DropdownPanel
            isOpen={isOpen}
            onClose={onClose}
            title={isNewModule ? 'Add New Module' : 'Edit Module'}
            icon={Layers}
            iconColor="text-brand-blue-light"
            headerActions={headerActions}
        >
            <div className="max-w-2xl space-y-6">
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Module Title */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Module Title *
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Introduction to Strategic HR"
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-medium placeholder-slate-600 outline-none focus:border-brand-blue-light/50"
                        autoFocus
                    />
                </div>

                {/* Module Order Info */}
                {!isNewModule && (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="text-center">
                            <span className="text-2xl font-bold text-brand-blue-light">{moduleOrder + 1}</span>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Position</p>
                        </div>
                        <p className="text-sm text-slate-500">
                            Module ordering can be changed by dragging modules in the course view.
                        </p>
                    </div>
                )}

                {/* Delete Section */}
                {!isNewModule && moduleId && (
                    <div className="pt-6 border-t border-white/5">
                        {!showDeleteConfirm ? (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                                Delete Module
                            </button>
                        ) : (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-red-400 mb-1">Delete this module?</h4>
                                        <p className="text-sm text-slate-400 mb-4">
                                            This will permanently delete the module and all lessons within it. This action cannot be undone.
                                        </p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleDelete}
                                                disabled={isPending}
                                                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                                            >
                                                {isPending ? 'Deleting...' : 'Yes, Delete'}
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DropdownPanel>
    );
}
