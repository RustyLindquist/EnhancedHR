'use client';

import React, { useState, useTransition, useCallback, useEffect, useRef } from 'react';
import { Video, FileText, HelpCircle, Trash2, Loader2, CheckCircle, AlertTriangle, Plus, Link2, Upload, Play, Sparkles, RefreshCw, Bot, User, Timer, Paperclip } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { createExpertLesson, updateExpertLesson, deleteExpertLesson, uploadExpertModuleResourceFile, updateExpertModuleResource, deleteExpertModuleResource } from '@/app/actions/expert-course-builder';
import { generateTranscriptFromVideo } from '@/app/actions/course-builder';
import { getDurationFromPlaybackId } from '@/app/actions/mux';
import { detectVideoPlatform, fetchVimeoMetadata, fetchWistiaMetadata } from '@/app/actions/video-metadata';
import MuxUploaderWrapper from '@/components/admin/MuxUploaderWrapper';
import QuizBuilder from '@/components/admin/QuizBuilder';
import TranscriptRequiredModal from '@/components/TranscriptRequiredModal';
import LessonVideoPreview from '@/components/admin/LessonVideoPreview';
import FileUploadZone from '@/components/admin/FileUploadZone';
import { QuizData } from '@/types';

type LessonType = 'video' | 'quiz' | 'article';
type VideoSourceType = 'url' | 'upload';
type TranscriptTab = 'ai' | 'user';

function parseDurationToMinutes(duration: string | null | undefined): number {
    if (!duration) return 0;
    let totalSeconds = 0;
    const hoursMatch = duration.match(/(\d+)\s*h/i);
    if (hoursMatch) totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
    const minsMatch = duration.match(/(\d+)\s*m(?!s)/i);
    if (minsMatch) totalSeconds += parseInt(minsMatch[1], 10) * 60;
    const secsMatch = duration.match(/(\d+)\s*s/i);
    if (secsMatch) totalSeconds += parseInt(secsMatch[1], 10);
    return Math.round(totalSeconds / 60);
}

interface ExpertLessonEditorPanelProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: number;
    moduleId: string;
    lessonId: string | null;
    lessonTitle?: string;
    lessonType?: LessonType;
    lessonVideoUrl?: string;
    lessonContent?: string;
    lessonDuration?: string;
    lessonQuizData?: QuizData;
    isNewLesson?: boolean;
    onSave: () => void;
    onDelete?: () => void;
    // Resource editing props
    resourceId?: string | null;
    resourceUrl?: string;
    resourceType?: string;
    resourceSize?: string;
    resourceEstimatedDuration?: string;
    resourceDescription?: string;
}

const LESSON_TYPES = [
    { value: 'video', label: 'Video', icon: Video, color: 'text-blue-400' },
    { value: 'article', label: 'File', icon: Upload, color: 'text-green-400' },
    { value: 'quiz', label: 'Quiz', icon: HelpCircle, color: 'text-purple-400' }
];

export default function ExpertLessonEditorPanel({
    isOpen,
    onClose,
    courseId,
    moduleId,
    lessonId,
    lessonTitle = '',
    lessonType = 'video',
    lessonVideoUrl = '',
    lessonContent = '',
    lessonDuration = '',
    lessonQuizData,
    isNewLesson = false,
    onSave,
    onDelete,
    resourceId,
    resourceUrl,
    resourceType,
    resourceSize,
    resourceEstimatedDuration,
    resourceDescription
}: ExpertLessonEditorPanelProps) {
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
    const [quizData, setQuizData] = useState<QuizData | undefined>(lessonQuizData);

    // Estimated time state (for quiz and file types)
    const [estimatedMinutes, setEstimatedMinutes] = useState<string>('');

    // Resource description state
    const [resourceDescriptionValue, setResourceDescriptionValue] = useState(resourceDescription || '');

    // Dual transcript state
    const [aiTranscript, setAiTranscript] = useState(lessonContent);
    const [userTranscript, setUserTranscript] = useState('');
    const [transcriptTab, setTranscriptTab] = useState<TranscriptTab>('ai');

    // Legacy content computed from transcripts (user takes priority)
    const content = userTranscript || aiTranscript;

    // File upload state (for "File" type, displayed as article)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploadingFile, setIsUploadingFile] = useState(false);

    // Video source selection
    const [videoSource, setVideoSource] = useState<VideoSourceType>('upload');
    const [isUploading, setIsUploading] = useState(false);

    // Transcript generation
    const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);

    // Duration fetching state
    const [isFetchingDuration, setIsFetchingDuration] = useState(false);

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

    // Reset form when panel opens
    useEffect(() => {
        if (isOpen) {
            setTitle(lessonTitle);
            setType(lessonType);
            setVideoUrl(lessonVideoUrl);
            setAiTranscript(lessonContent);
            setUserTranscript('');
            setTranscriptTab('ai');
            setDuration(lessonDuration);
            setQuizData(lessonQuizData);
            // Initialize estimated minutes from existing data
            if (resourceEstimatedDuration) {
                const mins = parseDurationToMinutes(resourceEstimatedDuration);
                setEstimatedMinutes(mins > 0 ? String(mins) : '');
            } else if (lessonType === 'quiz' && lessonDuration) {
                const mins = parseDurationToMinutes(lessonDuration);
                setEstimatedMinutes(mins > 0 ? String(mins) : '');
            } else {
                setEstimatedMinutes('');
            }
            setError(null);
            setShowDeleteConfirm(false);
            setIsUploading(false);
            setIsGeneratingTranscript(false);
            setShowTranscriptModal(false);
            setOriginalVideoUrl(lessonVideoUrl); // Track original video URL for change detection
            setSelectedFiles([]);
            setIsUploadingFile(false);
            setResourceDescriptionValue(resourceDescription || '');
        }
    }, [isOpen, lessonTitle, lessonType, lessonVideoUrl, lessonContent, lessonDuration, lessonQuizData, resourceEstimatedDuration, resourceDescription]);

    const handleGenerateTranscript = useCallback(async () => {
        if (!videoUrl) {
            setError('Please add a video URL first');
            return;
        }

        setError(null);
        setIsGeneratingTranscript(true);

        try {
            const result = await generateTranscriptFromVideo(videoUrl);

            if (result.success && result.transcript) {
                setAiTranscript(result.transcript);
                setTranscriptTab('ai');
            } else {
                setError(result.error || 'Failed to generate transcript');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while generating the transcript');
        } finally {
            setIsGeneratingTranscript(false);
        }
    }, [videoUrl]);

    // Auto-generate transcript when video URL changes and we don't have one yet
    const previousVideoUrlRef = useRef<string>('');
    useEffect(() => {
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
            !isGeneratingTranscript
        ) {
            previousVideoUrlRef.current = videoUrl;
            // Start auto-generation
            handleGenerateTranscript();
        }
    }, [isOpen, type, videoUrl, aiTranscript, isGeneratingTranscript, handleGenerateTranscript]);

    // Handle transcript content change based on active tab
    const handleTranscriptChange = useCallback((value: string) => {
        if (transcriptTab === 'user') {
            setUserTranscript(value);
        } else {
            setAiTranscript(value);
        }
    }, [transcriptTab]);

    // Get current transcript content based on active tab
    const getCurrentTranscriptContent = useCallback(() => {
        return transcriptTab === 'user' ? userTranscript : aiTranscript;
    }, [transcriptTab, userTranscript, aiTranscript]);

    const handleUploadSuccess = useCallback((playbackId: string, videoDuration?: number) => {
        setVideoUrl(playbackId);
        setIsUploading(false);
        // Set duration if provided from Mux
        if (videoDuration !== undefined) {
            setDuration(formatDuration(videoDuration));
        }
    }, []);

    // Handler for fetching duration from various video platforms
    const handleFetchVideoDuration = useCallback(async (url: string) => {
        if (!url || url.trim() === '') return;

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
                case 'youtube':
                    // YouTube could be supported in Expert panel too, but skipping for now
                    // as the expert panel doesn't have YouTube-specific UI
                    break;
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

    // Check if transcript has meaningful content (not just whitespace or short text)
    const hasValidTranscript = useCallback((text: string) => {
        return text.trim().length >= 10;
    }, []);

    // Check if video URL has changed
    const hasVideoUrlChanged = useCallback(() => {
        return videoUrl !== originalVideoUrl && originalVideoUrl !== '';
    }, [videoUrl, originalVideoUrl]);

    // Handle resource delete
    const handleDeleteResource = useCallback(() => {
        if (!resourceId) return;
        setError(null);
        startTransition(async () => {
            const result = await deleteExpertModuleResource(resourceId, courseId);
            if (result.success) {
                onDelete?.();
                onClose();
            } else {
                setError(result.error || 'Failed to delete resource');
            }
        });
    }, [resourceId, courseId, onDelete, onClose]);

    // Perform the actual save operation
    const performSave = useCallback((contentToSave?: string) => {
        setError(null);
        startTransition(async () => {
            // Handle resource title update (editing existing resource)
            if (resourceId) {
                let resourceDuration: string | undefined;
                if (estimatedMinutes) {
                    const mins = parseFloat(estimatedMinutes);
                    if (!isNaN(mins) && mins >= 0) {
                        resourceDuration = mins >= 60
                            ? `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`
                            : `${Math.round(mins)}m`;
                    }
                }
                const result = await updateExpertModuleResource(resourceId, courseId, {
                    title: title.trim(),
                    estimated_duration: resourceDuration,
                    description: resourceDescriptionValue.trim() || undefined
                });
                if (result.success) {
                    setShowSuccess(true);
                    setTimeout(() => {
                        setShowSuccess(false);
                        onSave();
                    }, 1000);
                } else {
                    setError(result.error || 'Failed to update resource');
                }
                return;
            }

            // Handle file upload for "File" type (article with file)
            if (type === 'article' && selectedFiles.length > 0) {
                setIsUploadingFile(true);
                try {
                    const file = selectedFiles[0];
                    const buffer = await file.arrayBuffer();
                    // Convert minutes to duration string for resource
                    let resourceDuration = '0m';
                    if (estimatedMinutes) {
                        const mins = parseFloat(estimatedMinutes);
                        if (!isNaN(mins) && mins >= 0) {
                            resourceDuration = mins >= 60
                                ? `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`
                                : `${Math.round(mins)}m`;
                        }
                    }
                    const result = await uploadExpertModuleResourceFile(
                        courseId,
                        moduleId,
                        file.name,
                        file.type,
                        buffer,
                        resourceDuration,
                        resourceDescriptionValue.trim() || undefined
                    );

                    if (result.success) {
                        setShowSuccess(true);
                        setSelectedFiles([]);
                        setTimeout(() => {
                            setShowSuccess(false);
                            onSave();
                        }, 1000);
                    } else {
                        setError(result.error || 'Failed to upload file');
                    }
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to upload file');
                } finally {
                    setIsUploadingFile(false);
                }
                return;
            }

            const finalContent = contentToSave !== undefined ? contentToSave : content;

            // Convert estimated minutes to duration string for quiz type
            let effectiveDuration = duration;
            if (type !== 'video' && estimatedMinutes) {
                const mins = parseFloat(estimatedMinutes);
                if (!isNaN(mins) && mins >= 0) {
                    effectiveDuration = mins >= 60
                        ? `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`
                        : `${Math.round(mins)}m`;
                }
            }

            let result;
            if (isNewLesson) {
                result = await createExpertLesson(moduleId, courseId, {
                    title: title.trim(),
                    type,
                    video_url: type === 'video' ? videoUrl : undefined,
                    content: finalContent || undefined,
                    duration: effectiveDuration || undefined,
                    quiz_data: type === 'quiz' ? quizData : undefined
                });
            } else if (lessonId) {
                result = await updateExpertLesson(lessonId, courseId, {
                    title: title.trim(),
                    video_url: type === 'video' ? videoUrl : undefined,
                    content: finalContent || undefined,
                    duration: effectiveDuration || undefined,
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
    }, [moduleId, courseId, lessonId, title, type, videoUrl, content, duration, quizData, isNewLesson, onSave, selectedFiles, resourceId, estimatedMinutes, resourceDescriptionValue]);

    const handleSave = useCallback(() => {
        if (!title.trim()) {
            setError('Element title is required');
            return;
        }

        // For file type, ensure a file is selected for new elements
        if (type === 'article' && isNewLesson && selectedFiles.length === 0) {
            setError('Please select a file to upload');
            return;
        }

        // For video lessons, check transcript requirements
        if (type === 'video') {
            const transcriptExists = hasValidTranscript(content);
            const videoChanged = hasVideoUrlChanged();

            // Case 1: No valid transcript and NOT generating - prompt to add one
            // If generating, allow save since transcript is being auto-generated
            if (!transcriptExists && videoUrl && !isGeneratingTranscript) {
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
    }, [title, type, content, videoUrl, isGeneratingTranscript, hasValidTranscript, hasVideoUrlChanged, performSave, selectedFiles, isNewLesson]);

    // Modal callback: User wants to enter transcript manually
    const handleEnterManually = useCallback(() => {
        setShowTranscriptModal(false);
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
            if (isNewLesson) {
                result = await createExpertLesson(moduleId, courseId, {
                    title: title.trim(),
                    type,
                    video_url: type === 'video' ? videoUrl : undefined,
                    content: content || undefined,
                    duration: duration || undefined,
                    quiz_data: type === 'quiz' ? quizData : undefined
                });
            } else if (lessonId) {
                result = await updateExpertLesson(lessonId, courseId, {
                    title: title.trim(),
                    video_url: type === 'video' ? videoUrl : undefined,
                    content: content || undefined,
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
                try {
                    const transcriptResult = await generateTranscriptFromVideo(videoUrl);
                    if (transcriptResult.success && transcriptResult.transcript) {
                        setAiTranscript(transcriptResult.transcript);
                        setTranscriptTab('ai');
                        // Save again with the transcript
                        const targetLessonId = lessonId || (result as any).lesson?.id;
                        if (targetLessonId) {
                            await updateExpertLesson(targetLessonId, courseId, {
                                title: title.trim(),
                                video_url: videoUrl,
                                content: transcriptResult.transcript,
                                duration: duration || undefined,
                            });
                        }
                    } else {
                        setError('Transcript generation failed: ' + (transcriptResult.error || 'Unknown error'));
                    }
                } catch (err: any) {
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
    }, [moduleId, courseId, lessonId, title, type, videoUrl, content, duration, quizData, isNewLesson, onSave]);

    // Modal callback: Keep current transcript (for video-changed mode)
    const handleKeepCurrent = useCallback(() => {
        setShowTranscriptModal(false);
        performSave();
    }, [performSave]);

    const handleDelete = useCallback(() => {
        if (!lessonId) return;

        setError(null);
        startTransition(async () => {
            const result = await deleteExpertLesson(lessonId, courseId);
            if (result.success) {
                onDelete?.();
                onClose();
            } else {
                setError(result.error || 'Failed to delete lesson');
            }
        });
    }, [lessonId, courseId, onDelete, onClose]);

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
                disabled={isPending || !title.trim() || isUploading || isUploadingFile || (type === 'article' && isNewLesson && !resourceId && selectedFiles.length === 0)}
                className="flex items-center gap-2 px-5 py-2 bg-brand-orange text-white rounded-lg text-sm font-bold hover:bg-brand-orange/80 transition-colors disabled:opacity-50"
            >
                {isPending || isUploadingFile ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        {isUploadingFile ? 'Uploading...' : 'Saving...'}
                    </>
                ) : isNewLesson && !resourceId ? (
                    <>
                        <Plus size={16} />
                        Create Element
                    </>
                ) : (
                    'Save Changes'
                )}
            </button>
        </div>
    );

    const TypeIcon = LESSON_TYPES.find(t => t.value === type)?.icon || Video;

    return (
        <DropdownPanel
            isOpen={isOpen}
            onClose={onClose}
            title={resourceId ? 'Edit Resource' : isNewLesson ? 'Add Learning Element' : 'Edit Learning Element'}
            icon={TypeIcon}
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
                        Element Title *
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Understanding Employee Engagement"
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-medium placeholder-slate-600 outline-none focus:border-brand-blue-light/50"
                        autoFocus
                    />
                </div>

                {/* Lesson Type - hidden when editing an existing resource */}
                {!resourceId && (
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Element Type
                    </label>
                    <div className="flex gap-3">
                        {LESSON_TYPES.map((lessonTypeOption) => {
                            const Icon = lessonTypeOption.icon;
                            return (
                                <button
                                    key={lessonTypeOption.value}
                                    type="button"
                                    onClick={() => setType(lessonTypeOption.value as LessonType)}
                                    className={`
                                        flex items-center gap-2 px-4 py-3 rounded-xl border transition-all
                                        ${type === lessonTypeOption.value
                                            ? 'bg-brand-blue-light/10 border-brand-blue-light/50 text-brand-blue-light'
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                        }
                                    `}
                                >
                                    <Icon size={16} className={lessonTypeOption.color} />
                                    <span className="font-medium">{lessonTypeOption.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
                )}

                {/* Video Settings - Only show for video type */}
                {type === 'video' && (
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Video Source
                        </label>

                        {/* Video Source Tabs */}
                        <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
                            <button
                                type="button"
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
                                type="button"
                                onClick={() => setVideoSource('url')}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    videoSource === 'url'
                                        ? 'bg-brand-blue-light/20 text-brand-blue-light'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Link2 size={14} />
                                Online Video
                            </button>
                        </div>

                        {/* Online Video URL Input */}
                        {videoSource === 'url' && (
                            <div>
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                    <Link2 size={16} className="text-slate-400" />
                                    <input
                                        type="text"
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        onBlur={(e) => handleFetchVideoDuration(e.target.value)}
                                        placeholder="YouTube URL, Mux Playback ID, Vimeo, Wistia, or Google Drive URL"
                                        className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                                    />
                                    {isFetchingDuration && (
                                        <Loader2 size={16} className="text-slate-400 animate-spin" />
                                    )}
                                </div>
                                <p className="text-xs text-slate-600 mt-2">
                                    Enter a YouTube URL, Mux Playback ID, Vimeo URL, Wistia URL, or Google Drive video URL. Duration will be auto-fetched.
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
                                            type="button"
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
                    <QuizBuilder
                        initialData={quizData}
                        onChange={setQuizData}
                        disabled={isPending}
                    />
                )}

                {/* File Upload - Only show for file type */}
                {type === 'article' && (
                    <div>
                        {resourceId && resourceUrl ? (
                            <>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                    Attached File
                                </label>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-red-500/20">
                                            <Paperclip size={16} className="text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{resourceType || 'File'} document</p>
                                            {resourceSize && <p className="text-xs text-slate-400">{resourceSize}</p>}
                                        </div>
                                    </div>
                                    <a
                                        href={resourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 rounded-lg bg-brand-blue-light/10 hover:bg-brand-blue-light/20 border border-brand-blue-light/30 text-brand-blue-light text-xs font-medium transition-all"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Download
                                    </a>
                                </div>
                            </>
                        ) : (
                            <>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                    Upload File
                                </label>
                                <FileUploadZone
                                    onFilesSelected={(files) => {
                                        setSelectedFiles(files);
                                        if (!title.trim() && files.length > 0) {
                                            setTitle(files[0].name.replace(/\.[^/.]+$/, ''));
                                        }
                                    }}
                                    onRemoveFile={() => setSelectedFiles([])}
                                    selectedFiles={selectedFiles}
                                    maxFiles={1}
                                    disabled={isPending || isUploadingFile}
                                    uploadingIndex={isUploadingFile ? 0 : undefined}
                                />
                            </>
                        )}
                    </div>
                )}

                {/* Resource Description - Show for file type (new or existing resource) */}
                {(resourceId || type === 'article') && (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Description
                        </label>
                        <textarea
                            value={resourceDescriptionValue}
                            onChange={(e) => setResourceDescriptionValue(e.target.value)}
                            placeholder="Optional description for this resource..."
                            rows={3}
                            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none focus:border-brand-blue-light/50 resize-none"
                        />
                        <p className="text-xs text-slate-600 mt-1.5">
                            Shown to learners when they view this resource.
                        </p>
                    </div>
                )}

                {/* Transcript / Content - Only show for video type */}
                {type === 'video' && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Transcript / Script
                            </label>
                        </div>

                        {/* Transcript Tabs - only for video type */}
                        {type === 'video' && (
                            <div className="mb-3">
                                <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
                                    <button
                                        type="button"
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
                                        type="button"
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
                                    <div className="mt-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                                        <p className="text-xs text-green-300">
                                            Your manual transcript will be used instead of AI-generated content.
                                        </p>
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
                                                type="button"
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
                            value={type === 'video' ? getCurrentTranscriptContent() : aiTranscript}
                            onChange={(e) => type === 'video' ? handleTranscriptChange(e.target.value) : setAiTranscript(e.target.value)}
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

                {/* Estimated Time - For non-video types */}
                {(type === 'quiz' || type === 'article') && (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Estimated Completion Time
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={estimatedMinutes}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || (/^\d*\.?\d*$/.test(val) && parseFloat(val) >= 0)) {
                                            setEstimatedMinutes(val);
                                        }
                                    }}
                                    placeholder="0"
                                    className="w-24 p-3 rounded-xl bg-white/5 border border-white/10 text-white text-center font-medium placeholder-slate-600 outline-none focus:border-brand-blue-light/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="text-slate-400 text-sm">minutes</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 mt-2">
                            Estimate how long this {type === 'quiz' ? 'quiz' : 'resource'} will take learners to complete. This is added to the total course time.
                        </p>
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
                {(!isNewLesson && lessonId || resourceId) && (
                    <div className="pt-6 border-t border-white/5">
                        {!showDeleteConfirm ? (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                                Delete Element
                            </button>
                        ) : (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-red-400 mb-1">Delete this element?</h4>
                                        <p className="text-sm text-slate-400 mb-4">
                                            This will permanently delete this element.
                                        </p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={resourceId ? handleDeleteResource : handleDelete}
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
                isGenerating={isPending}
            />
        </DropdownPanel>
    );
}
