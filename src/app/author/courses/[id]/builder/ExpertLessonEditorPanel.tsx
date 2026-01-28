'use client';

import React, { useState, useTransition, useCallback, useEffect, useRef } from 'react';
import { Video, FileText, HelpCircle, Trash2, Loader2, CheckCircle, AlertTriangle, Plus, Link2, Upload, Play, Sparkles } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { createExpertLesson, updateExpertLesson, deleteExpertLesson } from '@/app/actions/expert-course-builder';
import { generateTranscriptFromVideo } from '@/app/actions/course-builder';
import MuxUploaderWrapper from '@/components/admin/MuxUploaderWrapper';
import QuizBuilder from '@/components/admin/QuizBuilder';
import TranscriptRequiredModal from '@/components/TranscriptRequiredModal';
import LessonVideoPreview from '@/components/admin/LessonVideoPreview';
import { QuizData } from '@/types';

type LessonType = 'video' | 'quiz' | 'article';
type VideoSourceType = 'url' | 'upload';

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
}

const LESSON_TYPES = [
    { value: 'video', label: 'Video', icon: Video, color: 'text-blue-400' },
    { value: 'article', label: 'Article', icon: FileText, color: 'text-green-400' },
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
    onDelete
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
    const [content, setContent] = useState(lessonContent);
    const [duration, setDuration] = useState(lessonDuration);
    const [quizData, setQuizData] = useState<QuizData | undefined>(lessonQuizData);

    // Video source selection
    const [videoSource, setVideoSource] = useState<VideoSourceType>('url');
    const [isUploading, setIsUploading] = useState(false);

    // Transcript generation
    const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);

    // Reset form when panel opens
    useEffect(() => {
        if (isOpen) {
            setTitle(lessonTitle);
            setType(lessonType);
            setVideoUrl(lessonVideoUrl);
            setContent(lessonContent);
            setDuration(lessonDuration);
            setQuizData(lessonQuizData);
            setError(null);
            setShowDeleteConfirm(false);
            setIsUploading(false);
            setIsGeneratingTranscript(false);
            setShowTranscriptModal(false);
            setOriginalVideoUrl(lessonVideoUrl); // Track original video URL for change detection
        }
    }, [isOpen, lessonTitle, lessonType, lessonVideoUrl, lessonContent, lessonDuration, lessonQuizData]);

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
                setContent(result.transcript);
            } else {
                setError(result.error || 'Failed to generate transcript');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while generating the transcript');
        } finally {
            setIsGeneratingTranscript(false);
        }
    }, [videoUrl]);

    const handleUploadSuccess = useCallback((uploadId: string) => {
        setVideoUrl(uploadId);
        setIsUploading(false);
    }, []);

    // Check if transcript has meaningful content (not just whitespace or short text)
    const hasValidTranscript = useCallback((text: string) => {
        return text.trim().length >= 10;
    }, []);

    // Check if video URL has changed
    const hasVideoUrlChanged = useCallback(() => {
        return videoUrl !== originalVideoUrl && originalVideoUrl !== '';
    }, [videoUrl, originalVideoUrl]);

    // Perform the actual save operation
    const performSave = useCallback((contentToSave?: string) => {
        setError(null);
        startTransition(async () => {
            const finalContent = contentToSave !== undefined ? contentToSave : content;
            let result;
            if (isNewLesson) {
                result = await createExpertLesson(moduleId, courseId, {
                    title: title.trim(),
                    type,
                    video_url: type === 'video' ? videoUrl : undefined,
                    content: finalContent || undefined,
                    duration: duration || undefined,
                    quiz_data: type === 'quiz' ? quizData : undefined
                });
            } else if (lessonId) {
                result = await updateExpertLesson(lessonId, courseId, {
                    title: title.trim(),
                    video_url: type === 'video' ? videoUrl : undefined,
                    content: finalContent || undefined,
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
    }, [moduleId, courseId, lessonId, title, type, videoUrl, content, duration, quizData, isNewLesson, onSave]);

    const handleSave = useCallback(() => {
        if (!title.trim()) {
            setError('Lesson title is required');
            return;
        }

        // For video lessons, check transcript requirements
        if (type === 'video') {
            const transcriptExists = hasValidTranscript(content);
            const videoChanged = hasVideoUrlChanged();

            // Case 1: No valid transcript - prompt to add one
            if (!transcriptExists && videoUrl) {
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
    }, [title, type, content, videoUrl, hasValidTranscript, hasVideoUrlChanged, performSave]);

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
                        setContent(transcriptResult.transcript);
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

    const TypeIcon = LESSON_TYPES.find(t => t.value === type)?.icon || Video;

    return (
        <DropdownPanel
            isOpen={isOpen}
            onClose={onClose}
            title={isNewLesson ? 'Add New Lesson' : 'Edit Lesson'}
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
                        Lesson Title *
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

                {/* Lesson Type */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Lesson Type
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
                                onClick={() => setVideoSource('url')}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    videoSource === 'url'
                                        ? 'bg-brand-blue-light/20 text-brand-blue-light'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Link2 size={14} />
                                URL / Mux ID
                            </button>
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
                        </div>

                        {/* URL Input */}
                        {videoSource === 'url' && (
                            <div>
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                    <Link2 size={16} className="text-slate-400" />
                                    <input
                                        type="text"
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        placeholder="Mux Playback ID or Google Drive URL"
                                        className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                                    />
                                </div>
                                <p className="text-xs text-slate-600 mt-2">
                                    Enter a Mux Playback ID (e.g., abc123xyz) or a Google Drive video URL
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

                {/* Transcript / Content - Only show for video and article types */}
                {type !== 'quiz' && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {type === 'video' ? 'Transcript / Script' : 'Article Content'}
                            </label>

                            {/* Generate from Video button - only show for video type with a video URL */}
                            {type === 'video' && videoUrl && (
                                <button
                                    type="button"
                                    onClick={handleGenerateTranscript}
                                    disabled={isGeneratingTranscript || isPending}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGeneratingTranscript ? (
                                        <>
                                            <Loader2 size={12} className="animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={12} />
                                            Generate from Video
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

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
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={
                                type === 'video'
                                    ? 'Paste video transcript here for AI search and summarization...'
                                    : 'Write the article content...'
                            }
                            rows={6}
                            disabled={isGeneratingTranscript}
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none resize-none focus:border-brand-blue-light/50 disabled:opacity-50"
                        />
                        {type === 'video' && (
                            <p className="text-xs text-slate-600 mt-2">
                                Transcripts enable AI-powered search and help learners get answers about lesson content.
                            </p>
                        )}
                    </div>
                )}

                {/* Duration */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Duration
                    </label>
                    <input
                        type="text"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="e.g., 10 Min"
                        className="w-48 p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none focus:border-brand-blue-light/50"
                    />
                </div>

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
                                            This will permanently delete the lesson.
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
                isGenerating={isPending}
            />
        </DropdownPanel>
    );
}
