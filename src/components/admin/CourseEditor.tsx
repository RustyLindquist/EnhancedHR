'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Save, ArrowLeft, Plus, Trash2, GripVertical, Video, FileText, ChevronDown, ChevronRight, Layout, Settings, BookOpen, Upload, X } from 'lucide-react';
import { Course, Module, Lesson } from '@/types';
import MuxUploaderWrapper from './MuxUploaderWrapper';
import EmbeddingGenerator from './EmbeddingGenerator';

interface CourseEditorProps {
    courseId?: string; // If undefined, we are creating a new course
    initialData?: Partial<Course>;
}

export default function CourseEditor({ courseId, initialData }: CourseEditorProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'settings' | 'curriculum'>('settings');

    // Form State
    const [course, setCourse] = useState<Partial<Course>>({
        title: '',
        description: '',
        author: '',
        category: 'Leadership',
        status: 'draft',
        ...initialData
    });

    // Curriculum State (Mock for now, will fetch real data if editing)
    const [modules, setModules] = useState<Partial<Module>[]>([]);
    const [uploadingLesson, setUploadingLesson] = useState<{ mIndex: number, lIndex: number } | null>(null);

    useEffect(() => {
        if (courseId && courseId !== 'new') {
            // TODO: Fetch modules and lessons
        }
    }, [courseId]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // 1. Upsert Course
            const { data: savedCourse, error: courseError } = await supabase
                .from('courses')
                .upsert({
                    id: courseId === 'new' ? undefined : Number(courseId),
                    title: course.title,
                    description: course.description,
                    author: course.author,
                    category: course.category,
                    status: course.status,
                    // TODO: Add other fields like image_url, recertification fields
                })
                .select()
                .single();

            if (courseError) throw courseError;

            // 2. Save Curriculum (Modules & Lessons)
            // Strategy: We'll iterate and upsert. Deletion of removed items is skipped for MVP simplicity.
            if (savedCourse && modules.length > 0) {
                for (let mIndex = 0; mIndex < modules.length; mIndex++) {
                    const module = modules[mIndex];

                    // Upsert Module
                    const { data: savedModule, error: moduleError } = await supabase
                        .from('modules')
                        .upsert({
                            id: module.id, // If undefined, it creates new
                            course_id: savedCourse.id,
                            title: module.title,
                            order: mIndex,
                        })
                        .select()
                        .single();

                    if (moduleError) throw moduleError;

                    // Upsert Lessons
                    if (module.lessons && module.lessons.length > 0) {
                        for (let lIndex = 0; lIndex < module.lessons.length; lIndex++) {
                            const lesson = module.lessons[lIndex];
                            const { error: lessonError } = await supabase
                                .from('lessons')
                                .upsert({
                                    id: lesson.id,
                                    module_id: savedModule.id,
                                    title: lesson.title,
                                    type: lesson.type,
                                    video_url: lesson.video_url,
                                    content: lesson.content,
                                    order: lIndex,
                                });

                            if (lessonError) throw lessonError;
                        }
                    }
                }
            }

            // 3. Redirect if new
            if (courseId === 'new') {
                router.push(`/admin/courses/${savedCourse.id}`);
            } else {
                alert('Course saved successfully!');
            }

        } catch (error) {
            console.error('Error saving course:', error);
            alert('Failed to save course.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#0A0D12]/80 backdrop-blur-xl py-4 z-40 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            {courseId === 'new' ? 'Create New Course' : 'Edit Course'}
                        </h1>
                        <p className="text-xs text-slate-400 font-mono">
                            {courseId === 'new' ? 'DRAFT' : `ID: ${courseId}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('curriculum')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'curriculum' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Curriculum
                        </button>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-brand-blue-light text-brand-black font-bold uppercase tracking-wider hover:bg-white transition-all shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 gap-8">

                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Basic Info Card */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Settings size={20} className="text-brand-blue-light" /> Basic Information
                            </h2>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Course Title</label>
                                    <input
                                        type="text"
                                        value={course.title}
                                        onChange={e => setCourse({ ...course, title: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue-light/50 transition-colors"
                                        placeholder="e.g. Strategic HR Leadership"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Author</label>
                                    <input
                                        type="text"
                                        value={course.author}
                                        onChange={e => setCourse({ ...course, author: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue-light/50 transition-colors"
                                        placeholder="Expert Name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                                    <select
                                        value={course.category}
                                        onChange={e => setCourse({ ...course, category: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue-light/50 transition-colors appearance-none"
                                    >
                                        <option>Leadership</option>
                                        <option>Communication</option>
                                        <option>Compliance</option>
                                        <option>AI & Tech</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                                    <select
                                        value={course.status}
                                        onChange={e => setCourse({ ...course, status: e.target.value as any })}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue-light/50 transition-colors appearance-none"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                                    <textarea
                                        value={course.description}
                                        onChange={e => setCourse({ ...course, description: e.target.value })}
                                        rows={4}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue-light/50 transition-colors resize-none"
                                        placeholder="Brief summary of what the student will learn..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Recertification Card */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <BookOpen size={20} className="text-brand-orange" /> Recertification
                            </h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        <input type="checkbox" className="rounded border-white/20 bg-white/5 text-brand-blue-light" />
                                        SHRM Eligible
                                    </label>
                                    <div className="flex gap-4">
                                        <input type="text" placeholder="Activity ID" className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white" />
                                        <input type="number" placeholder="PDCs" className="w-24 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white" />
                                    </div>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        <input type="checkbox" className="rounded border-white/20 bg-white/5 text-brand-orange" />
                                        HRCI Eligible
                                    </label>
                                    <div className="flex gap-4">
                                        <input type="text" placeholder="Program ID" className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white" />
                                        <input type="number" placeholder="Credits" className="w-24 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* CURRICULUM TAB */}
                {activeTab === 'curriculum' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Empty State */}
                        {modules.length === 0 && (
                            <div className="text-center py-20 bg-white/5 border border-white/10 border-dashed rounded-2xl">
                                <Layout size={48} className="mx-auto text-slate-600 mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">No Content Yet</h3>
                                <p className="text-slate-400 mb-6">Start by adding your first module.</p>
                                <button
                                    onClick={() => setModules([...modules, { title: 'New Module', lessons: [] }])}
                                    className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider transition-colors"
                                >
                                    + Add Module
                                </button>
                            </div>
                        )}

                        {/* Module List */}
                        {modules.map((module, mIndex) => (
                            <div key={mIndex} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <GripVertical size={20} className="text-slate-600 cursor-grab" />
                                        <input
                                            type="text"
                                            value={module.title}
                                            onChange={(e) => {
                                                const newModules = [...modules];
                                                newModules[mIndex].title = e.target.value;
                                                setModules(newModules);
                                            }}
                                            className="bg-transparent text-lg font-bold text-white focus:outline-none placeholder:text-slate-600"
                                            placeholder="Module Title"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                        <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                                            <ChevronDown size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Lessons Area */}
                                <div className="p-4 space-y-2 bg-black/20">
                                    {module.lessons?.map((lesson, lIndex) => (
                                        <React.Fragment key={lIndex}>
                                            <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors group">
                                                <GripVertical size={16} className="text-slate-700 cursor-grab" />
                                                <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-500">
                                                    {lesson.type === 'video' ? <Video size={14} /> : <FileText size={14} />}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={lesson.title}
                                                    className="flex-1 bg-transparent text-sm font-medium text-white focus:outline-none"
                                                    placeholder="Lesson Title"
                                                />
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {lesson.type === 'video' && (
                                                        <button
                                                            onClick={() => setUploadingLesson({ mIndex, lIndex })}
                                                            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${lesson.video_url ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-brand-blue-light/10 text-brand-blue-light border border-brand-blue-light/20 hover:bg-brand-blue-light hover:text-black'}`}
                                                        >
                                                            <Upload size={12} /> {lesson.video_url ? 'Replace Video' : 'Upload Video'}
                                                        </button>
                                                    )}
                                                    <button className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded text-slate-500 transition-colors">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Upload Area (Inline) */}
                                            {uploadingLesson?.mIndex === mIndex && uploadingLesson?.lIndex === lIndex && (
                                                <div className="p-4 bg-black/40 border border-white/10 rounded-lg mb-2 animate-fade-in">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h4 className="text-sm font-bold text-white">Upload Video for "{lesson.title}"</h4>
                                                        <button onClick={() => setUploadingLesson(null)} className="text-slate-500 hover:text-white">
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                    <MuxUploaderWrapper
                                                        onSuccess={(uploadId) => {
                                                            const newModules = [...modules];
                                                            if (newModules[mIndex].lessons) {
                                                                newModules[mIndex].lessons![lIndex].video_url = uploadId;
                                                            }
                                                            setModules(newModules);
                                                            setUploadingLesson(null);
                                                            alert('Upload started! Video will process in the background.');
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            {/* Transcript / AI Area */}
                                            {lesson.type === 'video' && (
                                                <div className="mt-2 pl-12 pr-4 pb-2">
                                                    <details className="group/details">
                                                        <summary className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-white transition-colors list-none flex items-center gap-2">
                                                            <ChevronRight size={14} className="group-open/details:rotate-90 transition-transform" />
                                                            Transcript & AI
                                                        </summary>
                                                        <div className="mt-3 space-y-3">
                                                            <textarea
                                                                value={lesson.content || ''}
                                                                onChange={(e) => {
                                                                    const newModules = [...modules];
                                                                    if (newModules[mIndex].lessons) {
                                                                        newModules[mIndex].lessons![lIndex].content = e.target.value;
                                                                    }
                                                                    setModules(newModules);
                                                                }}
                                                                placeholder="Paste VTT or text transcript here..."
                                                                className="w-full h-32 bg-black/20 border border-white/10 rounded-lg p-3 text-xs text-slate-300 font-mono focus:outline-none focus:border-white/20"
                                                            />
                                                            {courseId && courseId !== 'new' ? (
                                                                <EmbeddingGenerator
                                                                    courseId={Number(courseId)}
                                                                    lessonId={lesson.id}
                                                                    transcript={lesson.content}
                                                                />
                                                            ) : (
                                                                <p className="text-xs text-slate-500 italic">Save course to generate embeddings.</p>
                                                            )}
                                                        </div>
                                                    </details>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}

                                    <button
                                        className="w-full py-3 rounded-lg border border-dashed border-white/10 text-slate-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                                        onClick={() => {
                                            const newModules = [...modules];
                                            if (!newModules[mIndex].lessons) newModules[mIndex].lessons = [];
                                            newModules[mIndex].lessons?.push({ title: '', type: 'video' } as any);
                                            setModules(newModules);
                                        }}
                                    >
                                        <Plus size={14} /> Add Lesson
                                    </button>
                                </div>
                            </div>
                        ))}

                        {modules.length > 0 && (
                            <button
                                onClick={() => setModules([...modules, { title: 'New Module', lessons: [] }])}
                                className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold uppercase tracking-wider transition-colors border border-white/5 hover:border-white/10"
                            >
                                + Add Another Module
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
}
