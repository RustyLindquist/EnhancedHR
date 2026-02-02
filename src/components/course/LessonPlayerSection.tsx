'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Bookmark, Monitor, Lock, Play } from 'lucide-react';
import MuxPlayer from '@mux/mux-player-react';
import { Lesson, Course, DragItem } from '../../types';
import { useTrialTracker } from '../../hooks/useTrialTracker';
import AssessmentPlaceholder from '../assessment/AssessmentPlaceholder';

// TypeScript declaration for YouTube IFrame API
declare global {
    interface Window {
        YT: {
            Player: new (elementId: string, options: {
                videoId: string;
                playerVars?: Record<string, number | string>;
                events?: {
                    onReady?: (event: { target: any }) => void;
                    onStateChange?: (event: { data: number }) => void;
                    onError?: (event: { data: number }) => void;
                };
            }) => {
                playVideo: () => void;
                pauseVideo: () => void;
                mute: () => void;
                unMute: () => void;
                destroy: () => void;
                getPlayerState: () => number;
            };
            PlayerState: {
                UNSTARTED: -1;
                ENDED: 0;
                PLAYING: 1;
                PAUSED: 2;
                BUFFERING: 3;
                CUED: 5;
            };
        };
        onYouTubeIframeAPIReady?: () => void;
    }
}

// Check if URL is a YouTube URL (client-side check)
function isYouTubeUrl(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

// Extract YouTube video ID from URL
function extractYouTubeVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

interface LessonPlayerSectionProps {
    lesson: Lesson;
    lessonNumber: string;
    course: Course;
    onLessonComplete: (lessonId: string) => void;
    onNextLesson: () => void;
    onPreviousLesson: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
    onAskPrometheus: (prompt: string) => void;
    onAddToCollection: (item: DragItem) => void;
    userId: string;
    // Assessment panel props
    onStartAssessment?: () => void;
    hasAssessmentProgress?: boolean;
    // Auto-play props
    autoPlay?: boolean;
    onAutoPlayConsumed?: () => void;
}

const LessonPlayerSection: React.FC<LessonPlayerSectionProps> = ({
    lesson,
    lessonNumber,
    course,
    onLessonComplete,
    onNextLesson,
    onPreviousLesson,
    hasNext,
    hasPrevious,
    onAskPrometheus,
    onAddToCollection,
    userId,
    onStartAssessment,
    hasAssessmentProgress = false,
    autoPlay = false,
    onAutoPlayConsumed
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [showPlayOverlay, setShowPlayOverlay] = useState(true);
    const playerRef = useRef<any>(null);

    // YouTube Player ref for programmatic control
    const youtubePlayerRef = useRef<any>(null);
    const [youtubeReady, setYoutubeReady] = useState(false);
    const autoPlayPendingRef = useRef(false);

    // Trial tracking
    const { minutesRemaining, isLocked, isLoading: isAuthLoading } = useTrialTracker(isPlaying);

    const isQuiz = lesson.type === 'quiz';

    const handleTimeUpdate = useCallback((e: any) => {
        setCurrentTime(e.target.currentTime);
    }, []);

    const handleVideoEnded = useCallback(() => {
        setIsPlaying(false);
        setShowPlayOverlay(true);
        onLessonComplete(lesson.id);
        // Auto-advance to next lesson after completion
        if (hasNext) {
            setTimeout(() => {
                onNextLesson();
            }, 1500);
        }
    }, [lesson.id, onLessonComplete, hasNext, onNextLesson]);

    const handlePlay = useCallback(() => {
        setIsPlaying(true);
        setShowPlayOverlay(false);
    }, []);

    const handlePause = useCallback(() => {
        setIsPlaying(false);
    }, []);

    const handleAsk = () => {
        const prompt = `Explain the main points of lesson "${lesson.title}" from ${course.title} in more detail. What are the key takeaways and concepts I should understand?`;
        onAskPrometheus(prompt);
    };

    const handleSave = () => {
        const dragItem: DragItem = {
            type: 'LESSON',
            id: lesson.id,
            title: lesson.title,
            subtitle: course.title,
            meta: lesson.duration
        };
        onAddToCollection(dragItem);
    };

    // Handle play overlay click - works for both YouTube and Mux
    const handlePlayOverlayClick = useCallback(() => {
        const isYouTube = lesson?.video_url && isYouTubeUrl(lesson.video_url);

        if (isYouTube && youtubePlayerRef.current) {
            youtubePlayerRef.current.playVideo();
        } else if (playerRef.current && typeof playerRef.current.play === 'function') {
            playerRef.current.play();
        }

        setShowPlayOverlay(false);
        setIsPlaying(true);
    }, [lesson?.video_url]);

    // Reset video error and show overlay when lesson changes
    useEffect(() => {
        setVideoError(false);
        setShowPlayOverlay(true);
        setIsPlaying(false);
        setYoutubeReady(false);
    }, [lesson.id]);

    // Load YouTube IFrame API
    useEffect(() => {
        // Check if already loaded
        if (window.YT && window.YT.Player) {
            return;
        }

        // Check if script tag already exists
        if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }
    }, []);

    // Initialize YouTube player when the container is ready
    useEffect(() => {
        const videoUrl = lesson?.video_url;
        const isYouTube = videoUrl && isYouTubeUrl(videoUrl);
        const youtubeId = isYouTube ? extractYouTubeVideoId(videoUrl) : null;

        if (!isYouTube || !youtubeId) {
            // Clean up if switching away from YouTube
            if (youtubePlayerRef.current) {
                try {
                    youtubePlayerRef.current.destroy();
                } catch (e) {
                    // Player may already be destroyed
                }
                youtubePlayerRef.current = null;
            }
            setYoutubeReady(false);
            return;
        }

        // Wait for YT API to be ready
        const initPlayer = () => {
            if (!window.YT || !window.YT.Player) {
                // API not loaded yet, retry
                setTimeout(initPlayer, 100);
                return;
            }

            // Check if container element exists
            const containerId = `youtube-player-${lesson.id}`;
            const containerElement = document.getElementById(containerId);
            if (!containerElement) {
                // Container not rendered yet, retry
                setTimeout(initPlayer, 100);
                return;
            }

            // Destroy existing player if any
            if (youtubePlayerRef.current) {
                try {
                    youtubePlayerRef.current.destroy();
                } catch (e) {
                    // Player may already be destroyed
                }
                youtubePlayerRef.current = null;
            }

            youtubePlayerRef.current = new window.YT.Player(containerId, {
                videoId: youtubeId,
                playerVars: {
                    autoplay: 0,
                    rel: 0,
                    modestbranding: 1,
                    enablejsapi: 1,
                    origin: window.location.origin,
                    playsinline: 1,
                },
                events: {
                    onReady: () => {
                        setYoutubeReady(true);
                        // For YouTube, we don't auto-play (user finds muted autoplay annoying)
                        // Just consume the flag if it was set
                        if (autoPlayPendingRef.current) {
                            autoPlayPendingRef.current = false;
                            onAutoPlayConsumed?.();
                        }
                    },
                    onStateChange: (event: { data: number }) => {
                        // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
                        if (event.data === 1) { // Playing
                            setIsPlaying(true);
                            setShowPlayOverlay(false);
                        } else if (event.data === 2) { // Paused
                            setIsPlaying(false);
                        } else if (event.data === 0) { // Ended
                            handleVideoEnded();
                        }
                    },
                    onError: (event: { data: number }) => {
                        console.error('YouTube Player Error:', event.data);
                        setVideoError(true);
                    },
                },
            });
        };

        // Small delay to ensure DOM is ready
        const timer = setTimeout(initPlayer, 50);

        return () => {
            clearTimeout(timer);
            if (youtubePlayerRef.current) {
                try {
                    youtubePlayerRef.current.destroy();
                } catch (e) {
                    // Player may already be destroyed
                }
                youtubePlayerRef.current = null;
            }
            setYoutubeReady(false);
        };
    }, [lesson?.id, lesson?.video_url, handleVideoEnded, onAutoPlayConsumed]);

    // Handle auto-play when lesson changes and autoPlay is enabled
    useEffect(() => {
        if (!autoPlay || isQuiz || !lesson?.video_url) {
            if (autoPlay) onAutoPlayConsumed?.();
            return;
        }

        const isYouTube = isYouTubeUrl(lesson.video_url);

        if (isYouTube) {
            // For YouTube videos: NO auto-play (users find muted autoplay annoying)
            // Auto-progression still works via handleVideoEnded -> onNextLesson
            // Just consume the autoPlay flag without starting playback
            if (youtubeReady) {
                onAutoPlayConsumed?.();
            } else {
                // Player not ready yet, set flag for onReady callback to consume
                autoPlayPendingRef.current = true;
            }
            return;
        }

        // For Mux player: Auto-play WITH volume (not muted)
        const timer = setTimeout(() => {
            setShowPlayOverlay(false);
            setIsPlaying(true);
            if (playerRef.current && typeof playerRef.current.play === 'function') {
                playerRef.current.play().catch((err: Error) => {
                    // Browser may block autoplay - this is expected behavior
                    // User will need to click play manually
                    console.log('Autoplay was prevented by browser:', err.message);
                    setShowPlayOverlay(true);
                    setIsPlaying(false);
                });
            }
            onAutoPlayConsumed?.();
        }, 100);

        return () => clearTimeout(timer);
    }, [lesson?.id, autoPlay, lesson?.video_url, isQuiz, youtubeReady, onAutoPlayConsumed]);

    // Get instructor data from course authorDetails or fallback to basic info
    const authorDetails = (course as any).authorDetails;
    const instructor = {
        name: authorDetails?.name || course.author || 'Expert',
        credentials: authorDetails?.credentials || null,
        avatar: authorDetails?.avatar || '/images/default-avatar.png'
    };

    return (
        <div className="relative animate-fade-in">
            {/* Video Player Container */}
            <div className="relative">
                {/* Video/Quiz Container */}
                <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-white/5">
                    {isQuiz && lesson.quiz_data ? (
                        <AssessmentPlaceholder
                            lessonTitle={lesson.title}
                            hasProgress={hasAssessmentProgress}
                            onStartAssessment={onStartAssessment || (() => {})}
                        />
                    ) : lesson.video_url && !isLocked ? (
                        <>
                            {/* Play button overlay - show for both YouTube and Mux */}
                            {showPlayOverlay && !videoError && (
                                <div
                                    className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900/80 to-slate-800/80 z-20 cursor-pointer"
                                    onClick={handlePlayOverlayClick}
                                >
                                    <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center hover:bg-white/20 hover:border-white/50 hover:scale-105 transition-all duration-300 shadow-2xl backdrop-blur-sm">
                                        <Play size={32} className="text-white ml-1" fill="currentColor" />
                                    </div>
                                </div>
                            )}
                            {videoError ? (
                                // Error State
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-50">
                                    <div className="text-brand-red mb-4">
                                        <Monitor size={48} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Video Playback Error</h3>
                                    <p className="text-slate-400 mb-6 text-center max-w-md">
                                        We encountered an issue playing this video. Please check your connection or try again.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setVideoError(false);
                                            if (playerRef.current) {
                                                playerRef.current.load();
                                            }
                                        }}
                                        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold transition-colors"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : (
                                (() => {
                                    const isYouTube = isYouTubeUrl(lesson.video_url);
                                    const youtubeId = isYouTube ? extractYouTubeVideoId(lesson.video_url) : null;

                                    if (isYouTube && youtubeId) {
                                        return (
                                            <div
                                                id={`youtube-player-${lesson.id}`}
                                                className="w-full h-full"
                                            />
                                        );
                                    }

                                    return (
                                        <MuxPlayer
                                            ref={playerRef}
                                            streamType="on-demand"
                                            playbackId={!lesson.video_url.startsWith('http') ? lesson.video_url : undefined}
                                            src={lesson.video_url.startsWith('http') ? lesson.video_url : undefined}
                                            autoPlay={isPlaying}
                                            metadata={{
                                                video_id: lesson.id,
                                                video_title: lesson.title,
                                                viewer_user_id: userId,
                                            }}
                                            renditionOrder="desc"
                                            primaryColor="#78C0F0"
                                            secondaryColor="#000000"
                                            accentColor="#FF9300"
                                            className="w-full h-full"
                                            onTimeUpdate={handleTimeUpdate}
                                            onPlay={handlePlay}
                                            onPause={handlePause}
                                            onEnded={handleVideoEnded}
                                            onError={(err) => {
                                                console.error("MuxPlayer Error:", err);
                                                setVideoError(true);
                                            }}
                                        />
                                    );
                                })()
                            )}
                        </>
                    ) : isLocked ? (
                        // Trial Locked State
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md z-50">
                            <Lock size={48} className="text-brand-red mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">Trial Ended</h2>
                            <p className="text-slate-400 mb-6 max-w-md text-center">
                                You've used your 60 minutes of free trial access. Upgrade to a full membership to continue learning.
                            </p>
                            <button className="bg-brand-orange text-white px-8 py-3 rounded-full font-bold uppercase tracking-wider hover:bg-brand-orange/90 transition-all shadow-lg hover:scale-105">
                                Upgrade Now
                            </button>
                        </div>
                    ) : (
                        // No Content State - with play button
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                            <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center mb-4">
                                <Play size={32} className="text-white/50 ml-1" />
                            </div>
                            <p className="text-slate-400 mb-2">Video content loading...</p>
                            <p className="text-xs text-slate-600">Lesson: {lesson.title}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Lesson Info Bar with Navigation */}
            <div className="mt-4 flex items-center gap-4">
                {/* Previous Lesson Arrow */}
                <button
                    onClick={onPreviousLesson}
                    disabled={!hasPrevious}
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        hasPrevious
                            ? 'bg-white/[0.05] border border-white/20 text-white hover:bg-white/10 hover:border-white/40 hover:scale-105'
                            : 'bg-white/[0.02] border border-white/5 text-slate-600 cursor-not-allowed'
                    }`}
                    aria-label="Previous lesson"
                >
                    <ChevronLeft size={24} />
                </button>

                {/* Lesson Info Container */}
                <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm">
                    {/* Left: Lesson Info */}
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-0.5">
                                <span className="text-[10px] font-bold tracking-wider text-brand-blue-light uppercase">
                                    LESSON {lessonNumber}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                    {lesson.duration}
                                </span>
                            </div>
                            <h2 className="text-base font-bold text-white truncate">
                                {lesson.title || 'Active Lesson Title Goes Here'}
                            </h2>
                        </div>
                    </div>

                    {/* Right: Instructor + Actions */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Author Avatar & Name */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-700 border border-white/10 overflow-hidden flex-shrink-0">
                                <img
                                    src={instructor.avatar}
                                    alt={instructor.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-semibold text-white">{instructor.name}</p>
                                {instructor.credentials && (
                                    <p className="text-[9px] text-slate-500 uppercase tracking-wider line-clamp-1">{instructor.credentials}</p>
                                )}
                            </div>
                        </div>

                        <div className="h-6 w-px bg-white/10" />

                        {/* Ask Button */}
                        <button
                            onClick={handleAsk}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-blue-light/10 hover:bg-brand-blue-light/20 border border-brand-blue-light/30 text-brand-blue-light text-[10px] font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_12px_rgba(120,192,240,0.2)]"
                        >
                            <Sparkles size={12} />
                            ASK
                        </button>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/20 text-slate-300 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                            <Bookmark size={12} />
                            SAVE
                        </button>
                    </div>
                </div>

                {/* Next Lesson Arrow */}
                <button
                    onClick={onNextLesson}
                    disabled={!hasNext}
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        hasNext
                            ? 'bg-white/[0.05] border border-white/20 text-white hover:bg-white/10 hover:border-white/40 hover:scale-105'
                            : 'bg-white/[0.02] border border-white/5 text-slate-600 cursor-not-allowed'
                    }`}
                    aria-label="Next lesson"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Trial Time Indicator */}
            {!isAuthLoading && !isLocked && minutesRemaining < 30 && (
                <div className="mt-3 flex items-center justify-center">
                    <div className={`px-4 py-2 rounded-full text-xs font-bold ${minutesRemaining < 10 ? 'bg-brand-red/20 text-brand-red animate-pulse' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                        {minutesRemaining} minutes remaining in trial
                    </div>
                </div>
            )}
        </div>
    );
};

export default LessonPlayerSection;
