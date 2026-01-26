'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, FileText, Eye, ChevronDown, X, Trash2, AlertTriangle, CircleDot } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { deleteCourse, updateCourseDetails } from '@/app/actions/course-builder';
import CoursePromotionButton from '@/components/admin/CoursePromotionButton';

interface Course {
    id: string;
    title: string;
    author: string | null;
    author_id: string | null;
    category: string | null;
    status: string | null;
    created_at: string;
    image_url: string | null;
}

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [statusMenuCourse, setStatusMenuCourse] = useState<Course | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const statusMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchCourses() {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('courses')
                .select('id, title, author, author_id, category, status, created_at, image_url')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setCourses(data);
            }
            setLoading(false);
        }
        fetchCourses();
    }, []);

    // Close status menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
                setStatusMenuCourse(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDeleteCourse = async () => {
        if (!courseToDelete) return;
        setIsDeleting(true);
        try {
            const result = await deleteCourse(courseToDelete.id);
            if (result.success) {
                setCourses(courses.filter(c => c.id !== courseToDelete.id));
                setCourseToDelete(null);
            } else {
                console.error('Failed to delete course:', result.error);
                alert('Failed to delete course: ' + result.error);
            }
        } catch (error) {
            console.error('Error deleting course:', error);
            alert('An error occurred while deleting the course');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleStatusChange = async (course: Course, newStatus: 'draft' | 'pending_review' | 'published' | 'archived') => {
        setIsUpdatingStatus(true);
        try {
            const result = await updateCourseDetails(Number(course.id), { status: newStatus });
            if (result.success) {
                setCourses(courses.map(c =>
                    c.id === course.id ? { ...c, status: newStatus } : c
                ));
                setStatusMenuCourse(null);
            } else {
                console.error('Failed to update status:', result.error);
                alert('Failed to update status: ' + result.error);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('An error occurred while updating the status');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Get unique categories and statuses for filter dropdowns
    const categories = useMemo(() => {
        const cats = new Set(courses.map(c => c.category).filter(Boolean));
        return Array.from(cats).sort();
    }, [courses]);

    const statuses = useMemo(() => {
        const stats = new Set(courses.map(c => c.status || 'draft').filter(Boolean));
        return Array.from(stats).sort();
    }, [courses]);

    // Filter courses based on search and filters
    const filteredCourses = useMemo(() => {
        return courses.filter(course => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesTitle = course.title?.toLowerCase().includes(query);
                const matchesAuthor = course.author?.toLowerCase().includes(query);
                const matchesCategory = course.category?.toLowerCase().includes(query);
                if (!matchesTitle && !matchesAuthor && !matchesCategory) {
                    return false;
                }
            }

            // Status filter
            if (statusFilter !== 'all') {
                const courseStatus = course.status || 'draft';
                if (courseStatus !== statusFilter) {
                    return false;
                }
            }

            // Category filter
            if (categoryFilter !== 'all') {
                if (course.category !== categoryFilter) {
                    return false;
                }
            }

            return true;
        });
    }, [courses, searchQuery, statusFilter, categoryFilter]);

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setCategoryFilter('all');
    };

    const hasActiveFilters = searchQuery || statusFilter !== 'all' || categoryFilter !== 'all';

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
                {/* Search Input */}
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none pl-10 pr-4 py-2 text-sm text-white focus:ring-0 focus:outline-none placeholder:text-slate-600 w-64"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="h-6 w-px bg-white/10"></div>

                {/* Status Filter Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setStatusDropdownOpen(!statusDropdownOpen);
                            setCategoryDropdownOpen(false);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                            statusFilter !== 'all'
                                ? 'text-brand-blue-light bg-brand-blue-light/10'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Filter size={14} />
                        Status: {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).replace('_', ' ')}
                        <ChevronDown size={12} className={`transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {statusDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50 min-w-[150px] py-1">
                            <button
                                onClick={() => {
                                    setStatusFilter('all');
                                    setStatusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/5 ${
                                    statusFilter === 'all' ? 'text-brand-blue-light' : 'text-slate-300'
                                }`}
                            >
                                All Statuses
                            </button>
                            {statuses.map(status => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setStatusFilter(status);
                                        setStatusDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/5 capitalize ${
                                        statusFilter === status ? 'text-brand-blue-light' : 'text-slate-300'
                                    }`}
                                >
                                    {status.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Category Filter Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setCategoryDropdownOpen(!categoryDropdownOpen);
                            setStatusDropdownOpen(false);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                            categoryFilter !== 'all'
                                ? 'text-brand-blue-light bg-brand-blue-light/10'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Filter size={14} />
                        Category: {categoryFilter === 'all' ? 'All' : categoryFilter}
                        <ChevronDown size={12} className={`transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {categoryDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50 min-w-[150px] py-1 max-h-64 overflow-y-auto">
                            <button
                                onClick={() => {
                                    setCategoryFilter('all');
                                    setCategoryDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/5 ${
                                    categoryFilter === 'all' ? 'text-brand-blue-light' : 'text-slate-300'
                                }`}
                            >
                                All Categories
                            </button>
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => {
                                        setCategoryFilter(category as string);
                                        setCategoryDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/5 ${
                                        categoryFilter === category ? 'text-brand-blue-light' : 'text-slate-300'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <>
                        <div className="h-6 w-px bg-white/10"></div>
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                            <X size={14} /> Clear
                        </button>
                    </>
                )}
            </div>

            {/* Results Count */}
            {hasActiveFilters && (
                <p className="text-sm text-slate-500 mb-4">
                    Showing {filteredCourses.length} of {courses.length} courses
                </p>
            )}

            {/* Course List Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">
                        Loading courses...
                    </div>
                ) : (
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
                            {filteredCourses.map((course) => (
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
                                            {/* Status Toggle */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setStatusMenuCourse(statusMenuCourse?.id === course.id ? null : course)}
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                                    title="Change Status"
                                                >
                                                    <CircleDot size={16} />
                                                </button>
                                                {statusMenuCourse?.id === course.id && (
                                                    <div
                                                        ref={statusMenuRef}
                                                        className="absolute right-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50 min-w-[160px] py-1"
                                                    >
                                                        <button
                                                            onClick={() => handleStatusChange(course, 'draft')}
                                                            disabled={isUpdatingStatus}
                                                            className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/5 flex items-center gap-2 ${
                                                                course.status === 'draft' ? 'text-yellow-400' : 'text-slate-300'
                                                            }`}
                                                        >
                                                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                                            Draft
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(course, 'pending_review')}
                                                            disabled={isUpdatingStatus}
                                                            className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/5 flex items-center gap-2 ${
                                                                course.status === 'pending_review' ? 'text-blue-400' : 'text-slate-300'
                                                            }`}
                                                        >
                                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                            Pending Review
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(course, 'published')}
                                                            disabled={isUpdatingStatus}
                                                            className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/5 flex items-center gap-2 ${
                                                                course.status === 'published' ? 'text-green-400' : 'text-slate-300'
                                                            }`}
                                                        >
                                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                            Published
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(course, 'archived')}
                                                            disabled={isUpdatingStatus}
                                                            className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/5 flex items-center gap-2 ${
                                                                course.status === 'archived' ? 'text-orange-400' : 'text-slate-300'
                                                            }`}
                                                        >
                                                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                                            Archived
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {/* View Public Page */}
                                            <Link
                                                href={`/dashboard?courseId=${course.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                                title="View Public Page"
                                            >
                                                <Eye size={16} />
                                            </Link>
                                            {/* Edit */}
                                            <Link
                                                href={`/admin/courses/${course.id}/builder`}
                                                className="px-3 py-1.5 rounded-lg bg-brand-blue-light/10 border border-brand-blue-light/20 text-brand-blue-light text-xs font-bold hover:bg-brand-blue-light hover:text-brand-black transition-colors"
                                            >
                                                Edit
                                            </Link>
                                            {/* Promote to Production (dev only) */}
                                            <CoursePromotionButton
                                                course={{
                                                    id: Number(course.id),
                                                    title: course.title,
                                                    status: course.status || 'draft'
                                                }}
                                            />
                                            {/* Delete */}
                                            <button
                                                onClick={() => setCourseToDelete(course)}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                                                title="Delete Course"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCourses.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-500">
                                        {hasActiveFilters ? 'No courses match your filters.' : 'No courses found. Create your first one!'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {courseToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
                                <AlertTriangle size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Delete Course?</h2>
                            <p className="text-slate-400">
                                Are you sure you want to delete <span className="text-white font-medium">{courseToDelete.title}</span>?
                                <br />
                                This will permanently delete all modules, lessons, and resources.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCourseToDelete(null)}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-medium transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteCourse}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 bg-red-500 text-white hover:bg-red-600 rounded-xl font-bold transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Course'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
    if (status === 'pending_review') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Pending Review
            </span>
        );
    }
    if (status === 'archived') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider">
                Archived
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-wider">
            Draft
        </span>
    );
}
