'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Bookmark, Monitor, Lock, Play } from 'lucide-react';
import MuxPlayer from '@mux/mux-player-react';
import { Lesson, Course, DragItem } from '../../types';
import { useTrialTracker } from '../../hooks/useTrialTracker';
import QuizPlayer from '../QuizPlayer';

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
    userId
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [showPlayOverlay, setShowPlayOverlay] = useState(true);
    const playerRef = useRef<any>(null);

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

    const handleQuizComplete = (score: number, passed: boolean) => {
        if (passed) {
            onLessonComplete(lesson.id);
        }
    };

    // Reset video error and show overlay when lesson changes
    React.useEffect(() => {
        setVideoError(false);
        setShowPlayOverlay(true);
    }, [lesson.id]);

    // Mock instructor data
    const instructor = {
        name: course.author || 'Rusty Lindquist',
        title: 'CEO | HR Engineering',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    };

    return (
        <div className="relative animate-fade-in">
            {/* Video Player Container */}
            <div className="relative">
                {/* Navigation Arrows - Positioned outside video */}
                {hasPrevious && (
                    <button
                        onClick={onPreviousLesson}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 w-10 h-10 rounded-full bg-brand-black/90 border border-white/20 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/40 transition-all shadow-xl backdrop-blur-sm"
                        aria-label="Previous lesson"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}
                {hasNext && (
                    <button
                        onClick={onNextLesson}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-30 w-10 h-10 rounded-full bg-brand-black/90 border border-white/20 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/40 transition-all shadow-xl backdrop-blur-sm"
                        aria-label="Next lesson"
                    >
                        <ChevronRight size={20} />
                    </button>
                )}

                {/* Video/Quiz Container */}
                <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-white/5">
                    {isQuiz && lesson.quiz_data ? (
                        <QuizPlayer
                            lessonId={lesson.id}
                            quizData={lesson.quiz_data}
                            onComplete={handleQuizComplete}
                        />
                    ) : lesson.video_url && !isLocked ? (
                        <>
                            {/* Play button overlay */}
                            {showPlayOverlay && !videoError && (
                                <div
                                    className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900/80 to-slate-800/80 z-20 cursor-pointer"
                                    onClick={() => {
                                        setShowPlayOverlay(false);
                                        if (playerRef.current) {
                                            playerRef.current.play();
                                        }
                                    }}
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
                                <MuxPlayer
                                    ref={playerRef}
                                    streamType="on-demand"
                                    playbackId={!lesson.video_url.startsWith('http') ? lesson.video_url : undefined}
                                    src={lesson.video_url.startsWith('http') ? lesson.video_url : undefined}
                                    metadata={{
                                        video_id: lesson.id,
                                        video_title: lesson.title,
                                        viewer_user_id: userId,
                                    }}
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

            {/* Lesson Info Bar */}
            <div className="mt-4 bg-white/[0.03] border border-white/10 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm">
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
                            <p className="text-[9px] text-slate-500 uppercase tracking-wider">{instructor.title}</p>
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
