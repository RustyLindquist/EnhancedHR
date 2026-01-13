import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { getOrgContext } from '@/lib/org-context';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft, Clock, BookOpen, Play, FileText, HelpCircle, Pencil, ChevronRight } from 'lucide-react';
import { Module } from '@/types';

// Database row types for proper typing
interface DbLesson {
    id: string;
    title: string;
    type: 'video' | 'quiz' | 'article' | null;
    duration: string | null;
    order: number;
}

interface DbModule {
    id: string;
    title: string;
    description: string | null;
    duration: string | null;
    order: number;
    lessons: DbLesson[];
}

interface OrgCoursePageProps {
    params: Promise<{ id: string }>;
}

export default async function OrgCoursePage({ params }: OrgCoursePageProps) {
    const { id } = await params;
    const courseId = parseInt(id);

    if (isNaN(courseId)) {
        notFound();
    }

    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get org context
    const orgContext = await getOrgContext();

    if (!orgContext) {
        redirect('/');
    }

    // Fetch the course with modules and lessons
    const { data: course, error } = await supabase
        .from('courses')
        .select(`
            *,
            author_profile:author_id (
                id,
                full_name,
                expert_title,
                author_bio,
                avatar_url
            ),
            modules (
                id,
                title,
                description,
                duration,
                order,
                lessons (
                    id,
                    title,
                    type,
                    duration,
                    order
                )
            )
        `)
        .eq('id', courseId)
        .eq('org_id', orgContext.orgId)
        .single();

    if (error || !course) {
        notFound();
    }

    // Sort modules and lessons by order
    const sortedModules: Module[] = ((course.modules || []) as DbModule[])
        .sort((a, b) => a.order - b.order)
        .map((module) => ({
            id: module.id,
            title: module.title,
            description: module.description || undefined,
            duration: module.duration || '0m',
            lessons: (module.lessons || [])
                .sort((a, b) => a.order - b.order)
                .map((lesson) => ({
                    id: lesson.id,
                    title: lesson.title,
                    type: lesson.type || 'video',
                    duration: lesson.duration || '0m',
                    isCompleted: false // We're not tracking progress here for now
                }))
        }));

    const isOrgAdmin = orgContext.isOrgAdmin || orgContext.isPlatformAdmin;
    const authorProfile = course.author_profile;

    // Calculate total lessons and duration
    const totalLessons = sortedModules.reduce((acc, m) => acc + m.lessons.length, 0);
    const totalModules = sortedModules.length;

    // Get lesson type icon
    const getLessonIcon = (type: string) => {
        switch (type) {
            case 'video':
                return <Play size={14} className="text-brand-blue-light" />;
            case 'quiz':
                return <HelpCircle size={14} className="text-purple-400" />;
            case 'article':
                return <FileText size={14} className="text-green-400" />;
            default:
                return <Play size={14} className="text-brand-blue-light" />;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Back Button */}
            <Link
                href="/org/courses"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
            >
                <ArrowLeft size={16} />
                <span>Back to Courses</span>
            </Link>

            {/* Course Header */}
            <div className="relative">
                {/* Hero Section */}
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0B1120]">
                    {/* Background Image */}
                    <div className="absolute inset-0">
                        {course.image_url ? (
                            <>
                                <Image
                                    src={course.image_url}
                                    alt={course.title}
                                    fill
                                    className="object-cover opacity-30"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/80 to-[#0B1120]/40" />
                            </>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                        )}
                    </div>

                    {/* Content */}
                    <div className="relative z-10 p-8 lg:p-12">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            {/* Left Side - Course Info */}
                            <div className="flex-1 max-w-3xl">
                                {/* Subtitle Badge */}
                                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-4">
                                    ORGANIZATION COURSE
                                </span>

                                {/* Status Badge */}
                                {course.status && (
                                    <span className={`ml-3 inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase ${
                                        course.status === 'published'
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                    }`}>
                                        {course.status}
                                    </span>
                                )}

                                {/* Title */}
                                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                                    {course.title}
                                </h1>

                                {/* Description */}
                                {course.description && (
                                    <p className="text-slate-300 text-lg leading-relaxed mb-6 line-clamp-3">
                                        {course.description}
                                    </p>
                                )}

                                {/* Meta Info */}
                                <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
                                    {/* Author */}
                                    {(authorProfile?.full_name || course.author) && (
                                        <div className="flex items-center gap-2">
                                            {authorProfile?.avatar_url ? (
                                                <Image
                                                    src={authorProfile.avatar_url}
                                                    alt={authorProfile.full_name || 'Author'}
                                                    width={24}
                                                    height={24}
                                                    className="rounded-full"
                                                />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                                                    {(authorProfile?.full_name || course.author || 'A').substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <span>{authorProfile?.full_name || course.author}</span>
                                        </div>
                                    )}

                                    {/* Duration */}
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} className="text-slate-500" />
                                        <span>{course.duration || '0m'}</span>
                                    </div>

                                    {/* Modules Count */}
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={16} className="text-slate-500" />
                                        <span>{totalModules} module{totalModules !== 1 ? 's' : ''}</span>
                                    </div>

                                    {/* Lessons Count */}
                                    <div className="flex items-center gap-2">
                                        <Play size={16} className="text-slate-500" />
                                        <span>{totalLessons} lesson{totalLessons !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side - Edit Button (for admins) */}
                            {isOrgAdmin && (
                                <div className="flex-shrink-0">
                                    <Link
                                        href={`/org/courses/${courseId}/builder`}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors border border-white/10"
                                    >
                                        <Pencil size={16} />
                                        <span>Edit Course</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Content - Modules Section */}
            <div className="space-y-6">
                {/* Section Header */}
                <div className="flex items-center justify-center gap-3 py-4">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
                    <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-brand-blue-light" />
                        <h2 className="text-[10px] font-bold tracking-[0.25em] uppercase text-slate-400">
                            COURSE CONTENT
                        </h2>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
                </div>

                {/* Modules List */}
                {sortedModules.length > 0 ? (
                    <div className="space-y-4">
                        {sortedModules.map((module, moduleIndex) => (
                            <div
                                key={module.id}
                                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
                            >
                                {/* Module Header */}
                                <div className="px-6 py-5 border-b border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-blue-light/20 text-brand-blue-light text-sm font-bold">
                                                {moduleIndex + 1}
                                            </span>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">
                                                    {module.title}
                                                </h3>
                                                {module.description && (
                                                    <p className="text-sm text-slate-400 mt-1">
                                                        {module.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-500">
                                            <span>{module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}</span>
                                            {module.duration && module.duration !== '0m' && (
                                                <span>{module.duration}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Lessons List */}
                                {module.lessons.length > 0 && (
                                    <div className="divide-y divide-white/5">
                                        {module.lessons.map((lesson, lessonIndex) => (
                                            <div
                                                key={lesson.id}
                                                className="px-6 py-4 hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs text-slate-500 font-mono w-8">
                                                            {moduleIndex + 1}.{lessonIndex + 1}
                                                        </span>
                                                        <div className="flex items-center gap-3">
                                                            {getLessonIcon(lesson.type)}
                                                            <span className="text-white font-medium">
                                                                {lesson.title}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs text-slate-500 uppercase tracking-wider">
                                                            {lesson.type}
                                                        </span>
                                                        {lesson.duration && lesson.duration !== '0m' && (
                                                            <span className="text-xs text-slate-500">
                                                                {lesson.duration}
                                                            </span>
                                                        )}
                                                        <ChevronRight size={16} className="text-slate-600" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Empty Lessons State */}
                                {module.lessons.length === 0 && (
                                    <div className="px-6 py-8 text-center">
                                        <p className="text-slate-500 text-sm">No lessons in this module yet.</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Empty Modules State */
                    <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/10 rounded-2xl">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <BookOpen size={32} className="text-slate-500" />
                        </div>
                        <p className="text-slate-400 text-lg mb-2">No content yet</p>
                        <p className="text-slate-500 text-sm mb-6">This course does not have any modules or lessons.</p>
                        {isOrgAdmin && (
                            <Link
                                href={`/org/courses/${courseId}/builder`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase tracking-wider text-sm transition-colors"
                            >
                                <Pencil size={16} />
                                <span>Add Content</span>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
