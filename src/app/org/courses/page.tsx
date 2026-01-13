import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getOrgContext } from '@/lib/org-context';
import { fetchOrgCoursesAction, getOrgCourseCounts } from '@/app/actions/org-courses';
import OrgCoursesClient from './OrgCoursesClient';

interface OrgCoursesPageProps {
    searchParams: Promise<{ status?: string }>;
}

export default async function OrgCoursesPage({ searchParams }: OrgCoursesPageProps) {
    // Get org context (handles platform admin org selection automatically)
    const orgContext = await getOrgContext();

    if (!orgContext) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-slate-400 text-lg">Access Denied</p>
                    <p className="text-slate-500 text-sm mt-2">You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }

    // Await searchParams before accessing
    const params = await searchParams;

    // Determine status filter from URL
    const statusParam = params.status;
    const status: 'published' | 'draft' = statusParam === 'draft' ? 'draft' : 'published';

    // Check if user can view drafts (org admin or platform admin)
    const canViewDrafts = orgContext.isPlatformAdmin || orgContext.isOrgAdmin;

    // Fetch courses and counts in parallel
    const [coursesResult, countsResult] = await Promise.all([
        fetchOrgCoursesAction(orgContext.orgId, status),
        getOrgCourseCounts(orgContext.orgId)
    ]);

    const { courses } = coursesResult;
    const { published: publishedCount, draft: draftCount } = countsResult;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Glassy Header Area */}
            <div className="relative">
                {/* Header Content */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Organization Courses</h1>
                        <p className="text-slate-400">
                            {canViewDrafts
                                ? 'Create and manage courses for your organization.'
                                : 'Courses created by your organization.'}
                        </p>
                    </div>

                    {/* Actions (org admins only) */}
                    {canViewDrafts && (
                        <div className="flex items-center gap-4">
                            {/* Status Toggle */}
                            <OrgCoursesClient
                                currentStatus={status}
                                publishedCount={publishedCount}
                                draftCount={draftCount}
                            />

                            {/* Create Course Button */}
                            <Link
                                href="/org/courses/new/builder"
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase tracking-wider text-sm transition-colors whitespace-nowrap"
                            >
                                Create A Course
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Course Grid */}
            {courses.length > 0 ? (
                <div
                    className="grid gap-6 pb-20"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
                >
                    {courses.map((course, index) => (
                        <Link
                            key={course.id}
                            href={`/org/courses/${course.id}`}
                            className="animate-fade-in-up block"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="relative group w-full aspect-[4/3] min-h-[280px] rounded-2xl overflow-hidden border border-white/10 bg-[#0B1120] shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)] hover:border-white/20 hover:scale-[1.02]">
                                {/* Image Section */}
                                <div className="relative h-[55%] w-full overflow-hidden bg-black">
                                    {course.image ? (
                                        <>
                                            <Image
                                                src={course.image}
                                                alt={course.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/30 to-transparent"></div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800">
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/30 to-transparent"></div>
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className="absolute top-3 left-3 z-20">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            course.status === 'published'
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        }`}>
                                            {course.status === 'published' ? 'Published' : 'Draft'}
                                        </span>
                                    </div>

                                    {/* Title on Image */}
                                    <div className="absolute bottom-3 left-0 right-0 px-4 z-10">
                                        <h3 className="font-bold text-white text-lg leading-tight mb-1 drop-shadow-md line-clamp-2">
                                            {course.title}
                                        </h3>
                                        {course.author && (
                                            <p className="text-xs font-medium text-white/70 tracking-wide truncate">
                                                {course.author}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="h-[45%] px-4 py-3 flex flex-col justify-between bg-[#0B1120]">
                                    {/* Description */}
                                    <p className="text-[13px] text-slate-400 leading-relaxed line-clamp-2 font-light">
                                        {course.description || 'No description provided.'}
                                    </p>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"/>
                                                <polyline points="12 6 12 12 16 14"/>
                                            </svg>
                                            <span className="text-[10px] font-bold tracking-wider uppercase">
                                                {course.duration || '0m'}
                                            </span>
                                        </div>

                                        {/* Category Badge */}
                                        {course.category && (
                                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/5 text-slate-400 border border-white/10 uppercase tracking-wide truncate max-w-[120px]">
                                                {course.category}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-2xl">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                        </svg>
                    </div>
                    <p className="text-slate-400 text-lg mb-2">
                        {canViewDrafts
                            ? (status === 'draft' ? 'No draft courses yet.' : 'No published courses yet.')
                            : 'No organization courses available yet.'}
                    </p>
                    {canViewDrafts && (
                        <p className="text-slate-500 text-sm">
                            {status === 'draft'
                                ? 'Create your first organization course to get started!'
                                : 'Publish a course to make it available to your team.'}
                        </p>
                    )}
                    {canViewDrafts && courses.length === 0 && (
                        <Link
                            href="/org/courses/new/builder"
                            className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase tracking-wider text-sm transition-colors"
                        >
                            Create Your First Course
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
