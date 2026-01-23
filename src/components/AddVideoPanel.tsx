'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Video, X, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import MuxUploader from '@mux/mux-uploader-react';
import GlobalTopPanel from './GlobalTopPanel';
import { UserContextItem } from '@/types';
import {
    createVideoResource,
    finalizeVideoUpload,
    updateVideoResource,
} from '@/app/actions/videoResources';

interface AddVideoPanelProps {
    isOpen: boolean;
    onClose: () => void;
    collectionId?: string;
    itemToEdit?: UserContextItem | null;
    onSaveSuccess?: () => void;
    // Custom handlers for Expert Resources
    customCreateHandler?: (title: string, description?: string) => Promise<{ success: boolean; id?: string; uploadUrl?: string; uploadId?: string; error?: string }>;
    customFinalizeHandler?: (itemId: string, uploadId: string) => Promise<{ success: boolean; playbackId?: string; error?: string }>;
    customUpdateHandler?: (id: string, updates: { title?: string; description?: string }) => Promise<{ success: boolean; error?: string }>;
}

export default function AddVideoPanel({
    isOpen,
    onClose,
    collectionId,
    itemToEdit,
    onSaveSuccess,
    customCreateHandler,
    customFinalizeHandler,
    customUpdateHandler,
}: AddVideoPanelProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [uploadUrl, setUploadUrl] = useState<string | null>(null);
    const [uploadId, setUploadId] = useState<string | null>(null);
    const [itemId, setItemId] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'preparing' | 'uploading' | 'processing' | 'ready' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const isEditing = !!itemToEdit;

    // Initialize from itemToEdit
    useEffect(() => {
        if (itemToEdit) {
            setTitle(itemToEdit.title);
            setDescription((itemToEdit.content as any)?.description || '');
            setStatus('ready');
            setItemId(itemToEdit.id);
        } else if (isOpen) {
            // Reset for new video
            setTitle('');
            setDescription('');
            setUploadUrl(null);
            setUploadId(null);
            setItemId(null);
            setStatus('idle');
            setError(null);
        }
    }, [itemToEdit, isOpen]);

    // Step 1: Create record and get upload URL when title is entered
    const handlePrepareUpload = async () => {
        if (!title.trim()) return;

        setStatus('preparing');
        setError(null);

        try {
            const createFn = customCreateHandler || (async (t: string, d?: string) => {
                return createVideoResource({ title: t, description: d, collectionId });
            });
            const result = await createFn(title.trim(), description.trim() || undefined);

            if (result.success && result.uploadUrl && result.uploadId && result.id) {
                setUploadUrl(result.uploadUrl);
                setUploadId(result.uploadId);
                setItemId(result.id);
                setStatus('uploading');
            } else {
                setError(result.error || 'Failed to prepare upload');
                setStatus('error');
            }
        } catch (err) {
            setError('Failed to prepare upload');
            setStatus('error');
        }
    };

    // Step 2: Handle upload completion from MuxUploader
    const handleUploadComplete = useCallback(async () => {
        if (!itemId || !uploadId) return;

        setStatus('processing');

        try {
            const finalizeFn = customFinalizeHandler || finalizeVideoUpload;
            const result = await finalizeFn(itemId, uploadId);

            if (result.success) {
                setStatus('ready');
                onSaveSuccess?.();
            } else {
                setError(result.error || 'Failed to process video');
                setStatus('error');
            }
        } catch (err) {
            setError('Failed to process video');
            setStatus('error');
        }
    }, [itemId, uploadId, customFinalizeHandler, onSaveSuccess]);

    // Handle save for edit mode (title/description changes)
    const handleSave = async () => {
        if (!itemId) return;

        try {
            const updateFn = customUpdateHandler || updateVideoResource;
            const result = await updateFn(itemId, { title: title.trim(), description: description.trim() || undefined });

            if (result.success) {
                onSaveSuccess?.();
                onClose();
            } else {
                setError(result.error || 'Failed to update video');
            }
        } catch (err) {
            setError('Failed to update video');
        }
    };

    const handleClose = () => {
        // Reset state
        setTitle('');
        setDescription('');
        setUploadUrl(null);
        setUploadId(null);
        setItemId(null);
        setStatus('idle');
        setError(null);
        onClose();
    };

    const renderTitle = () => (
        <>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Video size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">
                {isEditing ? 'Edit Video' : 'Add Video'}
            </h2>
        </>
    );

    const renderStatusBadge = () => {
        switch (status) {
            case 'preparing':
                return <span className="flex items-center gap-2 text-blue-400"><Loader2 className="animate-spin" size={16} /> Preparing...</span>;
            case 'uploading':
                return <span className="flex items-center gap-2 text-blue-400"><Upload size={16} /> Ready to upload</span>;
            case 'processing':
                return <span className="flex items-center gap-2 text-amber-400"><Loader2 className="animate-spin" size={16} /> Processing video...</span>;
            case 'ready':
                return <span className="flex items-center gap-2 text-green-400"><CheckCircle size={16} /> Ready</span>;
            case 'error':
                return <span className="flex items-center gap-2 text-red-400"><AlertCircle size={16} /> Error</span>;
            default:
                return null;
        }
    };

    return (
        <GlobalTopPanel
            isOpen={isOpen}
            onClose={handleClose}
            title={renderTitle()}
        >
            <div className="max-w-2xl mx-auto space-y-6 pb-32 pt-[30px]">
                {/* Title Input */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter video title..."
                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                        disabled={status === 'uploading' || status === 'processing'}
                    />
                </div>

                {/* Description Input */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Description (optional)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter video description..."
                        rows={3}
                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 resize-none"
                        disabled={status === 'uploading' || status === 'processing'}
                    />
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                    {renderStatusBadge()}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                        {error}
                    </div>
                )}

                {/* Upload Section - only for new videos */}
                {!isEditing && (
                    <div className="space-y-4">
                        {status === 'idle' && (
                            <button
                                onClick={handlePrepareUpload}
                                disabled={!title.trim()}
                                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-400 hover:to-violet-400 transition-all"
                            >
                                Continue to Upload
                            </button>
                        )}

                        {(status === 'uploading' || status === 'processing') && uploadUrl && (
                            <div className="bg-black/30 border border-white/10 rounded-xl p-6">
                                <MuxUploader
                                    endpoint={uploadUrl}
                                    onSuccess={handleUploadComplete}
                                    className="mux-uploader-custom"
                                />
                                <style jsx global>{`
                                    mux-uploader {
                                        --uploader-font-family: inherit;
                                        --uploader-background-color: rgba(255, 255, 255, 0.05);
                                        --uploader-border: 1px dashed rgba(255, 255, 255, 0.1);
                                        --uploader-border-radius: 0.75rem;
                                        --button-background-color: #A855F7;
                                        --button-border-radius: 9999px;
                                        --button-color: #fff;
                                    }
                                `}</style>
                            </div>
                        )}
                    </div>
                )}

                {/* Save Button - for editing */}
                {isEditing && status === 'ready' && (
                    <button
                        onClick={handleSave}
                        disabled={!title.trim()}
                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-400 hover:to-violet-400 transition-all"
                    >
                        Save Changes
                    </button>
                )}

                {/* Done Button - after successful upload */}
                {!isEditing && status === 'ready' && (
                    <button
                        onClick={handleClose}
                        className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-400 hover:to-emerald-400 transition-all"
                    >
                        Done
                    </button>
                )}
            </div>
        </GlobalTopPanel>
    );
}
