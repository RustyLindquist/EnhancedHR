import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Plus, Search, Filter, MoreHorizontal, FileText, Video, Eye } from 'lucide-react';

export default async function AdminCoursesPage() {
    const supabase = await createClient();

    // Fetch courses with minimal fields for list view
    // Try with author_id first, fallback without it if column doesn't exist
    let courses: any[] | null = null;

    const result = await supabase
        .from('courses')
        .select('id, title, author, author_id, category, status, created_at, image_url')
        .order('created_at', { ascending: false });

    if (result.error?.message?.includes('author_id')) {
        // Fallback query without author_id
        const fallbackResult = await supabase
            .from('courses')
            .select('id, title, author, category, status, created_at, image_url')
            .order('created_at', { ascending: false });
        courses = fallbackResult.data?.map(c => ({ ...c, author_id: null })) || [];
    } else {
        courses = result.data;
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Courses</h1>
                    <p className="text-slate-400">Manage your learning content and catalog.</p>
                </div>
                <Link
                    href="/admin/courses/new"
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-brand-blue-light text-brand-black font-bold uppercase tracking-wider hover:bg-white transition-all shadow-lg hover:scale-105"
                >
                    <Plus size={18} /> New Course
                </Link>
            </div>

            {/* Filters / Search Bar */}
            <div className="flex items-center gap-4 mb-6 bg-white/5 p-2 rounded-xl border border-white/10 w-fit">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        className="bg-transparent border-none pl-10 pr-4 py-2 text-sm text-white focus:ring-0 placeholder:text-slate-600 w-64"
                    />
                </div>
                <div className="h-6 w-px bg-white/10"></div>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <Filter size={14} /> Status: All
                </button>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <Filter size={14} /> Category: All
                </button>
            </div>

            {/* Course List Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Author</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {courses?.map((course) => (
                            <tr key={course.id} className="group hover:bg-white/[0.02] transition-colors">
                                <td className="p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-slate-800 border border-white/10 overflow-hidden flex-shrink-0">
                                            {course.image_url ? (
                                                <img src={course.image_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                                    <FileText size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-sm group-hover:text-brand-blue-light transition-colors">
                                                {course.title}
                                            </h3>
                                            <p className="text-xs text-slate-500">ID: {course.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5">
                                    {course.author_id ? (
                                        <Link
                                            href={`/admin/experts/${course.author_id}`}
                                            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
                                                {course.author?.charAt(0) || '?'}
                                            </div>
                                            <span className="text-sm text-brand-blue-light hover:underline">{course.author || 'Unknown'}</span>
                                        </Link>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
                                                {course.author?.charAt(0) || '?'}
                                            </div>
                                            <span className="text-sm text-slate-300">{course.author || 'Unknown'}</span>
                                        </div>
                                    )}
                                </td>
                                <td className="p-5">
                                    <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        {course.category}
                                    </span>
                                </td>
                                <td className="p-5">
                                    <StatusBadge status={course.status || 'draft'} />
                                </td>
                                <td className="p-5 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            href={`/?courseId=${course.id}`}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                            title="View Public Page"
                                        >
                                            <Eye size={16} />
                                        </Link>
                                        <Link
                                            href={`/admin/courses/${course.id}/builder`}
                                            className="px-3 py-1.5 rounded-lg bg-brand-blue-light/10 border border-brand-blue-light/20 text-brand-blue-light text-xs font-bold hover:bg-brand-blue-light hover:text-brand-black transition-colors"
                                        >
                                            Edit
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!courses || courses.length === 0) && (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-slate-500">
                                    No courses found. Create your first one!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'published') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Published
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            Draft
        </span>
    );
}
