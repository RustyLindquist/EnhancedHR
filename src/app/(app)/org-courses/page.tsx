import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, BookOpen, Lightbulb } from 'lucide-react';
import { getOrgContext } from '@/lib/org-context';
import { fetchOrgCoursesAction, getOrgCourseCounts } from '@/app/actions/org-courses';
import OrgCoursesClient from './OrgCoursesClient';
import OrgCourseAIPanelWrapper from './OrgCourseAIPanelWrapper';

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
        <div className="flex flex-col h-full">
            {/* Glassy Header - Canvas Style */}
            <div className="h-24 flex-shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-xl z-30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] flex items-center justify-between px-10">
                <div>
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                            My Organization
                        </span>
                    </div>
                    <h1 className="text-3xl font-light text-white tracking-tight">
                        Organization <span className="font-bold text-white">Courses</span>
                    </h1>
                </div>

                {/* Actions (org admins only) */}
                {canViewDrafts && (
                    <div className="flex items-center gap-3">
                        {/* Status Toggle */}
                        <OrgCoursesClient
                            currentStatus={status}
                            publishedCount={publishedCount}
                            draftCount={draftCount}
                        />

                        {/* Create Course Button */}
                        <Link
                            href="/org-courses/new/builder"
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider text-amber-400 hover:bg-amber-500/20 transition-all hover:scale-105"
                        >
                            <Plus size={14} /> Create Course
                        </Link>
                    </div>
                )}
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {/* Course Grid - Only show when there are courses */}
                {courses.length > 0 && (
                    <div
                        className="grid gap-6 pb-8 animate-fade-in"
                        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
                    >
                        {courses.map((course, index) => (
                            <Link
                                key={course.id}
                                href={`/org-courses/${course.id}`}
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
                )}

                {/* Help Text / About Section - always shown, pushed down when courses exist */}
                <div className={`max-w-3xl animate-fade-in mx-auto pb-20 ${courses.length > 0 ? 'mt-[175px]' : 'mt-[75px]'}`}>

                    {/* Visual Header - Icon, Title, Subtitle */}
                    <div className="flex flex-col items-center justify-center mb-12">
                        <div className="mb-6 relative w-32 h-32">
                            <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full"></div>
                            <div className="relative z-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm rounded-xl rotate-3">
                                <BookOpen className="text-amber-400 w-full h-full" strokeWidth={1} />
                            </div>
                        </div>
                        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">
                            Organization Courses
                        </p>
                        <p className="text-slate-500 text-sm mt-2 max-w-md text-center leading-relaxed">
                            Custom learning content created specifically for your organization.
                        </p>
                    </div>

                    <div className="text-slate-400 text-lg space-y-6 leading-relaxed font-light mb-10 text-center">
                        <p>
                            This is where your organization can create and publish custom courses. These courses are exclusively available to members of your organization, ensuring your proprietary training content stays private.
                        </p>
                        <p>
                            Organization courses can be assigned to individual members or entire groups, making it easy to ensure everyone completes required training. Track progress and completion across your team.
                        </p>
                    </div>

                    {/* Pro Tip Box */}
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6 text-left relative overflow-hidden group hover:bg-amber-500/10 transition-colors">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors"></div>

                        <div className="flex items-start gap-4 relative z-10">
                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 flex-shrink-0">
                                <Lightbulb size={20} />
                            </div>
                            <div>
                                <h3 className="text-amber-400 font-bold uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
                                    Pro Tip
                                </h3>
                                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                                    Use organization courses for onboarding new hires, compliance training, product knowledge, or any content specific to your company. Combine with Company Collections to create structured learning paths.
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="text-slate-400 text-lg italic border-t border-amber-500/10 pt-6 mt-6 text-center">
                        Organization Courses give you complete control over your company&apos;s learning content and who has access to it.
                    </p>
                </div>
            </div>

            {/* AI Assistant Panel */}
            <OrgCourseAIPanelWrapper orgId={orgContext.orgId} orgName={orgContext.orgName} />
        </div>
    );
}
