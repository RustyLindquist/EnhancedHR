'use client';

import React, { useState, useCallback } from 'react';
import { Layers, Upload, StickyNote, Lightbulb, Video } from 'lucide-react';
import { UserContextItem, ContextItemType } from '@/types';
import TopContextPanel from '@/components/TopContextPanel';
import AddNotePanel from '@/components/AddNotePanel';
import VideoPanel from '@/components/VideoPanel';
import UniversalCard, { CardType } from '@/components/cards/UniversalCard';
import ResourceViewPanel from '@/components/ResourceViewPanel';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { useRouter } from 'next/navigation';
import { createExpertResource, updateExpertResource, deleteExpertResource } from '@/app/actions/expertResources';
import {
    createExpertVideoResource,
    finalizeExpertVideoUpload,
    updateExpertVideoResource,
    deleteExpertVideoResource,
} from '@/app/actions/videoResources';

interface ExpertResourcesCanvasProps {
    resources: UserContextItem[];
    isPlatformAdmin: boolean;
    collectionId: string;
    userId: string;
}

// Helper to get card type from resource
function getCardType(resource: UserContextItem): CardType {
    const isNote = (resource.content as any)?.isNote === true;
    if (isNote) return 'NOTE';
    if (resource.type === 'VIDEO') return 'VIDEO';
    if (resource.type === 'FILE') return 'CONTEXT';
    return 'CONTEXT';
}

// Helper to get content preview
function getContentPreview(resource: UserContextItem): string {
    if (resource.type === 'CUSTOM_CONTEXT' || resource.type === 'AI_INSIGHT') {
        const text = (resource.content as any).text || (resource.content as any).insight || '';
        return text.substring(0, 150);
    }
    if (resource.type === 'FILE') {
        return (resource.content as any).summary || (resource.content as any).fileName || 'Uploaded file';
    }
    return '';
}

// Helper to format date
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ExpertResourcesCanvas({
    resources: initialResources,
    isPlatformAdmin,
    collectionId,
    userId
}: ExpertResourcesCanvasProps) {
    const router = useRouter();
    const [resources, setResources] = useState(initialResources);
    const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
    const [isNotePanelOpen, setIsNotePanelOpen] = useState(false);
    const [isViewPanelOpen, setIsViewPanelOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState<UserContextItem | null>(null);
    const [addType, setAddType] = useState<'CUSTOM_CONTEXT' | 'FILE'>('CUSTOM_CONTEXT');
    // Video panel state - unified for view and edit
    const [isVideoPanelOpen, setIsVideoPanelOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<UserContextItem | null>(null);
    const [videoPanelMode, setVideoPanelMode] = useState<'view' | 'edit'>('view');
    // Delete confirmation modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<UserContextItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleAddNote = useCallback(() => {
        setSelectedResource(null);
        setIsNotePanelOpen(true);
    }, []);

    const handleAddResource = useCallback((type: 'CUSTOM_CONTEXT' | 'FILE') => {
        setAddType(type);
        setSelectedResource(null);
        setIsAddPanelOpen(true);
    }, []);

    const handleResourceClick = useCallback((resource: UserContextItem) => {
        setSelectedResource(resource);

        // Handle VIDEO type
        if (resource.type === 'VIDEO') {
            setSelectedVideo(resource);
            setVideoPanelMode('view');  // Always open in view mode, Edit button shown if canEdit
            setIsVideoPanelOpen(true);
            return;
        }

        if (isPlatformAdmin) {
            // Admins can edit - check if it's a note or context
            const isNote = (resource.content as any)?.isNote === true;
            if (isNote) {
                setIsNotePanelOpen(true);
            } else {
                setAddType(resource.type as 'CUSTOM_CONTEXT' | 'FILE');
                setIsAddPanelOpen(true);
            }
        } else {
            // Experts view only - open read-only view panel
            setIsViewPanelOpen(true);
        }
    }, [isPlatformAdmin]);

    const handleSaveSuccess = useCallback(() => {
        setIsAddPanelOpen(false);
        setIsNotePanelOpen(false);
        setSelectedResource(null);
        // Refresh the page to get updated resources
        router.refresh();
    }, [router]);

    // Custom handlers for expert resources (bypass RLS with admin client)
    const handleCreateExpertResource = useCallback(async (data: { type: ContextItemType; title: string; content: any }) => {
        return createExpertResource(data);
    }, []);

    const handleUpdateExpertResource = useCallback(async (id: string, updates: { title?: string; content?: any }) => {
        return updateExpertResource(id, updates);
    }, []);

    const handleDeleteClick = useCallback((resource: UserContextItem) => {
        setResourceToDelete(resource);
        setIsDeleteModalOpen(true);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!resourceToDelete) return;

        setIsDeleting(true);
        try {
            // Use video delete for VIDEO type, otherwise use regular delete
            const result = resourceToDelete.type === 'VIDEO'
                ? await deleteExpertVideoResource(resourceToDelete.id)
                : await deleteExpertResource(resourceToDelete.id);

            if (result.success) {
                // Update local state immediately for instant UI feedback
                setResources(prev => prev.filter(r => r.id !== resourceToDelete.id));
                setIsDeleteModalOpen(false);
                setResourceToDelete(null);
                // Also refresh to sync with server
                router.refresh();
            } else {
                alert(result.error || 'Failed to delete resource');
            }
        } finally {
            setIsDeleting(false);
        }
    }, [resourceToDelete, router]);

    const handleCancelDelete = useCallback(() => {
        setIsDeleteModalOpen(false);
        setResourceToDelete(null);
    }, []);

    const handleCreateExpertFile = useCallback(async (fileName: string, fileType: string, fileBuffer: ArrayBuffer) => {
        // Use API route with FormData to bypass Vercel's 4.5MB serverless payload limit
        const formData = new FormData();
        const blob = new Blob([fileBuffer], { type: fileType });
        const file = new File([blob], fileName, { type: fileType });
        formData.append('file', file);

        const response = await fetch('/api/upload/expert-resource', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error || 'Upload failed' };
        }

        return response.json();
    }, []);

    // Video handlers for Expert Resources
    const handleCreateExpertVideo = useCallback(async (title: string, description?: string, externalUrl?: string) => {
        return createExpertVideoResource(title, description, externalUrl);
    }, []);

    const handleFinalizeExpertVideo = useCallback(async (itemId: string, uploadId: string) => {
        return finalizeExpertVideoUpload(itemId, uploadId);
    }, []);

    const handleUpdateExpertVideo = useCallback(async (id: string, updates: { title?: string; description?: string; externalUrl?: string }) => {
        return updateExpertVideoResource(id, updates);
    }, []);

    const handleAddVideo = useCallback(() => {
        setSelectedVideo(null);
        setVideoPanelMode('edit');  // New video opens in edit mode
        setIsVideoPanelOpen(true);
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Admin Action Bar */}
            {isPlatformAdmin && (
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-400">
                            Add resources to help experts get started, as training, or to help them build courses.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleAddNote}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
                        >
                            <StickyNote size={16} />
                            Note
                        </button>
                        <button
                            onClick={() => handleAddResource('CUSTOM_CONTEXT')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
                        >
                            <Lightbulb size={16} />
                            Context
                        </button>
                        <button
                            onClick={() => handleAddResource('FILE')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
                        >
                            <Upload size={16} />
                            File
                        </button>
                        <button
                            onClick={handleAddVideo}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
                        >
                            <Video size={16} />
                            Video
                        </button>
                    </div>
                </div>
            )}

            {/* Resources Grid */}
            {resources.length > 0 ? (
                <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {resources.map((resource, index) => (
                        <div
                            key={resource.id}
                            className="animate-fade-in-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <UniversalCard
                                type={getCardType(resource)}
                                title={resource.title}
                                description={getContentPreview(resource)}
                                meta={formatDate(resource.created_at)}
                                contextSubtype={resource.type === 'FILE' ? 'FILE' : 'TEXT'}
                                fileUrl={resource.type === 'FILE' ? (resource.content as any).url : undefined}
                                fileName={resource.type === 'FILE' ? (resource.content as any).fileName : undefined}
                                videoPlaybackId={resource.type === 'VIDEO' ? (resource.content as any).muxPlaybackId : undefined}
                                videoExternalUrl={resource.type === 'VIDEO' ? (resource.content as any).externalUrl : undefined}
                                videoStatus={resource.type === 'VIDEO' ? (resource.content as any).status : undefined}
                                onAction={() => handleResourceClick(resource)}
                                onRemove={isPlatformAdmin ? () => handleDeleteClick(resource) : undefined}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 w-24 h-24 bg-brand-blue-light/20 blur-2xl rounded-full" />
                        <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-blue-light/30 to-brand-blue-light/10 border border-brand-blue-light/30 flex items-center justify-center">
                            <Layers size={40} className="text-brand-blue-light" />
                        </div>
                    </div>
                    <h3 className="text-white font-semibold text-xl mb-3">
                        Expert Resources
                    </h3>
                    <p className="text-slate-400 text-sm text-center max-w-md mb-6">
                        {isPlatformAdmin
                            ? "No resources yet. Add helpful materials for experts to reference while building their courses."
                            : "Resources for experts will appear here. Check back soon for training materials and helpful guides."}
                    </p>
                    {isPlatformAdmin && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleAddNote}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
                            >
                                <StickyNote size={16} />
                                Note
                            </button>
                            <button
                                onClick={() => handleAddResource('CUSTOM_CONTEXT')}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
                            >
                                <Lightbulb size={16} />
                                Context
                            </button>
                            <button
                                onClick={() => handleAddResource('FILE')}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
                            >
                                <Upload size={16} />
                                File
                            </button>
                            <button
                                onClick={handleAddVideo}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
                            >
                                <Video size={16} />
                                Video
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* About Section */}
            <div className="max-w-3xl mx-auto pt-12 pb-8">
                <div className="flex flex-col items-center justify-center text-center">
                    <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-2">
                        Expert Resource Library
                    </p>
                    <p className="text-slate-500 text-sm max-w-md leading-relaxed">
                        A curated collection of resources to help you succeed as a course creator on EnhancedHR.
                    </p>
                </div>
            </div>

            {/* Add/Edit Context Panel */}
            <TopContextPanel
                isOpen={isAddPanelOpen}
                onClose={() => {
                    setIsAddPanelOpen(false);
                    setSelectedResource(null);
                }}
                activeCollectionId={collectionId}
                itemToEdit={selectedResource}
                initialType={addType}
                userId={userId}
                onSaveSuccess={handleSaveSuccess}
                customCreateHandler={isPlatformAdmin ? handleCreateExpertResource : undefined}
                customUpdateHandler={isPlatformAdmin ? handleUpdateExpertResource : undefined}
                customFileCreateHandler={isPlatformAdmin ? handleCreateExpertFile : undefined}
            />

            {/* Add/Edit Note Panel */}
            <AddNotePanel
                isOpen={isNotePanelOpen}
                onClose={() => {
                    setIsNotePanelOpen(false);
                    setSelectedResource(null);
                }}
                collectionId={collectionId}
                itemToEdit={selectedResource}
                onSaveSuccess={handleSaveSuccess}
                customCreateHandler={isPlatformAdmin ? handleCreateExpertResource : undefined}
                customUpdateHandler={isPlatformAdmin ? handleUpdateExpertResource : undefined}
            />

            {/* Read-Only View Panel (for non-admin experts) */}
            <ResourceViewPanel
                isOpen={isViewPanelOpen}
                onClose={() => {
                    setIsViewPanelOpen(false);
                    setSelectedResource(null);
                }}
                resource={selectedResource}
            />

            {/* Unified Video Panel (view/edit) */}
            <VideoPanel
                isOpen={isVideoPanelOpen}
                onClose={() => {
                    setIsVideoPanelOpen(false);
                    setSelectedVideo(null);
                }}
                mode={videoPanelMode}
                video={selectedVideo}
                canEdit={isPlatformAdmin}
                onSaveSuccess={(video) => {
                    // Add new video to local state for instant UI feedback
                    if (video && !resources.some(r => r.id === video.id)) {
                        setResources(prev => [video, ...prev]);
                    } else if (video) {
                        // Update existing video in local state
                        setResources(prev => prev.map(r => r.id === video.id ? video : r));
                    }
                    // Also refresh to sync with server
                    router.refresh();
                }}
                customCreateHandler={handleCreateExpertVideo}
                customFinalizeHandler={handleFinalizeExpertVideo}
                customUpdateHandler={handleUpdateExpertVideo}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Delete Resource"
                itemTitle={resourceToDelete?.title || ''}
                description={
                    resourceToDelete?.type === 'VIDEO'
                        ? "This will permanently delete this video and remove it from Mux. This action cannot be undone."
                        : "This will permanently delete this resource. This action cannot be undone."
                }
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                confirmText={isDeleting ? "Deleting..." : "Delete"}
            />
        </div>
    );
}
