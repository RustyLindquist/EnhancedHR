'use client';

import React, { useState, useCallback } from 'react';
import { ArrowLeft, Video, Layers, BookOpen, Play, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UniversalCard from '@/components/cards/UniversalCard';
import AddVideoPanel from '@/components/AddVideoPanel';
import VideoViewPanel from '@/components/VideoViewPanel';
import {
    createOrgVideoResource,
    finalizeOrgVideoUpload,
    updateOrgVideoResource,
    deleteOrgVideoResource,
} from '@/app/actions/orgVideoResources';

interface OrgCollection {
    id: string;
    label: string;
    color?: string;
    is_required?: boolean;
    due_date?: string;
}

interface CourseItem {
    id: number;
    title: string;
    status: string;
    cover_image_url?: string;
    added_at: string;
}

interface VideoItem {
    id: string;
    title: string;
    content: {
        muxAssetId?: string;
        muxPlaybackId?: string;
        status?: 'uploading' | 'processing' | 'ready' | 'error';
        duration?: number;
        description?: string;
    };
    created_at: string;
}

interface OrgCollectionDetailViewProps {
    collection: OrgCollection;
    courses: CourseItem[];
    videos: VideoItem[];
    isOrgAdmin: boolean;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function OrgCollectionDetailView({
    collection,
    courses,
    videos: initialVideos,
    isOrgAdmin,
}: OrgCollectionDetailViewProps) {
    const router = useRouter();
    const [videos, setVideos] = useState(initialVideos);
    const [isVideoPanelOpen, setIsVideoPanelOpen] = useState(false);
    const [editingVideoItem, setEditingVideoItem] = useState<any>(null);
    const [isVideoViewOpen, setIsVideoViewOpen] = useState(false);
    const [viewingVideoItem, setViewingVideoItem] = useState<any>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Video handlers for org collections
    const handleCreateOrgVideo = useCallback(async (title: string, description?: string) => {
        return createOrgVideoResource(collection.id, title, description);
    }, [collection.id]);

    const handleFinalizeOrgVideo = useCallback(async (itemId: string, uploadId: string) => {
        return finalizeOrgVideoUpload(itemId, uploadId);
    }, []);

    const handleUpdateOrgVideo = useCallback(async (id: string, updates: { title?: string; description?: string }) => {
        return updateOrgVideoResource(id, updates);
    }, []);

    const handleAddVideo = useCallback(() => {
        setEditingVideoItem(null);
        setIsVideoPanelOpen(true);
    }, []);

    const handleVideoClick = useCallback((video: VideoItem) => {
        if (isOrgAdmin) {
            // Admin can edit
            setEditingVideoItem({
                id: video.id,
                title: video.title,
                content: video.content,
            });
            setIsVideoPanelOpen(true);
        } else {
            // Non-admin views read-only
            setViewingVideoItem({
                id: video.id,
                title: video.title,
                content: video.content,
            });
            setIsVideoViewOpen(true);
        }
    }, [isOrgAdmin]);

    const handleDeleteVideo = useCallback(async (videoId: string) => {
        if (!confirm('Are you sure you want to delete this video?')) return;

        setDeletingId(videoId);
        const result = await deleteOrgVideoResource(videoId);
        setDeletingId(null);

        if (result.success) {
            setVideos(prev => prev.filter(v => v.id !== videoId));
            router.refresh();
        } else {
            alert(result.error || 'Failed to delete video');
        }
    }, [router]);

    const totalItems = courses.length + videos.length;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/org/collections"
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">{collection.label}</h1>
                        <p className="text-slate-400">
                            {totalItems} {totalItems === 1 ? 'item' : 'items'}
                            {collection.is_required && (
                                <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-blue-light/20 text-brand-blue-light border border-brand-blue-light/20">
                                    Required
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                {isOrgAdmin && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleAddVideo}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
                        >
                            <Video size={16} />
                            Add Video
                        </button>
                    </div>
                )}
            </div>

            {/* Content Sections */}
            {totalItems > 0 ? (
                <div className="space-y-10">
                    {/* Videos Section */}
                    {videos.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Video size={18} className="text-purple-400" />
                                Videos ({videos.length})
                            </h2>
                            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                {videos.map((video, index) => (
                                    <div
                                        key={video.id}
                                        className="animate-fade-in-up"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <UniversalCard
                                            type="VIDEO"
                                            title={video.title}
                                            description={video.content.description || ''}
                                            meta={formatDate(video.created_at)}
                                            videoPlaybackId={video.content.muxPlaybackId}
                                            videoStatus={video.content.status}
                                            onAction={() => handleVideoClick(video)}
                                            onRemove={isOrgAdmin ? () => handleDeleteVideo(video.id) : undefined}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Courses Section */}
                    {courses.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <BookOpen size={18} className="text-blue-400" />
                                Courses ({courses.length})
                            </h2>
                            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                {courses.map((course, index) => (
                                    <div
                                        key={course.id}
                                        className="animate-fade-in-up"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <UniversalCard
                                            type="COURSE"
                                            title={course.title}
                                            imageUrl={course.cover_image_url}
                                            meta={formatDate(course.added_at)}
                                            onAction={() => router.push(`/org-courses/${course.id}`)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                        <Layers size={28} className="text-slate-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">No Items Yet</h3>
                    <p className="text-slate-500 text-sm max-w-sm text-center mb-6">
                        This collection is empty. Add videos or courses to share with your team.
                    </p>
                    {isOrgAdmin && (
                        <button
                            onClick={handleAddVideo}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all bg-brand-blue-light text-brand-black hover:bg-white hover:scale-105 active:scale-95"
                        >
                            <Video size={16} />
                            Add First Video
                        </button>
                    )}
                </div>
            )}

            {/* Add/Edit Video Panel */}
            <AddVideoPanel
                isOpen={isVideoPanelOpen}
                onClose={() => {
                    setIsVideoPanelOpen(false);
                    setEditingVideoItem(null);
                }}
                itemToEdit={editingVideoItem}
                onSaveSuccess={() => {
                    router.refresh();
                }}
                customCreateHandler={handleCreateOrgVideo}
                customFinalizeHandler={handleFinalizeOrgVideo}
                customUpdateHandler={handleUpdateOrgVideo}
            />

            {/* Video View Panel (for non-admin users) */}
            <VideoViewPanel
                isOpen={isVideoViewOpen}
                onClose={() => {
                    setIsVideoViewOpen(false);
                    setViewingVideoItem(null);
                }}
                resource={viewingVideoItem}
            />
        </div>
    );
}
