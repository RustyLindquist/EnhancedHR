import React, { useState, useEffect } from 'react';
import { ChevronLeft, Volume2, Maximize, FileText, Download, CheckCircle, Lock, ChevronDown, ChevronRight, Monitor, Folder, MessageSquare, Plus, Bookmark, AlignLeft, LayoutGrid, List, Play, FileQuestion } from 'lucide-react';
import MuxPlayer from '@mux/mux-player-react';
import { Course, Module, Resource } from '../types';
import AIPanel from './AIPanel';
import SmartTranscript from './SmartTranscript';
import { useTrialTracker } from '@/hooks/useTrialTracker';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { useRouter } from 'next/navigation';
import QuizPlayer from './QuizPlayer';

interface CoursePlayerProps {
    course: Course;
    syllabus: Module[];
    resources: Resource[];
    onBack: () => void;
    initialLessonId?: string;
    initialModuleId?: string;
    userId: string;
}

const CoursePlayer: React.FC<CoursePlayerProps> = ({ course, syllabus, resources, onBack, initialLessonId, initialModuleId, userId }) => {
    const [activeModuleId, setActiveModuleId] = useState<string>(initialModuleId || syllabus[0]?.id || '');
    const [activeLessonId, setActiveLessonId] = useState<string>(initialLessonId || syllabus[0]?.lessons[0]?.id || '');
    const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const playerRef = React.useRef<any>(null);
    const router = useRouter();

    // Progress Tracker
    const { markLessonComplete, updateLastAccessed } = useCourseProgress(userId, course.id);

    // Trial Tracker
    const { minutesRemaining, isLocked, isLoading: isAuthLoading } = useTrialTracker(isPlaying);

    // Find current active lesson
    const currentModule = syllabus.find(m => m.id === activeModuleId);
    const currentLesson = currentModule?.lessons.find(l => l.id === activeLessonId);

    // Update last accessed when lesson changes
    React.useEffect(() => {
        if (activeLessonId) {
            updateLastAccessed(activeLessonId);
            setVideoError(false);
        }
    }, [activeLessonId]);

    // Local state for completion (initialized from props)
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => {
        const completed = new Set<string>();
        syllabus.forEach(m => m.lessons.forEach(l => {
            if (l.isCompleted) completed.add(l.id);
        }));
        return completed;
    });

    // Toggle Module Expansion
    const [expandedModules, setExpandedModules] = useState<string[]>([syllabus[0]?.id || '']);
    const toggleModule = (modId: string) => {
        setExpandedModules(prev =>
            prev.includes(modId) ? prev.filter(id => id !== modId) : [...prev, modId]
        );
    };

    // View Mode State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Load view preference from localStorage on mount
    useEffect(() => {
        const savedViewMode = localStorage.getItem('enhancedhr-preferred-view-mode');
        if (savedViewMode === 'list' || savedViewMode === 'grid') {
            setViewMode(savedViewMode);
        }
    }, []);

    // Handle view mode change and persist to localStorage
    const handleViewModeChange = (mode: 'grid' | 'list') => {
        localStorage.setItem('enhancedhr-preferred-view-mode', mode);
        setViewMode(mode);
    };

    const handleTimeUpdate = (e: any) => {
        setCurrentTime(e.target.currentTime);
    };

    const handleSeek = (time: number) => {
        if (playerRef.current) {
            playerRef.current.currentTime = time;
        }
    };

    return (
        <div className="flex h-full w-full text-white overflow-hidden relative">

            {/* --- MAIN CONTENT AREA (Scrollable) --- */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar relative z-10">

                {/* Header / Breadcrumbs */}
                <div className="h-24 flex items-center justify-between px-8 border-b border-white/5 bg-[#051114]/80 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div>
                            <p className="text-xs text-brand-blue-light font-bold uppercase tracking-wider mb-0.5">{currentModule?.title || 'Module Title'}</p>
                            <h1 className="text-lg font-bold text-white">{currentLesson?.title || 'Lesson Title'}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        {!isAuthLoading && (
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span className={`${minutesRemaining < 10 ? 'text-brand-red animate-pulse' : 'text-white'} font-bold`}>
                                    {isLocked ? 'Trial Expired' : `${minutesRemaining}m Left in Trial`}
                                </span>
                            </div>
                        )}
                        <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="w-[35%] h-full bg-brand-blue-light rounded-full"></div>
                        </div>
                        <button className="px-4 py-1.5 bg-brand-blue-light/10 border border-brand-blue-light/20 text-brand-blue-light text-xs font-bold rounded-full hover:bg-brand-blue-light hover:text-brand-black transition-all">
                            RESUME
                        </button>
                    </div>
                </div>



                {/* Video Player / Quiz Container */}
                <div className="w-full max-w-6xl mx-auto p-8">
                    <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative group shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10">
                        {currentLesson?.type === 'quiz' && currentLesson.quiz_data ? (
                            <QuizPlayer
                                lessonId={currentLesson.id}
                                quizData={currentLesson.quiz_data}
                                onComplete={(score, passed) => {
                                    console.log('Quiz Completed', score, passed);
                                    if (passed) {
                                        markLessonComplete(currentLesson.id);
                                        setCompletedLessons(prev => new Set(prev).add(currentLesson.id));
                                    }
                                }}
                            />
                        ) : currentLesson?.video_url && !isLocked ? (
                            videoError ? (
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
                                    playbackId={!currentLesson.video_url.startsWith('http') ? currentLesson.video_url : undefined}
                                    src={currentLesson.video_url.startsWith('http') ? currentLesson.video_url : undefined}
                                    metadata={{
                                        video_id: currentLesson.id,
                                        video_title: currentLesson.title,
                                        viewer_user_id: userId,
                                    }}
                                    renditionOrder="desc"
                                    primaryColor="#78C0F0"
                                    secondaryColor="#000000"
                                    accentColor="#FF9300"
                                    className="w-full h-full"
                                    onTimeUpdate={handleTimeUpdate}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    onEnded={() => {
                                        setIsPlaying(false);
                                        markLessonComplete(currentLesson.id);
                                        // Update local state for immediate UI feedback
                                        setCompletedLessons(prev => new Set(prev).add(currentLesson.id));
                                    }}
                                    onError={(err) => {
                                        console.error("MuxPlayer Error:", err);
                                        setVideoError(true);
                                    }}
                                />
                            )
                        ) : isLocked ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md z-50">
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
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                <div className="text-center">
                                    <p className="text-slate-400 mb-2">No content available</p>
                                    <p className="text-xs text-slate-600">Lesson ID: {currentLesson?.id}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Lesson Info Bar */}
                <div className="max-w-6xl mx-auto px-8 w-full mb-8">
                    <div className="bg-[#0f172a]/50 border border-white/10 rounded-xl p-6 flex items-center justify-between backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-brand-blue-light uppercase tracking-wider mb-1">Lesson 1.3 • 7 Min</span>
                                <h2 className="text-xl font-bold text-white">{currentLesson?.title || 'Active Lesson Title'}</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-700 border border-white/10 overflow-hidden">
                                    {/* Author Avatar Mock */}
                                    <div className="w-full h-full bg-slate-600 flex items-center justify-center text-xs font-bold">RL</div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-white">{course.author}</p>
                                    <p className="text-xs text-slate-400">Expert</p>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-white/10 mx-2"></div>
                            <button
                                onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-xs font-bold uppercase tracking-wider ${isTranscriptOpen ? 'bg-brand-blue-light text-brand-black border-brand-blue-light' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                            >
                                <AlignLeft size={14} /> Transcript
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs font-bold uppercase tracking-wider">
                                <MessageSquare size={14} /> Ask
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs font-bold uppercase tracking-wider">
                                <Plus size={14} /> Save
                            </button>
                        </div>
                    </div>
                </div>

                {/* Transcript Section (Collapsible) */}
                {isTranscriptOpen && (
                    <div className="max-w-6xl mx-auto px-8 w-full mb-12 h-96 animate-fade-in">
                        <SmartTranscript
                            currentTime={currentTime}
                            onSeek={handleSeek}
                        />
                    </div>
                )}

                {/* Course Modules Section Divider */}
                <div className="max-w-6xl mx-auto px-8 w-full mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-brand-blue-light uppercase tracking-wider">Course Modules</span>
                            <div className="h-px w-32 bg-white/10"></div>
                        </div>
                        {/* View Toggle */}
                        <div className="flex items-center gap-0.5 p-1 bg-black/40 border border-white/10 rounded-lg">
                            <button
                                onClick={() => handleViewModeChange('grid')}
                                className={`p-1.5 rounded-md transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-white/20 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                                title="Card View"
                            >
                                <LayoutGrid size={14} />
                            </button>
                            <button
                                onClick={() => handleViewModeChange('list')}
                                className={`p-1.5 rounded-md transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-white/20 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                                title="List View"
                            >
                                <List size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Syllabus Accordion */}
                <div className="max-w-6xl mx-auto px-8 w-full pb-20 space-y-4">
                    {syllabus.map((module, index) => {
                        const isExpanded = expandedModules.includes(module.id);
                        return (
                            <div key={module.id} className="border border-white/5 rounded-xl bg-[#0f172a]/30 overflow-hidden">
                                {/* Module Header */}
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                    onClick={() => toggleModule(module.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${isExpanded ? 'bg-white/10 text-white' : 'bg-transparent text-slate-500'}`}>
                                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </div>
                                        <h3 className="text-base font-bold text-white">{index + 1}. {module.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="px-3 py-1.5 rounded bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5">
                                            <MessageSquare size={12} /> Ask
                                        </button>
                                        <button className="px-3 py-1.5 rounded bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5">
                                            <Plus size={12} /> Save Module
                                        </button>
                                    </div>
                                </div>

                                {/* Lessons Grid or List */}
                                {isExpanded && (
                                    viewMode === 'grid' ? (
                                        <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {module.lessons.map((lesson) => {
                                                const isActive = lesson.id === activeLessonId;
                                                return (
                                                    <div
                                                        key={lesson.id}
                                                        onClick={() => {
                                                            setActiveModuleId(module.id);
                                                            setActiveLessonId(lesson.id);
                                                        }}
                                                        className={`
                                                    relative p-5 rounded-xl border transition-all duration-300 cursor-pointer group
                                                    ${isActive
                                                                ? 'bg-brand-blue-light/5 border-brand-blue-light/50 shadow-[0_0_20px_rgba(120,192,240,0.1)]'
                                                                : 'bg-[#0f172a]/40 border-white/5 hover:border-white/10 hover:bg-[#0f172a]/60'}
                                                `}
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-brand-blue-light' : 'text-brand-blue-light'}`}>
                                                                Lesson {index + 1}.{module.lessons.indexOf(lesson) + 1}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                {completedLessons.has(lesson.id) && <CheckCircle size={12} className="text-green-400" />}
                                                                <span className="text-[10px] text-slate-500">{lesson.duration}</span>
                                                            </div>
                                                        </div>

                                                        <h4 className={`text-sm font-bold mb-4 line-clamp-2 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                                            {lesson.title}
                                                        </h4>

                                                        <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                                                            Lesson title goes here, and will wrap as necessary...
                                                        </p>

                                                        {isActive && (
                                                            <div className="absolute bottom-4 right-4 text-[10px] font-bold text-brand-blue-light uppercase tracking-wider animate-pulse">
                                                                Now Playing
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                                                <Download size={12} />
                                                            </button>
                                                            <button className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                                                <Plus size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Quiz Card Mock */}
                                            <div className="p-5 rounded-xl border border-brand-orange/20 bg-brand-orange/5 hover:bg-brand-orange/10 transition-colors cursor-pointer group">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                                                        Quiz
                                                    </span>
                                                </div>
                                                <h4 className="text-sm font-bold text-brand-orange mb-2">
                                                    Module Assessment
                                                </h4>
                                                <p className="text-xs text-slate-400">
                                                    The quiz, assessment or the activity title will go here.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        /* List View */
                                        <div className="p-4 pt-0 flex flex-col gap-2">
                                            {module.lessons.map((lesson) => {
                                                const isActive = lesson.id === activeLessonId;
                                                const lessonIndex = module.lessons.indexOf(lesson) + 1;
                                                const glowColor = isActive ? 'rgba(120, 192, 240, 0.6)' : 'rgba(120, 192, 240, 0.4)';
                                                return (
                                                    <div
                                                        key={lesson.id}
                                                        onClick={() => {
                                                            setActiveModuleId(module.id);
                                                            setActiveLessonId(lesson.id);
                                                        }}
                                                        className={`group relative flex items-center gap-4 px-4 py-3
                                                            ${isActive
                                                                ? 'bg-brand-blue-light/10 border-brand-blue-light/50'
                                                                : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.06] hover:border-white/20'}
                                                            border rounded-xl transition-all duration-300 cursor-pointer overflow-hidden`}
                                                        style={{
                                                            borderLeftWidth: '3px',
                                                            borderLeftColor: isActive ? 'rgb(120, 192, 240)' : glowColor,
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isActive) {
                                                                e.currentTarget.style.boxShadow = `0 0 20px ${glowColor}30, 0 0 40px ${glowColor}15, inset 0 0 20px ${glowColor}08`;
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!isActive) {
                                                                e.currentTarget.style.boxShadow = 'none';
                                                            }
                                                        }}
                                                    >
                                                        {/* Subtle gradient overlay on hover */}
                                                        <div
                                                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[10px]"
                                                            style={{
                                                                background: `linear-gradient(135deg, ${glowColor}08 0%, transparent 50%)`
                                                            }}
                                                        />

                                                        {/* Icon */}
                                                        <div
                                                            className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                                                                transition-transform duration-200 group-hover:scale-105
                                                                ${isActive ? 'bg-brand-blue-light/20' : 'bg-brand-blue-light/10'}`}
                                                        >
                                                            <Play size={16} className={`${isActive ? 'text-brand-blue-light' : 'text-brand-blue-light/70'}`} />
                                                        </div>

                                                        {/* Separator */}
                                                        <div className="w-px h-8 bg-white/10 flex-shrink-0" />

                                                        {/* Main Content */}
                                                        <div className="flex-1 min-w-0 relative z-10">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-blue-light">
                                                                    Lesson {index + 1}.{lessonIndex}
                                                                </span>
                                                                {completedLessons.has(lesson.id) && (
                                                                    <CheckCircle size={12} className="text-green-400" />
                                                                )}
                                                                {isActive && (
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-brand-blue-light animate-pulse">
                                                                        Now Playing
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-white group-hover:text-brand-blue-light'} transition-colors`}>
                                                                {lesson.title}
                                                            </h4>
                                                        </div>

                                                        {/* Right section */}
                                                        <div className="flex items-center gap-4 flex-shrink-0 relative z-10">
                                                            {/* Duration */}
                                                            <span className="text-[11px] text-slate-500 hidden sm:block">
                                                                {lesson.duration}
                                                            </span>

                                                            <div className="w-px h-8 bg-white/10 flex-shrink-0 hidden sm:block" />

                                                            {/* Action buttons */}
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); }}
                                                                    className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                                                >
                                                                    <Download size={12} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); }}
                                                                    className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                                                >
                                                                    <Plus size={12} />
                                                                </button>
                                                            </div>

                                                            <ChevronRight size={16} className="text-slate-600 ml-1" />
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Quiz List Item */}
                                            <div
                                                className="group relative flex items-center gap-4 px-4 py-3
                                                    bg-brand-orange/5 hover:bg-brand-orange/10
                                                    border border-brand-orange/20 hover:border-brand-orange/40
                                                    rounded-xl transition-all duration-300 cursor-pointer overflow-hidden"
                                                style={{
                                                    borderLeftWidth: '3px',
                                                    borderLeftColor: 'rgb(255, 147, 0)',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 147, 0, 0.2), 0 0 40px rgba(255, 147, 0, 0.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            >
                                                {/* Icon */}
                                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-orange/20 flex-shrink-0
                                                    transition-transform duration-200 group-hover:scale-105">
                                                    <FileQuestion size={16} className="text-brand-orange" />
                                                </div>

                                                {/* Separator */}
                                                <div className="w-px h-8 bg-brand-orange/20 flex-shrink-0" />

                                                {/* Main Content */}
                                                <div className="flex-1 min-w-0 relative z-10">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                                                        Quiz
                                                    </span>
                                                    <h4 className="text-sm font-semibold text-brand-orange truncate group-hover:text-white transition-colors">
                                                        Module Assessment
                                                    </h4>
                                                </div>

                                                <ChevronRight size={16} className="text-brand-orange/60 ml-1" />
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Resources Section (Bottom) */}
                <div className="max-w-6xl mx-auto px-8 w-full pb-20">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-px flex-1 bg-white/10"></div>
                        <span className="text-xs font-bold text-brand-blue-light uppercase tracking-wider">Course Resources</span>
                        <div className="h-px flex-1 bg-white/10"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {resources.map(resource => (
                            <div key={resource.id} className="p-4 rounded-xl border border-brand-red/20 bg-brand-red/5 hover:bg-brand-red/10 transition-colors cursor-pointer group">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-red">
                                        {resource.type}
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded bg-black/20 text-brand-red hover:text-white flex items-center justify-center"><Download size={10} /></a>
                                        <button className="p-1 rounded bg-black/20 text-brand-red hover:text-white"><Plus size={10} /></button>
                                    </div>
                                </div>
                                <h4 className="text-sm font-bold text-white mb-1 truncate">{resource.title}</h4>
                                <p className="text-xs text-slate-500">This will be a short description of the file.</p>
                                <div className="mt-3 flex justify-end">
                                    <span className="text-[10px] text-slate-600">{resource.size || '2.5 MB'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* --- RIGHT SIDEBAR (AI Panel) --- */}


        </div>
    );
};

export default CoursePlayer;
