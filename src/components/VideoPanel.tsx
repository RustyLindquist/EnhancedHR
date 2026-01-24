'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Video, Calendar, Clock, Loader2, Upload, Link as LinkIcon, CheckCircle, AlertCircle, Pencil, RefreshCw } from 'lucide-react';
import MuxPlayer from '@mux/mux-player-react';
import MuxUploader from '@mux/mux-uploader-react';
import GlobalTopPanel from './GlobalTopPanel';
import { UserContextItem } from '@/types';
import {
    createVideoResource,
    finalizeVideoUpload,
    updateVideoResource,
    regenerateTranscriptForVideo,
} from '@/app/actions/videoResources';

type VideoSourceType = 'upload' | 'url';

interface VideoContent {
    muxAssetId?: string;
    muxPlaybackId?: string;
    muxUploadId?: string;
    externalUrl?: string;
    externalPlatform?: string;
    status?: 'uploading' | 'processing' | 'ready' | 'error';
    duration?: number;
    description?: string;
    // Transcript fields
    transcriptStatus?: 'pending' | 'generating' | 'ready' | 'failed';
    transcript?: string;
    transcriptError?: string;
    transcriptGeneratedAt?: string;
}

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Extract Vimeo video ID
function extractVimeoId(url: string): string | null {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
}

// Get embed URL for external video
function getEmbedUrl(url: string, platform: string): string | null {
    if (platform === 'youtube') {
        const videoId = extractYouTubeId(url);
        return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : null;
    }
    if (platform === 'vimeo') {
        const videoId = extractVimeoId(url);
        return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
    return null;
}

interface VideoPanelProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'view' | 'edit';
    video?: UserContextItem | null;
    canEdit?: boolean;
    collectionId?: string;
    onSaveSuccess?: () => void;
    // Custom handlers for different contexts (Expert Resources, Org Collections)
    customCreateHandler?: (title: string, description?: string, externalUrl?: string) => Promise<{
        success: boolean;
        id?: string;
        uploadUrl?: string;
        uploadId?: string;
        error?: string
    }>;
    customFinalizeHandler?: (itemId: string, uploadId: string) => Promise<{
        success: boolean;
        playbackId?: string;
        error?: string
    }>;
    customUpdateHandler?: (id: string, updates: { title?: string; description?: string; externalUrl?: string }) => Promise<{
        success: boolean;
        error?: string
    }>;
}

// Detect video platform from URL
function detectVideoPlatform(url: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('wistia.com') || url.includes('fast.wistia.net')) return 'wistia';
    return 'other';
}

// Validate video URL
function isValidVideoUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

// Format duration
function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function VideoPanel({
    isOpen,
    onClose,
    mode: initialMode = 'view',
    video,
    canEdit = false,
    collectionId,
    onSaveSuccess,
    customCreateHandler,
    customFinalizeHandler,
    customUpdateHandler,
}: VideoPanelProps) {
    // Mode state
    const [currentMode, setCurrentMode] = useState<'view' | 'edit'>(initialMode);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [videoSource, setVideoSource] = useState<VideoSourceType>('upload');
    const [externalUrl, setExternalUrl] = useState('');

    // Upload state
    const [uploadUrl, setUploadUrl] = useState<string | null>(null);
    const [uploadId, setUploadId] = useState<string | null>(null);
    const [itemId, setItemId] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'preparing' | 'uploading' | 'processing' | 'ready' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isRegeneratingTranscript, setIsRegeneratingTranscript] = useState(false);
    // Track newly created video for switching to view mode after save
    const [savedVideo, setSavedVideo] = useState<UserContextItem | null>(null);

    const isNewVideo = !video && !savedVideo;
    // Use savedVideo (newly created/updated) or original video prop
    const displayVideo = savedVideo || video;
    const videoContent = displayVideo?.content as VideoContent | undefined;

    // Initialize state from video prop
    useEffect(() => {
        if (video) {
            setTitle(video.title);
            setDescription(videoContent?.description || '');
            setItemId(video.id);

            // Determine video source type
            if (videoContent?.externalUrl) {
                setVideoSource('url');
                setExternalUrl(videoContent.externalUrl);
            } else {
                setVideoSource('upload');
            }

            setUploadStatus(videoContent?.status || 'ready');
        } else if (isOpen) {
            // Reset for new video
            setTitle('');
            setDescription('');
            setVideoSource('upload');
            setExternalUrl('');
            setUploadUrl(null);
            setUploadId(null);
            setItemId(null);
            setUploadStatus('idle');
            setError(null);
        }

        // Set initial mode
        setCurrentMode(video ? initialMode : 'edit');
    }, [video, isOpen, initialMode, videoContent]);

    // Handle create with Mux upload
    const handlePrepareUpload = async () => {
        if (!title.trim()) return;

        setUploadStatus('preparing');
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
                setUploadStatus('uploading');
            } else {
                setError(result.error || 'Failed to prepare upload');
                setUploadStatus('error');
            }
        } catch (err) {
            setError('Failed to prepare upload');
            setUploadStatus('error');
        }
    };

    // Handle Mux upload completion
    const handleUploadComplete = useCallback(async () => {
        if (!itemId || !uploadId) return;

        setUploadStatus('processing');

        try {
            const finalizeFn = customFinalizeHandler || finalizeVideoUpload;
            const result = await finalizeFn(itemId, uploadId);

            if (result.success && result.playbackId) {
                setUploadStatus('ready');

                // Create a video object to display in view mode (same as URL flow)
                const newVideo: UserContextItem = {
                    id: itemId,
                    user_id: '', // Not needed for display
                    collection_id: collectionId || null,
                    type: 'VIDEO',
                    title: title.trim(),
                    content: {
                        muxPlaybackId: result.playbackId,
                        status: 'ready',
                        description: description.trim() || null
                    },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                setSavedVideo(newVideo);
                setCurrentMode('view');
                onSaveSuccess?.();
            } else {
                setError(result.error || 'Failed to process video');
                setUploadStatus('error');
            }
        } catch (err) {
            setError('Failed to process video');
            setUploadStatus('error');
        }
    }, [itemId, uploadId, customFinalizeHandler, onSaveSuccess, collectionId, title, description]);

    // Handle save (for URL-based videos or editing existing)
    const handleSave = async () => {
        if (!title.trim()) return;

        setIsSaving(true);
        setError(null);

        try {
            if (isNewVideo && videoSource === 'url') {
                // Create new video with external URL
                if (!externalUrl.trim() || !isValidVideoUrl(externalUrl.trim())) {
                    setError('Please enter a valid video URL');
                    setIsSaving(false);
                    return;
                }

                const createFn = customCreateHandler || (async (t: string, d?: string, url?: string) => {
                    return createVideoResource({ title: t, description: d, collectionId, externalUrl: url });
                });
                const result = await createFn(title.trim(), description.trim() || undefined, externalUrl.trim());

                if (result.success && result.id) {
                    // Create a video object to display in view mode
                    const newVideo: UserContextItem = {
                        id: result.id,
                        user_id: '', // Not needed for display
                        collection_id: collectionId || null,
                        type: 'VIDEO',
                        title: title.trim(),
                        content: {
                            externalUrl: externalUrl.trim(),
                            externalPlatform: detectVideoPlatform(externalUrl.trim()),
                            status: 'ready',
                            description: description.trim() || null
                        },
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    setSavedVideo(newVideo);
                    setItemId(result.id);
                    setCurrentMode('view');
                    onSaveSuccess?.();
                } else {
                    setError(result.error || 'Failed to create video');
                }
            } else if (itemId) {
                // Update existing video
                const updateFn = customUpdateHandler || updateVideoResource;
                const updates: { title?: string; description?: string; externalUrl?: string } = {
                    title: title.trim(),
                    description: description.trim() || undefined,
                };

                if (videoSource === 'url') {
                    updates.externalUrl = externalUrl.trim();
                }

                const result = await updateFn(itemId, updates);

                if (result.success) {
                    // Update the local video object and switch to view mode
                    if (savedVideo) {
                        setSavedVideo({
                            ...savedVideo,
                            title: title.trim(),
                            content: {
                                ...savedVideo.content as VideoContent,
                                description: description.trim() || null,
                                ...(videoSource === 'url' && {
                                    externalUrl: externalUrl.trim(),
                                    externalPlatform: detectVideoPlatform(externalUrl.trim())
                                })
                            }
                        });
                    } else if (video) {
                        // Create updated video from original
                        setSavedVideo({
                            ...video,
                            title: title.trim(),
                            content: {
                                ...(video.content as VideoContent),
                                description: description.trim() || null,
                                ...(videoSource === 'url' && {
                                    externalUrl: externalUrl.trim(),
                                    externalPlatform: detectVideoPlatform(externalUrl.trim())
                                })
                            }
                        });
                    }
                    setCurrentMode('view');
                    onSaveSuccess?.();
                } else {
                    setError(result.error || 'Failed to update video');
                }
            }
        } catch (err) {
            setError('Failed to save video');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle regenerate transcript
    const handleRegenerateTranscript = async () => {
        const videoId = displayVideo?.id;
        if (!videoId || isRegeneratingTranscript) return;

        setIsRegeneratingTranscript(true);
        try {
            const result = await regenerateTranscriptForVideo(videoId);
            if (!result.success) {
                console.error('Failed to regenerate transcript:', result.error);
            }
            // Update local state to show generating status
            if (savedVideo) {
                setSavedVideo({
                    ...savedVideo,
                    content: {
                        ...(savedVideo.content as VideoContent),
                        transcriptStatus: 'generating',
                        transcriptError: undefined
                    }
                });
            }
        } catch (error) {
            console.error('Error regenerating transcript:', error);
        } finally {
            setIsRegeneratingTranscript(false);
        }
    };

    // Handle close
    const handleClose = () => {
        setTitle('');
        setDescription('');
        setVideoSource('upload');
        setExternalUrl('');
        setUploadUrl(null);
        setUploadId(null);
        setItemId(null);
        setUploadStatus('idle');
        setError(null);
        setSavedVideo(null);
        setIsRegeneratingTranscript(false);
        setCurrentMode(initialMode);
        onClose();
    };

    // Render title
    const renderTitle = () => (
        <>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Video size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">
                {currentMode === 'edit'
                    ? (displayVideo ? 'Edit Video' : 'Add Video')
                    : 'Video'
                }
            </h2>
        </>
    );

    // Render header actions
    const renderHeaderActions = () => {
        if (currentMode === 'view' && canEdit && displayVideo) {
            return (
                <button
                    onClick={() => setCurrentMode('edit')}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                    <Pencil size={14} />
                    Edit
                </button>
            );
        }

        if (currentMode === 'edit') {
            // For URL mode or editing existing (including savedVideo), show Save button
            const hasExistingVideo = !isNewVideo || savedVideo;
            if (videoSource === 'url' || (hasExistingVideo && uploadStatus === 'ready')) {
                return (
                    <button
                        onClick={handleSave}
                        disabled={!title.trim() || isSaving || (videoSource === 'url' && !isValidVideoUrl(externalUrl))}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-400 hover:to-violet-400 transition-all"
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Save
                    </button>
                );
            }
        }

        return null;
    };

    // Render status badge
    const renderStatusBadge = () => {
        switch (uploadStatus) {
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

    // Render transcript status badge
    const renderTranscriptStatusBadge = () => {
        if (!videoContent?.transcriptStatus) return null;

        switch (videoContent.transcriptStatus) {
            case 'pending':
                return <span className="text-slate-400 text-xs px-2 py-1 bg-slate-800 rounded-full">Pending</span>;
            case 'generating':
                return (
                    <span className="flex items-center gap-1 text-blue-400 text-xs px-2 py-1 bg-blue-900/30 rounded-full">
                        <Loader2 className="animate-spin" size={12} /> Generating
                    </span>
                );
            case 'ready':
                return (
                    <span className="flex items-center gap-1 text-green-400 text-xs px-2 py-1 bg-green-900/30 rounded-full">
                        <CheckCircle size={12} /> Ready
                    </span>
                );
            case 'failed':
                return (
                    <span className="flex items-center gap-1 text-red-400 text-xs px-2 py-1 bg-red-900/30 rounded-full">
                        <AlertCircle size={12} /> Failed
                    </span>
                );
            default:
                return null;
        }
    };

    // Render VIEW mode content
    const renderViewMode = () => {
        if (!displayVideo) return null;

        const playbackId = videoContent?.muxPlaybackId;
        const externalVideoUrl = videoContent?.externalUrl;
        const externalPlatform = videoContent?.externalPlatform;
        const duration = videoContent?.duration;
        const status = videoContent?.status;

        const formattedDate = new Date(displayVideo.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Get embed URL for external videos
        const embedUrl = externalVideoUrl && externalPlatform
            ? getEmbedUrl(externalVideoUrl, externalPlatform)
            : null;

        return (
            <div className="max-w-4xl mx-auto space-y-6 pb-32 pt-[30px]">
                {/* Title */}
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">{displayVideo.title}</h1>
                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>{formattedDate}</span>
                        </div>
                        {duration && (
                            <div className="flex items-center gap-2">
                                <Clock size={14} />
                                <span>{formatDuration(duration)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Video Player */}
                {status === 'ready' && (playbackId || embedUrl) ? (
                    <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
                        {playbackId ? (
                            // Mux video - use MuxPlayer
                            <MuxPlayer
                                streamType="on-demand"
                                playbackId={playbackId}
                                metadata={{
                                    video_id: displayVideo.id,
                                    video_title: displayVideo.title,
                                }}
                                primaryColor="#A855F7"
                                accentColor="#7C3AED"
                                style={{ width: '100%', aspectRatio: '16/9' }}
                            />
                        ) : embedUrl ? (
                            // External video - use iframe embed
                            <iframe
                                src={embedUrl}
                                title={displayVideo.title}
                                className="w-full aspect-video"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : null}
                    </div>
                ) : status === 'processing' ? (
                    <div className="bg-black/30 border border-white/10 rounded-2xl p-12 text-center">
                        <Loader2 size={48} className="mx-auto text-purple-400 mb-4 animate-spin" />
                        <p className="text-slate-400">Video is processing...</p>
                        <p className="text-slate-500 text-sm mt-2">This may take a few minutes</p>
                    </div>
                ) : status === 'uploading' ? (
                    <div className="bg-black/30 border border-white/10 rounded-2xl p-12 text-center">
                        <Loader2 size={48} className="mx-auto text-blue-400 mb-4 animate-spin" />
                        <p className="text-slate-400">Video is uploading...</p>
                    </div>
                ) : status === 'error' ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-12 text-center">
                        <Video size={48} className="mx-auto text-red-400 mb-4" />
                        <p className="text-red-400">Video processing failed</p>
                        <p className="text-slate-500 text-sm mt-2">Please try uploading again</p>
                    </div>
                ) : (
                    <div className="bg-black/30 border border-white/10 rounded-2xl p-12 text-center">
                        <Video size={48} className="mx-auto text-slate-500 mb-4" />
                        <p className="text-slate-400">Video not available</p>
                    </div>
                )}

                {/* Description */}
                {videoContent?.description && (
                    <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-purple-500 to-violet-500" />
                        <div className="p-6">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Description</h3>
                            <p className="text-slate-300 leading-relaxed">{videoContent.description}</p>
                        </div>
                    </div>
                )}

                {/* Transcript Section - Only show if transcriptStatus exists */}
                {videoContent?.transcriptStatus && (
                    <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Transcript
                                </h3>
                                {renderTranscriptStatusBadge()}
                            </div>

                            {/* Show transcript text when ready */}
                            {videoContent.transcriptStatus === 'ready' && videoContent.transcript && (
                                <div className="max-h-64 overflow-y-auto">
                                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
                                        {videoContent.transcript}
                                    </p>
                                </div>
                            )}

                            {/* Show error and retry button when failed */}
                            {videoContent.transcriptStatus === 'failed' && (
                                <div className="space-y-3">
                                    {videoContent.transcriptError && (
                                        <p className="text-red-400 text-sm">{videoContent.transcriptError}</p>
                                    )}
                                    <button
                                        onClick={handleRegenerateTranscript}
                                        disabled={isRegeneratingTranscript}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 rounded-lg text-white text-sm transition-colors"
                                    >
                                        <RefreshCw size={14} className={isRegeneratingTranscript ? 'animate-spin' : ''} />
                                        {isRegeneratingTranscript ? 'Regenerating...' : 'Regenerate Transcript'}
                                    </button>
                                </div>
                            )}

                            {/* Show generating status */}
                            {videoContent.transcriptStatus === 'generating' && (
                                <div className="flex items-center gap-2 text-blue-400">
                                    <Loader2 className="animate-spin" size={16} />
                                    <span className="text-sm">Generating transcript...</span>
                                </div>
                            )}

                            {/* Show pending status */}
                            {videoContent.transcriptStatus === 'pending' && (
                                <p className="text-slate-400 text-sm">Transcript generation pending...</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Render EDIT mode content
    const renderEditMode = () => {
        return (
            <div className="max-w-2xl mx-auto space-y-6 pb-32 pt-[30px]">
                {/* Title Input */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Title *</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter video title..."
                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                        disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                    />
                </div>

                {/* Description Input */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter video description..."
                        rows={3}
                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 resize-none"
                        disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                    />
                </div>

                {/* Video Source Selector - only for new videos or if editing with no existing video */}
                {(isNewVideo || (!videoContent?.muxPlaybackId && !videoContent?.externalUrl)) && (
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-3">Video Source</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setVideoSource('upload')}
                                disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                                    videoSource === 'upload'
                                        ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-300'
                                        : 'bg-black/30 border border-white/10 text-slate-400 hover:bg-white/5'
                                }`}
                            >
                                <Upload size={18} />
                                Upload Video
                            </button>
                            <button
                                onClick={() => setVideoSource('url')}
                                disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                                    videoSource === 'url'
                                        ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-300'
                                        : 'bg-black/30 border border-white/10 text-slate-400 hover:bg-white/5'
                                }`}
                            >
                                <LinkIcon size={18} />
                                Video URL
                            </button>
                        </div>
                    </div>
                )}

                {/* Upload Section */}
                {videoSource === 'upload' && isNewVideo && (
                    <div className="space-y-4">
                        {uploadStatus === 'idle' && (
                            <button
                                onClick={handlePrepareUpload}
                                disabled={!title.trim()}
                                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-violet-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-400 hover:to-violet-400 transition-all flex items-center justify-center gap-2"
                            >
                                <Upload size={20} />
                                Prepare Upload
                            </button>
                        )}

                        {(uploadStatus === 'uploading' || uploadStatus === 'processing') && uploadUrl && (
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
                                        --uploader-border: 1px dashed rgba(255, 255, 255, 0.2);
                                        --uploader-border-radius: 0.75rem;
                                        --button-background-color: #A855F7;
                                        --button-border-radius: 9999px;
                                        --button-color: #fff;
                                    }
                                `}</style>
                            </div>
                        )}

                        {/* Status */}
                        {uploadStatus !== 'idle' && (
                            <div className="flex items-center justify-between">
                                {renderStatusBadge()}
                            </div>
                        )}

                        {/* Done Button - after successful upload */}
                        {uploadStatus === 'ready' && (
                            <button
                                onClick={handleClose}
                                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-400 hover:to-emerald-400 transition-all"
                            >
                                Done
                            </button>
                        )}
                    </div>
                )}

                {/* URL Input Section */}
                {videoSource === 'url' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Video URL</label>
                            <input
                                type="url"
                                value={externalUrl}
                                onChange={(e) => setExternalUrl(e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                Supports: YouTube, Vimeo, Wistia
                            </p>
                        </div>

                        {/* URL Preview */}
                        {externalUrl && isValidVideoUrl(externalUrl) && (
                            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                <div className="flex items-center gap-2 text-purple-300 text-sm">
                                    <CheckCircle size={16} />
                                    <span>Detected: {detectVideoPlatform(externalUrl).charAt(0).toUpperCase() + detectVideoPlatform(externalUrl).slice(1)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                        {error}
                    </div>
                )}

                {/* Transcript Preview in Edit Mode */}
                {videoContent?.transcript && (
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            AI-Generated Transcript
                        </label>
                        <div className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-slate-400 text-sm max-h-48 overflow-y-auto whitespace-pre-wrap">
                            {videoContent.transcript}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <GlobalTopPanel
            isOpen={isOpen}
            onClose={handleClose}
            title={renderTitle()}
            headerActions={renderHeaderActions()}
        >
            {currentMode === 'view' ? renderViewMode() : renderEditMode()}
        </GlobalTopPanel>
    );
}
