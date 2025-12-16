import React, { useState } from 'react';
import {
    ChevronLeft, Play, Clock, Star, Award, ShieldCheck,
    Monitor, FileText, HelpCircle, User, Plus, Download, Lock,
    ChevronDown, ChevronRight, Info, BrainCircuit, Target, CheckCircle,
    Layout
} from 'lucide-react';
import { Course, Module, Resource, DragItem } from '../types';
import { DEFAULT_COURSE_IMAGE, MOCK_AUTHOR_PROFILE } from '../constants';
import RatingModal from './RatingModal';
import { issueCertificate } from '@/lib/certificates';
import Link from 'next/link';

interface CourseHomePageProps {
    course: Course;
    syllabus: Module[];
    resources: Resource[];
    onBack: () => void;
    onStartCourse: () => void;
    onDragStart: (item: DragItem) => void;
    onAddToCollection: (item: DragItem) => void;
}

import { calculateCredits, awardCredits, checkCreditStatus } from '../lib/certification';
import { createClient } from '@/lib/supabase/client';

const CourseHomePage: React.FC<CourseHomePageProps> = ({
    course,
    syllabus,
    resources,
    onBack,
    onStartCourse,
    onDragStart,
    onAddToCollection
}) => {
    const [collapsedModules, setCollapsedModules] = useState<string[]>([]);
    const [isMaterialsOpen, setIsMaterialsOpen] = useState(false); // Collapsed by default
    const [isClaiming, setIsClaiming] = useState(false);
    const [claimStatus, setClaimStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [earnedCredits, setEarnedCredits] = useState<{ shrm: number, hrci: number } | null>(null);
    const [isRatingOpen, setIsRatingOpen] = useState(false);
    const [certificateId, setCertificateId] = useState<string | null>(null);

    // Fetch certificate if completed
    React.useEffect(() => {
        const fetchCert = async () => {
            if (course.progress === 100) {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const id = await issueCertificate(user.id, course.id);
                    setCertificateId(id);
                }
            }
        };
        fetchCert();
    }, [course.progress, course.id]);

    const displayImage = course.image || DEFAULT_COURSE_IMAGE;
    const ctaState = course.progress === 100 ? 'COMPLETED' : course.progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';

    // Calculate potential credits based on duration string (Mock parsing for now)
    // In real app, we'd use actual minutes from DB
    const parseDurationToMinutes = (dur: string) => {
        // Mock: "2h 30m" -> 150
        // Simple parser
        let minutes = 0;
        if (dur.includes('h')) minutes += parseInt(dur.split('h')[0]) * 60;
        if (dur.includes('m')) minutes += parseInt(dur.split('m')[0].split(' ').pop() || '0');
        return minutes || 60; // Default to 60 if fail
    };

    const handleClaimCredits = async () => {
        setIsClaiming(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error("User not logged in");

            const minutes = parseDurationToMinutes(course.duration);
            const credits = calculateCredits(minutes);

            // Award SHRM
            if (course.badges.includes('SHRM') && credits.shrm > 0) {
                await awardCredits(user.id, course.id, 'SHRM', credits.shrm);
            }
            // Award HRCI
            if (course.badges.includes('HRCI') && credits.hrci > 0) {
                await awardCredits(user.id, course.id, 'HRCI', credits.hrci);
            }

            setEarnedCredits(credits);
            setClaimStatus('success');
        } catch (error) {
            console.error(error);
            setClaimStatus('error');
        } finally {
            setIsClaiming(false);
        }
    };

    const toggleModule = (modId: string) => {
        setCollapsedModules(prev =>
            prev.includes(modId) ? prev.filter(id => id !== modId) : [...prev, modId]
        );
    };

    const renderStars = (score: number) => {
        return (
            <div className="flex space-x-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={12}
                        className={`${star <= Math.round(score) ? 'text-brand-orange fill-brand-orange' : 'text-slate-600'}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col relative animate-fade-in custom-scrollbar overflow-y-auto overflow-x-hidden pb-48">

            {/* --- HEADER (COLLECTION STYLE) --- */}
            <div className="h-24 flex-shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-xl z-30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] flex items-center justify-between px-10 sticky top-0">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-full border border-white/10 bg-black/40 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors group"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue-light drop-shadow-[0_0_5px_rgba(120,192,240,0.5)]">
                                Course Collection
                            </span>
                        </div>
                        <h1 className="text-2xl font-light text-white tracking-tight drop-shadow-lg">
                            {course.title}
                        </h1>
                    </div>
                </div>

                {/* Header Actions */}
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors">
                        <Info size={14} /> Course Info
                    </button>
                </div>
            </div>

            <div className="px-10 py-10 max-w-7xl mx-auto w-full space-y-12">

                {/* --- HERO SECTION (IMAGE & ACTIONS) --- */}
                <div className="relative">
                    <div
                        draggable
                        onDragStart={(e) => {
                            const emptyImg = new Image();
                            emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                            e.dataTransfer.setDragImage(emptyImg, 0, 0);
                            onDragStart({ type: 'COURSE', id: course.id, title: course.title, subtitle: course.author, image: displayImage });
                        }}
                        className="group relative w-full h-[420px] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl cursor-grab active:cursor-grabbing hover:border-white/20 transition-all duration-500"
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            <img src={displayImage} className="w-full h-full object-cover transition-transform duration-[20s] ease-in-out group-hover:scale-110" alt="Course Cover" />
                            {/* Gradient Overlays for Readability */}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/60 to-transparent"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent"></div>
                        </div>

                        {/* Content Overlay */}
                        <div className="absolute inset-0 p-12 flex flex-col justify-end max-w-3xl relative z-10">

                            {/* Top Badge (Positioned absolutely top left) */}
                            <div className="absolute top-10 left-12 flex items-center gap-4">
                                <span className="px-3 py-1 bg-brand-blue-light/20 border border-brand-blue-light/30 rounded-full text-brand-blue-light text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(120,192,240,0.3)] backdrop-blur-md">
                                    {course.category}
                                </span>
                            </div>

                            {/* Title */}
                            <h2 className="text-5xl font-bold text-white mb-4 leading-[1.1] drop-shadow-xl">
                                {course.title}
                            </h2>

                            {/* Author */}
                            <div className="flex items-center gap-3 mb-8">
                                <span className="text-slate-300 font-medium">By {course.author}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                <div className="flex items-center gap-2">
                                    {renderStars(course.rating)}
                                    <span className="text-xs text-slate-400">({course.rating})</span>
                                </div>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex items-center gap-6">
                                {ctaState === 'NOT_STARTED' && (
                                    <button
                                        onClick={onStartCourse}
                                        className="flex items-center gap-3 bg-brand-orange text-white px-8 py-4 rounded-full font-bold uppercase tracking-wider hover:bg-brand-orange/90 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,147,0,0.4)]"
                                    >
                                        <Play size={20} fill="currentColor" /> Start Course
                                    </button>
                                )}
                                {ctaState === 'IN_PROGRESS' && (
                                    <button
                                        onClick={onStartCourse}
                                        className="flex items-center gap-3 bg-brand-blue-light text-brand-black px-8 py-4 rounded-full font-bold uppercase tracking-wider hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(120,192,240,0.4)]"
                                    >
                                        <Play size={20} fill="currentColor" /> Resume Learning
                                    </button>
                                )}
                                {ctaState === 'COMPLETED' && (
                                    <div className="flex items-center gap-4 relative group/claim">
                                        <button
                                            onClick={handleClaimCredits}
                                            disabled={isClaiming || claimStatus === 'success' || (course.progress < 90)} // Strict 90% check
                                            className={`
                                                flex items-center gap-3 px-8 py-4 rounded-full font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)]
                                                ${claimStatus === 'success'
                                                    ? 'bg-green-600 text-white cursor-default'
                                                    : course.progress < 90
                                                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-white/10 shadow-none'
                                                        : 'bg-green-500 text-black hover:bg-green-400 hover:scale-105'
                                                }
                                            `}
                                        >
                                            {isClaiming ? (
                                                <span>Processing...</span>
                                            ) : claimStatus === 'success' ? (
                                                <>
                                                    <CheckCircle size={20} /> Credits Claimed
                                                </>
                                            ) : (
                                                <>
                                                    <Award size={20} /> Claim Credits
                                                </>
                                            )}
                                        </button>

                                        {/* Tooltip for Insufficient Progress */}
                                        {course.progress < 90 && claimStatus !== 'success' && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 p-4 bg-black/90 border border-white/20 rounded-xl backdrop-blur-xl text-center opacity-0 group-hover/claim:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                                <p className="text-white font-bold text-xs mb-1">Requirements Not Met</p>
                                                <p className="text-slate-400 text-[10px]">
                                                    You must complete at least 90% of the course content to claim credits. Current: {course.progress}%
                                                </p>
                                                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-black/90 border-r border-b border-white/20 rotate-45"></div>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setIsRatingOpen(true)}
                                            className="flex items-center gap-3 px-8 py-4 rounded-full font-bold uppercase tracking-wider bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10"
                                        >
                                            <Star size={20} /> Rate
                                        </button>
                                        {certificateId && (
                                            <Link
                                                href={`/verify/${certificateId}`}
                                                target="_blank"
                                                className="flex items-center gap-3 px-8 py-4 rounded-full font-bold uppercase tracking-wider bg-brand-blue-light/10 text-brand-blue-light hover:bg-brand-blue-light hover:text-brand-black transition-all border border-brand-blue-light/20"
                                            >
                                                <Award size={20} /> Certificate
                                            </Link>
                                        )}
                                    </div>
                                )}

                                {/* Progress or Duration */}
                                <div className="flex flex-col ml-2">
                                    {ctaState === 'IN_PROGRESS' ? (
                                        <>
                                            <span className="text-xs text-brand-blue-light font-bold mb-1">{course.progress}% Complete</span>
                                            <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-brand-blue-light" style={{ width: `${course.progress}%` }}></div>
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-slate-300 text-xs flex items-center gap-2 font-bold uppercase tracking-wide bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                                            <Clock size={14} /> {course.duration} Total
                                        </span>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Add to Collection FAB (Hero) */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddToCollection({ type: 'COURSE', id: course.id, title: course.title, image: displayImage });
                            }}
                            className="absolute top-10 right-10 w-12 h-12 rounded-full bg-white/10 hover:bg-brand-orange text-white flex items-center justify-center transition-all shadow-lg backdrop-blur-md z-30 group/btn border border-white/20"
                        >
                            <Plus size={20} className="group-hover/btn:rotate-90 transition-transform" />
                        </button>
                    </div>

                    {/* --- COURSE INFO (Artfully placed below) --- */}
                    <div className="mt-6 grid grid-cols-3 gap-6">
                        {/* Description Column (2/3) */}
                        <div className="col-span-2 bg-white/5 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Info size={14} /> Course Brief
                            </h3>
                            <p className="text-lg text-slate-300 font-light leading-relaxed">
                                {course.description}
                            </p>
                        </div>

                        {/* Metadata Column (1/3) */}
                        <div className="col-span-1 space-y-4">
                            {/* Author Card */}
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-700 border border-white/10 flex items-center justify-center overflow-hidden">
                                    {MOCK_AUTHOR_PROFILE.avatar ? <img src={MOCK_AUTHOR_PROFILE.avatar} /> : <User className="text-slate-300" />}
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">{course.author}</p>
                                    <p className="text-slate-400 text-xs">{MOCK_AUTHOR_PROFILE.role}</p>
                                </div>
                            </div>

                            {/* Certs */}
                            {(course.badges.includes('SHRM') || course.badges.includes('HRCI')) && (
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Certifications</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {course.badges.includes('SHRM') && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-blue-light/10 border border-brand-blue-light/20 rounded-lg">
                                                <ShieldCheck size={14} className="text-brand-blue-light" />
                                                <span className="text-xs font-bold text-brand-blue-light">SHRM-CP</span>
                                            </div>
                                        )}
                                        {course.badges.includes('HRCI') && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-orange/10 border border-brand-orange/20 rounded-lg">
                                                <ShieldCheck size={14} className="text-brand-orange" />
                                                <span className="text-xs font-bold text-brand-orange">HRCI-PHR</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- COURSE MATERIAL / INTELLIGENCE (Moved to Top) --- */}
                <div className="pt-4 pb-8">
                    <div
                        className="flex items-center justify-between cursor-pointer group select-none border-b border-white/10 pb-4"
                        onClick={() => setIsMaterialsOpen(!isMaterialsOpen)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg text-white transition-colors ${isMaterialsOpen ? 'bg-brand-orange text-white' : 'bg-brand-orange/20 text-brand-orange'}`}>
                                <FileText size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-tight uppercase group-hover:text-brand-orange transition-colors">Course Material</h3>
                        </div>

                        <button className="p-2 rounded-full bg-white/5 text-slate-400 transition-all duration-300 group-hover:bg-white/10 group-hover:text-white">
                            {isMaterialsOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </button>
                    </div>

                    {isMaterialsOpen && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-6 animate-fade-in">
                            {resources.map(resource => {
                                const isPDF = resource.type === 'PDF';
                                const isDoc = resource.type === 'DOC';
                                const colorClass = isPDF ? 'text-red-400' : isDoc ? 'text-blue-400' : 'text-green-400';

                                return (
                                    <div
                                        key={resource.id}
                                        draggable
                                        onDragStart={(e) => {
                                            const emptyImg = new Image();
                                            emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                            e.dataTransfer.setDragImage(emptyImg, 0, 0);
                                            onDragStart({ type: 'RESOURCE', id: resource.id, title: resource.title, subtitle: resource.type });
                                        }}
                                        className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-4 flex flex-col gap-3 transition-all hover:-translate-y-1 cursor-grab active:cursor-grabbing h-32"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className={`w-10 h-10 rounded-lg bg-black/30 border border-white/5 flex items-center justify-center ${colorClass}`}>
                                                <FileText size={18} />
                                            </div>
                                            <button className="p-1.5 rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
                                                <Download size={14} />
                                            </button>
                                        </div>

                                        <div className="mt-auto">
                                            <h4 className="text-xs font-bold text-white line-clamp-1 mb-1">{resource.title}</h4>
                                            <p className="text-[9px] text-slate-500 font-mono flex justify-between">
                                                <span>{resource.type}</span>
                                                <span>{resource.size}</span>
                                            </p>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddToCollection({
                                                    type: 'RESOURCE',
                                                    id: resource.id,
                                                    title: resource.title,
                                                    subtitle: course.title
                                                });
                                            }}
                                            className="absolute top-3 right-8 w-6 h-6 rounded-full bg-white/10 hover:bg-brand-orange text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* --- MODULES (Grid Layout) --- */}
                <div className="space-y-12">
                    {syllabus.map((mod, index) => {
                        const isCollapsed = collapsedModules.includes(mod.id);

                        return (
                            <div key={mod.id} className="animate-fade-in relative" style={{ animationDelay: `${index * 100}ms` }}>
                                {/* Visual Connecting Line for Timeline feel */}
                                <div className="absolute left-6 top-16 bottom-0 w-px bg-white/5 -z-10"></div>

                                {/* Module Header Row */}
                                <div className="flex items-center justify-between mb-2 border-b border-white/10 pb-4 z-10 relative">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => toggleModule(mod.id)}
                                            className={`
                                            p-2 rounded-full bg-white/5 text-slate-400 transition-all duration-300 hover:bg-white/10
                                        `}
                                        >
                                            {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                                        </button>

                                        <div>
                                            <h3 className="text-2xl font-bold text-white tracking-tight">{mod.title}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs font-bold text-brand-blue-light bg-brand-blue-light/10 px-2 py-0.5 rounded uppercase tracking-wider">Module {index + 1}</span>
                                                <span className="text-xs text-slate-500 font-medium">{mod.lessons.length} Items</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => onAddToCollection({
                                            type: 'MODULE',
                                            id: mod.id,
                                            title: mod.title,
                                            subtitle: course.title,
                                            meta: `${mod.lessons.length} Items`
                                        })}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-brand-orange hover:border-brand-orange text-slate-300 hover:text-white transition-all text-xs font-bold uppercase tracking-wider group"
                                    >
                                        <Plus size={14} className="group-hover:rotate-90 transition-transform" /> Save Module
                                    </button>
                                </div>

                                {/* Lesson Cards Grid */}
                                {!isCollapsed && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-6 pl-2">
                                        {mod.lessons.map((lesson, lIdx) => {
                                            const isLocked = ctaState !== 'COMPLETED' && (index > 0 || lIdx > 3); // Mock logic
                                            const isQuiz = lesson.type === 'quiz';
                                            const isActivity = lesson.type === 'article'; // Assuming article maps to activity

                                            // Visual differentiator for "Activity" vs "Quiz" vs "Video"
                                            let CardIcon = Monitor;
                                            let labelText = `${index + 1}.${lIdx + 1} LESSON`;
                                            let labelColor = "text-slate-500";
                                            let iconBg = "bg-white/5 text-slate-400";
                                            let cardBorder = "border-white/10 hover:border-white/30";

                                            if (isQuiz) {
                                                CardIcon = BrainCircuit;
                                                labelText = "ASSESSMENT";
                                                labelColor = "text-brand-orange";
                                                iconBg = "bg-brand-orange/20 text-brand-orange";
                                                cardBorder = "border-brand-orange/30 hover:border-brand-orange";
                                            } else if (isActivity) {
                                                CardIcon = Layout; // Or Target
                                                labelText = "ACTIVITY";
                                                labelColor = "text-indigo-400";
                                                iconBg = "bg-indigo-500/20 text-indigo-400";
                                                cardBorder = "border-indigo-500/30 hover:border-indigo-400";
                                            }

                                            return (
                                                <div
                                                    key={lesson.id}
                                                    draggable={!isLocked}
                                                    onDragStart={(e) => {
                                                        if (isLocked) { e.preventDefault(); return; }
                                                        const emptyImg = new Image();
                                                        emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                                        e.dataTransfer.setDragImage(emptyImg, 0, 0);
                                                        onDragStart({ type: 'LESSON', id: lesson.id, title: lesson.title, subtitle: mod.title });
                                                    }}
                                                    className={`
                                                    relative group rounded-xl border p-5 flex flex-col h-40 transition-all duration-300
                                                    ${isLocked
                                                            ? 'bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed'
                                                            : `bg-white/5 cursor-grab active:cursor-grabbing shadow-lg hover:-translate-y-1 hover:shadow-2xl hover:bg-white/10 ${cardBorder}`}
                                                `}
                                                >
                                                    {/* Top: Icon */}
                                                    <div className="flex justify-between items-start">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${iconBg}`}>
                                                            {isLocked ? <Lock size={16} /> : <CardIcon size={20} />}
                                                        </div>
                                                    </div>

                                                    {/* Bottom: Text Info */}
                                                    <div className="mt-auto">
                                                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${labelColor}`}>
                                                            {labelText}
                                                        </p>
                                                        <h4 className={`text-sm font-bold leading-tight line-clamp-2 ${isLocked ? 'text-slate-500' : 'text-white'}`}>
                                                            {lesson.title}
                                                        </h4>
                                                    </div>

                                                    {/* Hover Add Button (Top Right) */}
                                                    {!isLocked && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onAddToCollection({
                                                                    type: 'LESSON',
                                                                    id: lesson.id,
                                                                    title: lesson.title,
                                                                    subtitle: mod.title,
                                                                    meta: lesson.duration
                                                                });
                                                            }}
                                                            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-brand-orange text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

            </div>

            <RatingModal
                isOpen={isRatingOpen}
                onClose={() => setIsRatingOpen(false)}
                courseId={course.id}
                courseTitle={course.title}
            />
        </div >
    );
};

export default CourseHomePage;