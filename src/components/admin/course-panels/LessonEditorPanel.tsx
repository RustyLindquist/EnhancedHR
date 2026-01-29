'use client';

import React, { useState, useTransition, useCallback, useRef } from 'react';
import { Video, FileText, HelpCircle, Trash2, Loader2, CheckCircle, AlertTriangle, Plus, Link2, Upload, Play, Sparkles, Youtube, Bot, User, Clock, RefreshCw, X, Timer } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { updateLesson, deleteLesson, createLesson, generateTranscriptFromVideo, fetchYouTubeMetadataAction } from '@/app/actions/course-builder';
import { getDurationFromPlaybackId } from '@/app/actions/mux';
import { detectVideoPlatform, fetchVimeoMetadata, fetchWistiaMetadata } from '@/app/actions/video-metadata';
import MuxUploaderWrapper from '@/components/admin/MuxUploaderWrapper';
import QuizBuilder from '@/components/admin/QuizBuilder';
import TranscriptRequiredModal from '@/components/TranscriptRequiredModal';
import LessonVideoPreview from '@/components/admin/LessonVideoPreview';
import { QuizData } from '@/types';

type LessonType = 'video' | 'quiz' | 'article';
type VideoSourceType = 'youtube' | 'url' | 'upload';
type TranscriptTab = 'ai' | 'user';
type TranscriptStatus = 'pending' | 'generating' | 'ready' | 'failed';
type TranscriptSource = 'ai' | 'user' | 'mux-caption' | 'whisper' | 'youtube' | 'legacy' | 'none';

interface LessonEditorPanelProps {
    isOpen: boolean;
    onClose: () => void;
    moduleId: string;
    lessonId: string | null;
    lessonTitle?: string;
    lessonType?: LessonType;
    lessonVideoUrl?: string;
    lessonContent?: string; // Legacy - maps to ai_transcript for backward compat
    lessonDuration?: string;
    lessonQuizData?: QuizData;
    isNewLesson?: boolean;
    onSave: () => void;
    onDelete?: () => void;
    // New dual transcript props
    lessonAiTranscript?: string;
    lessonUserTranscript?: string;
    lessonTranscriptStatus?: TranscriptStatus;
    lessonTranscriptSource?: TranscriptSource;
}

// Status badge component
const StatusBadge: React.FC<{ status: TranscriptStatus }> = ({ status }) => {
    const getStatusConfig = (s: TranscriptStatus) => {
        switch (s) {
            case 'pending':
                return { label: 'Pending', className: 'bg-yellow-400/20 text-yellow-400', icon: <Clock size={12} /> };
            case 'generating':
                return { label: 'Generating', className: 'bg-blue-400/20 text-blue-400', icon: <Loader2 size={12} className="animate-spin" /> };
            case 'ready':
                return { label: 'Ready', className: 'bg-green-400/20 text-green-400', icon: <CheckCircle size={12} /> };
            case 'failed':
                return { label: 'Failed', className: 'bg-red-400/20 text-red-400', icon: <AlertTriangle size={12} /> };
        }
    };

    const config = getStatusConfig(status);
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
            {config.icon}
            {config.label}
        </span>
    );
};

// Source badge component
const SourceBadge: React.FC<{ source: TranscriptSource }> = ({ source }) => {
    const getSourceConfig = (s: TranscriptSource) => {
        switch (s) {
            case 'ai':
            case 'mux-caption':
            case 'whisper':
                return {
                    label: s === 'ai' ? 'AI' : s === 'mux-caption' ? 'Mux' : 'Whisper',
                    className: 'bg-purple-500/20 text-purple-300',
                    icon: <Bot size={12} />
                };
            case 'user':
                return { label: 'Manual', className: 'bg-green-500/20 text-green-300', icon: <User size={12} /> };
            case 'youtube':
                return { label: 'YouTube', className: 'bg-red-500/20 text-red-300', icon: <Youtube size={12} /> };
            case 'legacy':
                return { label: 'Legacy', className: 'bg-slate-500/20 text-slate-300', icon: <Clock size={12} /> };
            case 'none':
            default:
                return { label: 'None', className: 'bg-slate-500/20 text-slate-400', icon: <FileText size={12} /> };
        }
    };

    const config = getSourceConfig(source);
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
            {config.icon}
            {config.label}
        </span>
    );
};

export default function LessonEditorPanel({
    isOpen,
    onClose,
    moduleId,
    lessonId,
    lessonTitle = '',
    lessonType = 'video',
    lessonVideoUrl = '',
    lessonContent = '', // Legacy
    lessonDuration = '',
    lessonQuizData,
    isNewLesson = false,
    onSave,
    onDelete,
    // New dual transcript props with fallback
    lessonAiTranscript,
    lessonUserTranscript = '',
    lessonTranscriptStatus = 'pending',
    lessonTranscriptSource = 'none'
}: LessonEditorPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Transcript modal state
    const [showTranscriptModal, setShowTranscriptModal] = useState(false);
    const [transcriptModalMode, setTranscriptModalMode] = useState<'required' | 'video-changed'>('required');
    const [originalVideoUrl, setOriginalVideoUrl] = useState(lessonVideoUrl);
    const transcriptRef = useRef<HTMLTextAreaElement>(null);

    // Form state
    const [title, setTitle] = useState(lessonTitle);
    const [type, setType] = useState<LessonType>(lessonType);
    const [videoUrl, setVideoUrl] = useState(lessonVideoUrl);
    const [duration, setDuration] = useState(lessonDuration);

    // Dual transcript state - fall back to lessonContent for backward compat
    const [aiTranscript, setAiTranscript] = useState(lessonAiTranscript ?? lessonContent);
    const [userTranscript, setUserTranscript] = useState(lessonUserTranscript);
    const [transcriptTab, setTranscriptTab] = useState<TranscriptTab>(
        lessonUserTranscript ? 'user' : 'ai'
    );
    const [transcriptStatus, setTranscriptStatus] = useState<TranscriptStatus>(lessonTranscriptStatus);
    const [transcriptSource, setTranscriptSource] = useState<TranscriptSource>(lessonTranscriptSource);

    // Legacy content state for backward compat in save logic
    const content = userTranscript || aiTranscript;

    // Video source selection
    const [videoSource, setVideoSource] = useState<VideoSourceType>('upload');
    const [isUploading, setIsUploading] = useState(false);

    // YouTube metadata state
    const [youtubeMetadata, setYoutubeMetadata] = useState<{
        title?: string;
        thumbnail?: string;
        duration?: number;
    } | null>(null);
    const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);

    // Duration fetching state
    const [isFetchingDuration, setIsFetchingDuration] = useState(false);

    // Quiz data state
    const [quizData, setQuizData] = useState<QuizData | undefined>(lessonQuizData);

    // Transcript generation
    const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);

    // Reset form when panel opens
    React.useEffect(() => {
        if (isOpen) {
            setTitle(lessonTitle);
            setType(lessonType);
            setVideoUrl(lessonVideoUrl);
            setDuration(lessonDuration);
            setQuizData(lessonQuizData);
            setError(null);
            setShowDeleteConfirm(false);
            setIsUploading(false);
            setIsGeneratingTranscript(false);
            setYoutubeMetadata(null);
            setIsFetchingMetadata(false);
            setShowTranscriptModal(false);
            setOriginalVideoUrl(lessonVideoUrl);
            // Reset dual transcript state
            setAiTranscript(lessonAiTranscript ?? lessonContent);
            setUserTranscript(lessonUserTranscript);
            setTranscriptTab(lessonUserTranscript ? 'user' : 'ai');
            setTranscriptStatus(lessonTranscriptStatus);
            setTranscriptSource(lessonTranscriptSource);
        }
    }, [isOpen, lessonTitle, lessonType, lessonVideoUrl, lessonContent, lessonDuration, lessonQuizData, lessonAiTranscript, lessonUserTranscript, lessonTranscriptStatus, lessonTranscriptSource]);

    // Helper function to format duration
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins >= 60) {
            const hrs = Math.floor(mins / 60);
            const remainingMins = mins % 60;
            return `${hrs}h ${remainingMins}m`;
        }
        return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
    };

    // Handler for fetching YouTube metadata
    const handleFetchYouTubeMetadata = useCallback(async () => {
        if (!videoUrl) return;

        setIsFetchingMetadata(true);
        setError(null);

        try {
            const result = await fetchYouTubeMetadataAction(videoUrl);
            if (result.success && result.metadata) {
                setYoutubeMetadata({
                    title: result.metadata.title,
                    thumbnail: result.metadata.thumbnail,
                    duration: result.metadata.duration,
                });
                // Auto-fill duration field
                if (result.metadata.duration) {
                    setDuration(formatDuration(result.metadata.duration));
                }
            } else {
                setError(result.error || 'Failed to fetch video details');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch YouTube details');
        } finally {
            setIsFetchingMetadata(false);
        }
    }, [videoUrl]);

    // Handler for fetching duration from various video platforms
    const handleFetchVideoDuration = useCallback(async (url: string) => {
        if (!url || url.trim() === '') return;

        // Skip if it's a YouTube URL (handled separately via handleFetchYouTubeMetadata)
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            return;
        }

        // Skip if it looks like a Google Drive URL
        if (url.includes('drive.google')) {
            return;
        }

        setIsFetchingDuration(true);
        const platform = await detectVideoPlatform(url);

        try {
            let durationSeconds: number | undefined;

            switch (platform) {
                case 'mux':
                    const muxResult = await getDurationFromPlaybackId(url);
                    if (muxResult.success && muxResult.duration !== undefined) {
                        durationSeconds = muxResult.duration;
                    }
                    break;
                case 'vimeo':
                    const vimeoResult = await fetchVimeoMetadata(url);
                    if (vimeoResult.success && vimeoResult.duration !== undefined) {
                        durationSeconds = vimeoResult.duration;
                    }
                    break;
                case 'wistia':
                    const wistiaResult = await fetchWistiaMetadata(url);
                    if (wistiaResult.success && wistiaResult.duration !== undefined) {
                        durationSeconds = wistiaResult.duration;
                    }
                    break;
                // YouTube handled separately via handleFetchYouTubeMetadata
            }

            if (durationSeconds !== undefined) {
                setDuration(formatDuration(durationSeconds));
            }
            // Don't show error if duration fetch fails - it's optional
        } catch (err) {
            console.error('Failed to fetch video duration:', err);
        } finally {
            setIsFetchingDuration(false);
        }
    }, []);

    const handleGenerateTranscript = useCallback(async () => {
        if (!videoUrl) {
            setError('Please add a video URL first');
            return;
        }

        setError(null);
        setIsGeneratingTranscript(true);
        setTranscriptStatus('generating');

        try {
            const result = await generateTranscriptFromVideo(videoUrl);

            if (result.success && result.transcript) {
                setAiTranscript(result.transcript);
                setTranscriptStatus('ready');
                // Map the source from generateTranscriptFromVideo result
                if (result.source) {
                    setTranscriptSource(result.source as TranscriptSource);
                } else {
                    setTranscriptSource('ai');
                }
                // Switch to AI tab to show the new transcript
                setTranscriptTab('ai');
            } else {
                setTranscriptStatus('failed');
                setError(result.error || 'Failed to generate transcript');
            }
        } catch (err: any) {
            setTranscriptStatus('failed');
            setError(err.message || 'An error occurred while generating the transcript');
        } finally {
            setIsGeneratingTranscript(false);
        }
    }, [videoUrl]);

    // Auto-generate transcript when video URL changes and we don't have one yet
    const previousVideoUrlRef = React.useRef<string>('');
    React.useEffect(() => {
        // Only auto-generate if:
        // 1. We have a video URL
        // 2. The video URL is new (changed from previous)
        // 3. We don't already have an AI transcript
        // 4. We're not already generating
        // 5. The panel is open
        // 6. It's a video type lesson
        if (
            isOpen &&
            type === 'video' &&
            videoUrl &&
            videoUrl !== previousVideoUrlRef.current &&
            !aiTranscript &&
            !isGeneratingTranscript &&
            transcriptStatus !== 'generating'
        ) {
            previousVideoUrlRef.current = videoUrl;
            // Start auto-generation
            handleGenerateTranscript();
        }
    }, [isOpen, type, videoUrl, aiTranscript, isGeneratingTranscript, transcriptStatus, handleGenerateTranscript]);

    // Check if transcript has meaningful content (not just whitespace or short text)
    const hasValidTranscript = useCallback((text: string) => {
        return text.trim().length >= 10;
    }, []);

    // Check if video URL has changed
    const hasVideoUrlChanged = useCallback(() => {
        return videoUrl !== originalVideoUrl && originalVideoUrl !== '';
    }, [videoUrl, originalVideoUrl]);

    // Get the effective transcript (user takes priority)
    const getEffectiveTranscript = useCallback(() => {
        return userTranscript || aiTranscript;
    }, [userTranscript, aiTranscript]);

    // Clear user transcript override
    const handleClearUserTranscript = useCallback(() => {
        setUserTranscript('');
        setTranscriptTab('ai');
        if (aiTranscript) {
            // Preserve the AI source
        } else {
            setTranscriptSource('none');
        }
    }, [aiTranscript]);

    // Perform the actual save operation
    const performSave = useCallback((contentToSave?: string) => {
        setError(null);
        startTransition(async () => {
            // Determine what to save - prioritize user transcript
            const finalAiTranscript = aiTranscript;
            const finalUserTranscript = userTranscript;
            // For backward compat, also set content to the effective transcript
            const effectiveContent = contentToSave !== undefined ? contentToSave : (finalUserTranscript || finalAiTranscript);

            let result;
            if (isNewLesson) {
                result = await createLesson(moduleId, {
                    title: title.trim(),
                    type,
                    video_url: type === 'video' ? videoUrl : undefined,
                    content: effectiveContent || undefined,
                    duration: duration || undefined,
                    quiz_data: type === 'quiz' ? quizData : undefined
                });
            } else if (lessonId) {
                result = await updateLesson(lessonId, {
                    title: title.trim(),
                    video_url: type === 'video' ? videoUrl : undefined,
                    content: effectiveContent || undefined,
                    duration: duration || undefined,
                    quiz_data: type === 'quiz' ? quizData : undefined
                });
            } else {
                setError('Lesson ID is missing');
                return;
            }

            if (result.success) {
                setShowSuccess(true);
                setOriginalVideoUrl(videoUrl); // Update original URL after successful save
                setTimeout(() => {
                    setShowSuccess(false);
                    onSave();
                }, 1000);
            } else {
                setError(result.error || 'Failed to save lesson');
            }
        });
    }, [moduleId, lessonId, title, type, videoUrl, aiTranscript, userTranscript, duration, quizData, isNewLesson, onSave]);

    const handleSave = useCallback(() => {
        if (!title.trim()) {
            setError('Lesson title is required');
            return;
        }

        // For video lessons, check transcript requirements
        if (type === 'video') {
            const effectiveTranscript = getEffectiveTranscript();
            const transcriptExists = hasValidTranscript(effectiveTranscript);
            const videoChanged = hasVideoUrlChanged();

            // Case 1: No valid transcript and NOT generating - prompt to add one
            // If generating, allow save since transcript is being auto-generated
            if (!transcriptExists && videoUrl && !isGeneratingTranscript && transcriptStatus !== 'generating') {
                setTranscriptModalMode('required');
                setShowTranscriptModal(true);
                return;
            }

            // Case 2: Video changed with existing transcript - ask what to do
            if (videoChanged && transcriptExists) {
                setTranscriptModalMode('video-changed');
                setShowTranscriptModal(true);
                return;
            }
        }

        // All checks passed, proceed with save
        performSave();
    }, [title, type, getEffectiveTranscript, videoUrl, isGeneratingTranscript, transcriptStatus, hasValidTranscript, hasVideoUrlChanged, performSave]);

    // Modal callback: User wants to enter transcript manually
    const handleEnterManually = useCallback(() => {
        setShowTranscriptModal(false);
        // Switch to user tab for manual entry
        setTranscriptTab('user');
        // Focus on transcript textarea after a short delay
        setTimeout(() => {
            transcriptRef.current?.focus();
        }, 100);
    }, []);

    // Modal callback: User wants to generate transcript with AI
    const handleGenerateWithAI = useCallback(async () => {
        // Save the lesson first, then trigger generation
        setShowTranscriptModal(false);

        // Perform save, then generate transcript in background
        setError(null);
        startTransition(async () => {
            let result;
            let targetLessonId = lessonId;
            const effectiveContent = userTranscript || aiTranscript;

            // Create or update the lesson first
            if (isNewLesson) {
                result = await createLesson(moduleId, {
                    title: title.trim(),
                    type,
                    video_url: type === 'video' ? videoUrl : undefined,
                    content: effectiveContent || undefined,
                    duration: duration || undefined,
                    quiz_data: type === 'quiz' ? quizData : undefined
                });
                // Get the new lesson ID from the result
                targetLessonId = (result as any).lesson?.id;
            } else if (lessonId) {
                result = await updateLesson(lessonId, {
                    title: title.trim(),
                    video_url: type === 'video' ? videoUrl : undefined,
                    content: effectiveContent || undefined,
                    duration: duration || undefined,
                    quiz_data: type === 'quiz' ? quizData : undefined
                });
            } else {
                setError('Lesson ID is missing');
                return;
            }

            if (result.success) {
                setShowSuccess(true);
                setOriginalVideoUrl(videoUrl);

                // Start background transcript generation
                setIsGeneratingTranscript(true);
                setTranscriptStatus('generating');
                try {
                    const transcriptResult = await generateTranscriptFromVideo(videoUrl);
                    if (transcriptResult.success && transcriptResult.transcript) {
                        setAiTranscript(transcriptResult.transcript);
                        setTranscriptStatus('ready');
                        if (transcriptResult.source) {
                            setTranscriptSource(transcriptResult.source as TranscriptSource);
                        }
                        setTranscriptTab('ai');
                        // Save again with the transcript
                        if (targetLessonId) {
                            await updateLesson(targetLessonId, {
                                title: title.trim(),
                                video_url: videoUrl,
                                content: transcriptResult.transcript,
                                duration: duration || undefined,
                            });
                        }
                    } else {
                        setTranscriptStatus('failed');
                        setError('Transcript generation failed: ' + (transcriptResult.error || 'Unknown error'));
                    }
                } catch (err: any) {
                    setTranscriptStatus('failed');
                    setError('Transcript generation failed: ' + (err.message || 'Unknown error'));
                } finally {
                    setIsGeneratingTranscript(false);
                }

                setTimeout(() => {
                    setShowSuccess(false);
                    onSave();
                }, 1000);
            } else {
                setError(result.error || 'Failed to save lesson');
            }
        });
    }, [moduleId, lessonId, isNewLesson, title, type, videoUrl, aiTranscript, userTranscript, duration, quizData, onSave]);

    // Modal callback: Keep current transcript (for video-changed mode)
    const handleKeepCurrent = useCallback(() => {
        setShowTranscriptModal(false);
        performSave();
    }, [performSave]);

    // Modal callback: Regenerate AI transcript
    const handleRegenerateAI = useCallback(() => {
        setShowTranscriptModal(false);
        handleGenerateTranscript();
    }, [handleGenerateTranscript]);

    const handleDelete = useCallback(() => {
        if (!lessonId) return;

        setError(null);
        startTransition(async () => {
            const result = await deleteLesson(lessonId);
            if (result.success) {
                onDelete?.();
                onClose();
            } else {
                setError(result.error || 'Failed to delete lesson');
            }
        });
    }, [lessonId, onDelete, onClose]);

    const handleUploadSuccess = useCallback((playbackId: string, videoDuration?: number) => {
        setVideoUrl(playbackId);
        setIsUploading(false);
        // Set duration if provided from Mux
        if (videoDuration !== undefined) {
            setDuration(formatDuration(videoDuration));
        }
    }, []);

    // Get current transcript content based on active tab
    const getCurrentTranscriptContent = useCallback(() => {
        return transcriptTab === 'user' ? userTranscript : aiTranscript;
    }, [transcriptTab, userTranscript, aiTranscript]);

    // Handle transcript content change based on active tab
    const handleTranscriptChange = useCallback((value: string) => {
        if (transcriptTab === 'user') {
            setUserTranscript(value);
            if (value.trim()) {
                setTranscriptSource('user');
            }
        } else {
            setAiTranscript(value);
        }
    }, [transcriptTab]);

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
                disabled={isPending || !title.trim() || isUploading}
                className="flex items-center gap-2 px-5 py-2 bg-brand-orange text-white rounded-lg text-sm font-bold hover:bg-brand-orange/80 transition-colors disabled:opacity-50"
            >
                {isPending ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                    </>
                ) : isNewLesson ? (
                    <>
                        <Plus size={16} />
                        Create Lesson
                    </>
                ) : (
                    'Save Changes'
                )}
            </button>
        </div>
    );

    const lessonTypeIcons: Record<LessonType, React.ReactNode> = {
        video: <Video size={16} />,
        quiz: <HelpCircle size={16} />,
        article: <FileText size={16} />
    };

    return (
        <DropdownPanel
            isOpen={isOpen}
            onClose={onClose}
            title={isNewLesson ? 'Add New Lesson' : 'Edit Lesson'}
            icon={Video}
            iconColor="text-brand-blue-light"
            headerActions={headerActions}
        >
            <div className="max-w-3xl space-y-6">
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Lesson Title */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Lesson Title *
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Understanding HR Metrics"
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-medium placeholder-slate-600 outline-none focus:border-brand-blue-light/50"
                        autoFocus
                    />
                </div>

                {/* Lesson Type */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Lesson Type
                    </label>
                    <div className="flex gap-3">
                        {(['video', 'article', 'quiz'] as LessonType[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={`
                                    flex items-center gap-2 px-4 py-3 rounded-xl border transition-all
                                    ${type === t
                                        ? 'bg-brand-blue-light/10 border-brand-blue-light/50 text-brand-blue-light'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                    }
                                `}
                            >
                                {lessonTypeIcons[t]}
                                <span className="font-medium capitalize">{t}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Video Settings - Only show for video type */}
                {type === 'video' && (
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Video Source
                        </label>

                        {/* Video Source Tabs */}
                        <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
                            <button
                                onClick={() => setVideoSource('upload')}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    videoSource === 'upload'
                                        ? 'bg-brand-blue-light/20 text-brand-blue-light'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Upload size={14} />
                                Upload
                            </button>
                            <button
                                onClick={() => setVideoSource('youtube')}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    videoSource === 'youtube'
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Youtube size={14} />
                                YouTube
                            </button>
                            <button
                                onClick={() => setVideoSource('url')}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    videoSource === 'url'
                                        ? 'bg-brand-blue-light/20 text-brand-blue-light'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Link2 size={14} />
                                Mux / URL
                            </button>
                        </div>

                        {/* YouTube URL Input */}
                        {videoSource === 'youtube' && (
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="flex-1 flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                        <Youtube size={16} className="text-red-400" />
                                        <input
                                            type="text"
                                            value={videoUrl}
                                            onChange={(e) => {
                                                setVideoUrl(e.target.value);
                                                setYoutubeMetadata(null);
                                            }}
                                            placeholder="https://youtube.com/watch?v=..."
                                            className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleFetchYouTubeMetadata}
                                        disabled={!videoUrl || isFetchingMetadata}
                                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isFetchingMetadata ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                Fetching...
                                            </>
                                        ) : (
                                            'Fetch Details'
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-600">
                                    Enter a YouTube URL. Click "Fetch Details" to auto-fill duration and preview the video.
                                </p>

                                {/* YouTube Preview */}
                                {youtubeMetadata && (
                                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                                        <div className="flex gap-4">
                                            {youtubeMetadata.thumbnail && (
                                                <img
                                                    src={youtubeMetadata.thumbnail}
                                                    alt="Video thumbnail"
                                                    className="w-32 h-20 object-cover rounded-lg"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{youtubeMetadata.title}</p>
                                                {youtubeMetadata.duration && (
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Duration: {formatDuration(youtubeMetadata.duration)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* URL Input */}
                        {videoSource === 'url' && (
                            <div>
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                    <Link2 size={16} className="text-slate-400" />
                                    <input
                                        type="text"
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        onBlur={(e) => handleFetchVideoDuration(e.target.value)}
                                        placeholder="Mux Playback ID, Vimeo URL, Wistia URL, or Google Drive URL"
                                        className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                                    />
                                    {isFetchingDuration && (
                                        <Loader2 size={16} className="text-slate-400 animate-spin" />
                                    )}
                                </div>
                                <p className="text-xs text-slate-600 mt-2">
                                    Enter a Mux Playback ID, Vimeo URL, Wistia URL, or Google Drive video URL. Duration will be auto-fetched.
                                </p>
                            </div>
                        )}

                        {/* Upload Section */}
                        {videoSource === 'upload' && (
                            <div>
                                {videoUrl ? (
                                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-green-500/20">
                                                <Play size={16} className="text-green-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">Video uploaded</p>
                                                <p className="text-xs text-slate-400">ID: {videoUrl}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setVideoUrl('')}
                                            className="text-xs text-slate-400 hover:text-white"
                                        >
                                            Replace
                                        </button>
                                    </div>
                                ) : (
                                    <MuxUploaderWrapper
                                        onUploadStart={() => setIsUploading(true)}
                                        onSuccess={handleUploadSuccess}
                                        onError={(err) => {
                                            setError('Upload failed: ' + err.message);
                                            setIsUploading(false);
                                        }}
                                    />
                                )}
                            </div>
                        )}

                        {/* Video Preview */}
                        {videoUrl && (
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Video Preview
                                </label>
                                <LessonVideoPreview
                                    videoUrl={videoUrl}
                                    lessonTitle={title || 'Lesson Video'}
                                    isProcessing={isUploading}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Quiz Builder - Only show for quiz type */}
                {type === 'quiz' && (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                            Quiz Builder
                        </label>
                        <QuizBuilder
                            initialData={quizData}
                            onChange={setQuizData}
                            disabled={isPending}
                        />
                    </div>
                )}

                {/* Transcript / Content - Only show for video and article types */}
                {type !== 'quiz' && (
                    <div>
                        {/* Header with status indicators */}
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {type === 'video' ? 'Transcript / Script' : 'Article Content'}
                            </label>

                            {/* Status and Source badges - only for video type */}
                            {type === 'video' && (
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={transcriptStatus} />
                                    <SourceBadge source={transcriptSource} />
                                </div>
                            )}
                        </div>

                        {/* Transcript Tabs - only for video type */}
                        {type === 'video' && (
                            <div className="mb-3">
                                <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
                                    <button
                                        onClick={() => setTranscriptTab('ai')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            transcriptTab === 'ai'
                                                ? 'bg-purple-500/20 text-purple-300'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <Bot size={14} />
                                        AI Generated
                                    </button>
                                    <button
                                        onClick={() => setTranscriptTab('user')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            transcriptTab === 'user'
                                                ? 'bg-green-500/20 text-green-300'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <User size={14} />
                                        Manual Entry
                                    </button>
                                </div>

                                {/* Tab-specific info */}
                                {transcriptTab === 'user' && (
                                    <div className="mt-2 flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                                        <p className="text-xs text-green-300">
                                            Your manual transcript will be used instead of AI-generated content.
                                        </p>
                                        {userTranscript && (
                                            <button
                                                onClick={handleClearUserTranscript}
                                                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-green-400 hover:bg-green-500/10 transition-colors"
                                            >
                                                <X size={12} />
                                                Clear Override
                                            </button>
                                        )}
                                    </div>
                                )}

                                {transcriptTab === 'ai' && (
                                    <div className="mt-2 flex items-center justify-between p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                                        <p className="text-xs text-purple-300">
                                            {isGeneratingTranscript
                                                ? 'AI transcript generation in progress...'
                                                : aiTranscript
                                                    ? 'AI-generated transcript from video source.'
                                                    : videoUrl
                                                        ? 'AI transcript will be generated automatically.'
                                                        : 'Add a video to generate transcript.'}
                                        </p>
                                        {/* Regenerate button - only show when we have a transcript and video */}
                                        {videoUrl && aiTranscript && !isGeneratingTranscript && (
                                            <button
                                                onClick={handleGenerateTranscript}
                                                disabled={isGeneratingTranscript || isPending}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <RefreshCw size={12} />
                                                Regenerate
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Generation in progress indicator */}
                        {isGeneratingTranscript && (
                            <div className="mb-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm flex items-center gap-3">
                                <Loader2 size={16} className="animate-spin" />
                                <div>
                                    <p className="font-medium">Analyzing video and generating transcript...</p>
                                    <p className="text-xs text-purple-400/70 mt-0.5">This may take a minute depending on video length</p>
                                </div>
                            </div>
                        )}

                        <textarea
                            ref={transcriptRef}
                            value={getCurrentTranscriptContent()}
                            onChange={(e) => handleTranscriptChange(e.target.value)}
                            placeholder={
                                type === 'video'
                                    ? transcriptTab === 'user'
                                        ? 'Enter your manual transcript here...'
                                        : 'AI-generated transcript will appear here...'
                                    : 'Write the article content...'
                            }
                            rows={6}
                            disabled={isGeneratingTranscript || (transcriptTab === 'ai' && type === 'video')}
                            className={`w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none resize-none focus:border-brand-blue-light/50 disabled:opacity-50 ${
                                transcriptTab === 'ai' && type === 'video' ? 'cursor-not-allowed' : ''
                            }`}
                        />
                        {type === 'video' && (
                            <p className="text-xs text-slate-600 mt-2">
                                Transcripts enable AI-powered search and help learners get answers about lesson content.
                                {transcriptTab === 'ai' && ' Switch to "Manual Entry" to edit directly.'}
                            </p>
                        )}
                    </div>
                )}

                {/* Duration - Auto-extracted from video (only show for video type) */}
                {type === 'video' && (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Duration
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                                <Timer size={16} className="text-slate-400" />
                                {isFetchingDuration ? (
                                    <span className="text-slate-400 text-sm flex items-center gap-2">
                                        <Loader2 size={14} className="animate-spin" />
                                        Fetching duration...
                                    </span>
                                ) : duration ? (
                                    <span className="text-white font-medium">{duration}</span>
                                ) : (
                                    <span className="text-slate-600 text-sm">Auto-extracted from video</span>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 mt-2">
                            Duration is automatically extracted from your video source
                        </p>
                    </div>
                )}

                {/* Delete Section */}
                {!isNewLesson && lessonId && (
                    <div className="pt-6 border-t border-white/5">
                        {!showDeleteConfirm ? (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                                Delete Lesson
                            </button>
                        ) : (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-red-400 mb-1">Delete this lesson?</h4>
                                        <p className="text-sm text-slate-400 mb-4">
                                            This will permanently delete the lesson. This action cannot be undone.
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

            {/* Transcript Required Modal */}
            <TranscriptRequiredModal
                isOpen={showTranscriptModal}
                mode={transcriptModalMode}
                onClose={() => setShowTranscriptModal(false)}
                onEnterManually={handleEnterManually}
                onGenerateWithAI={handleGenerateWithAI}
                onKeepCurrent={handleKeepCurrent}
                isGenerating={isPending || isGeneratingTranscript}
                currentTranscript={getEffectiveTranscript()}
                transcriptSource={transcriptSource}
                onRegenerateAI={handleRegenerateAI}
            />
        </DropdownPanel>
    );
}
