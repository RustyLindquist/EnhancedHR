import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, Star, DollarSign, TrendingUp, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

interface ExpertWithCourses {
    id: string;
    full_name: string;
    expert_title: string | null;
    avatar_url: string | null;
    author_bio: string | null;
    publishedCourseCount: number;
    isStandalone: boolean;
}

export default async function ExpertsPage() {
    const supabase = await createClient();

    // Fetch experts/admins with their published courses
    const { data: expertsData } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            expert_title,
            avatar_url,
            author_bio,
            role,
            author_status
        `)
        .or('author_status.eq.approved,role.eq.admin');

    // Fetch standalone experts
    const { data: standaloneExpertsData } = await supabase
        .from('standalone_experts')
        .select(`
            id,
            full_name,
            expert_title,
            avatar_url,
            author_bio
        `)
        .eq('is_active', true);

    // Fetch published courses grouped by author
    const { data: coursesData } = await supabase
        .from('courses')
        .select('author_id, standalone_expert_id')
        .eq('status', 'published');

    // Count published courses per author (regular and standalone)
    const courseCountByAuthor: Record<string, number> = {};
    const courseCountByStandaloneExpert: Record<string, number> = {};
    coursesData?.forEach(course => {
        if (course.author_id) {
            courseCountByAuthor[course.author_id] = (courseCountByAuthor[course.author_id] || 0) + 1;
        }
        if (course.standalone_expert_id) {
            courseCountByStandaloneExpert[course.standalone_expert_id] = (courseCountByStandaloneExpert[course.standalone_expert_id] || 0) + 1;
        }
    });

    // Filter to only experts with published courses (regular experts)
    const regularExpertsWithCourses: ExpertWithCourses[] = (expertsData || [])
        .filter(expert => courseCountByAuthor[expert.id] > 0)
        .map(expert => ({
            id: expert.id,
            full_name: expert.full_name || 'Expert',
            expert_title: expert.expert_title,
            avatar_url: expert.avatar_url,
            author_bio: expert.author_bio,
            publishedCourseCount: courseCountByAuthor[expert.id],
            isStandalone: false
        }));

    // Filter to only standalone experts with published courses
    const standaloneExpertsWithCourses: ExpertWithCourses[] = (standaloneExpertsData || [])
        .filter(expert => courseCountByStandaloneExpert[expert.id] > 0)
        .map(expert => ({
            id: expert.id,
            full_name: expert.full_name || 'Expert',
            expert_title: expert.expert_title,
            avatar_url: expert.avatar_url,
            author_bio: expert.author_bio,
            publishedCourseCount: courseCountByStandaloneExpert[expert.id],
            isStandalone: true
        }));

    // Combine and sort by course count
    const expertsWithPublishedCourses = [...regularExpertsWithCourses, ...standaloneExpertsWithCourses]
        .sort((a, b) => b.publishedCourseCount - a.publishedCourseCount);

    return (
        <div className="overflow-hidden">

            {/* --- HERO SECTION --- */}
            <section className="relative min-h-[80vh] flex items-center justify-center pt-20">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-1/2 translate-x-1/2 w-[1000px] h-[600px] bg-brand-orange/10 rounded-full blur-[120px] opacity-40 animate-pulse-slow"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-brand-blue-light animate-pulse"></span>
                        <span className="text-sm font-medium text-slate-300">Join Our Expert Network</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight mb-8 leading-tight">
                        Teach the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-red">Future</span>
                        <br />
                        of Human Resources.
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
                        Share your expertise, build your personal brand, and earn revenue by creating courses for the next generation of HR leaders.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                        <Link
                            href="/join/expert"
                            className="px-8 py-4 rounded-full bg-brand-orange text-white font-bold text-lg hover:bg-white hover:text-brand-black transition-all shadow-[0_0_30px_rgba(255,147,0,0.4)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] hover:-translate-y-1 flex items-center gap-2"
                        >
                            Become an Expert <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- BENEFITS SECTION --- */}
            <section className="py-32 bg-[#05080a] relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Why Teach on EnhancedHR?</h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            We provide the platform, the audience, and the AI tools to help you create world-class content.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {/* Benefit 1 */}
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-blue-light/30 transition-all group">
                            <div className="w-14 h-14 rounded-xl bg-brand-blue-light/10 flex items-center justify-center text-brand-blue-light mb-6 group-hover:scale-110 transition-transform">
                                <DollarSign size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">Fair Revenue Share</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Earn competitive royalties based on watch time and course engagement. We believe creators should be rewarded for their impact.
                            </p>
                        </div>

                        {/* Benefit 2 */}
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-orange/30 transition-all group">
                            <div className="w-14 h-14 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange mb-6 group-hover:scale-110 transition-transform">
                                <TrendingUp size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">Build Your Brand</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Reach thousands of HR professionals and decision-makers. Establish yourself as a thought leader in your niche.
                            </p>
                        </div>

                        {/* Benefit 3 */}
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all group">
                            <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                                <Zap size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">AI-Enhanced Content</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Our platform automatically generates quizzes, summaries, and AI tutor interactions from your video content, making your course more valuable without extra work.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- HOW IT WORKS --- */}
            <section className="py-32 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                        {/* Left: Steps */}
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-12">
                                How it Works
                            </h2>

                            <div className="space-y-12">
                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-xl border border-white/10">1</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">Apply to Join</h3>
                                        <p className="text-slate-400">Submit your profile and a brief proposal. We vet all instructors to ensure high-quality content.</p>
                                    </div>
                                </div>

                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-xl border border-white/10">2</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">Create Your Course</h3>
                                        <p className="text-slate-400">Record your video lessons. Upload them to our platform. We handle hosting, encoding, and AI processing.</p>
                                    </div>
                                </div>

                                <div className="flex gap-6">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-xl border border-white/10">3</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">Launch & Earn</h3>
                                        <p className="text-slate-400">Your course goes live to our global audience. Track your students and earnings in your instructor dashboard.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Visual */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/20 to-brand-red/20 blur-3xl -z-10"></div>
                            <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-8 transform rotate-3 hover:rotate-0 transition-all duration-500 shadow-2xl">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-white font-bold">Expert Console</h3>
                                    <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">Live</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                                        <div className="text-slate-400 text-xs mb-1">Total Students</div>
                                        <div className="text-2xl font-bold text-white">1,240</div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                                        <div className="text-slate-400 text-xs mb-1">Course Rating</div>
                                        <div className="text-2xl font-bold text-white flex items-center gap-1">4.9 <Star size={16} className="text-brand-orange fill-current" /></div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="h-24 rounded-lg bg-white/5 border border-white/5 p-4 flex gap-4 items-center">
                                        <div className="w-16 h-16 rounded bg-slate-700"></div>
                                        <div>
                                            <div className="w-32 h-3 bg-white/20 rounded mb-2"></div>
                                            <div className="w-20 h-2 bg-white/10 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="h-24 rounded-lg bg-white/5 border border-white/5 p-4 flex gap-4 items-center">
                                        <div className="w-16 h-16 rounded bg-slate-700"></div>
                                        <div>
                                            <div className="w-32 h-3 bg-white/20 rounded mb-2"></div>
                                            <div className="w-20 h-2 bg-white/10 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* --- EXPERT DIRECTORY SECTION --- */}
            {expertsWithPublishedCourses.length > 0 && (
                <section className="py-32 bg-[#05080a] border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Meet Our Experts</h2>
                            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                                Learn from industry leaders who are shaping the future of HR.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {expertsWithPublishedCourses.map(expert => (
                                <Link
                                    key={`${expert.id}-${expert.isStandalone ? 'standalone' : 'regular'}`}
                                    href={expert.isStandalone ? `/experts/standalone/${expert.id}` : `/experts/${expert.id}`}
                                    className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-blue-light/30 transition-all hover:-translate-y-1"
                                >
                                    {/* Avatar */}
                                    <div className="flex justify-center mb-4">
                                        {expert.avatar_url ? (
                                            <Image
                                                src={expert.avatar_url}
                                                alt={expert.full_name}
                                                width={80}
                                                height={80}
                                                className="w-20 h-20 rounded-full object-cover border-2 border-white/10 group-hover:border-brand-blue-light/50 transition-colors"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-blue-light/20 to-brand-orange/20 flex items-center justify-center text-2xl font-bold text-white border-2 border-white/10">
                                                {expert.full_name.charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Name & Title */}
                                    <div className="text-center">
                                        <h3 className="text-lg font-bold text-white group-hover:text-brand-blue-light transition-colors">
                                            {expert.full_name}
                                        </h3>
                                        {expert.expert_title && (
                                            <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                                                {expert.expert_title}
                                            </p>
                                        )}

                                        {/* Course Count */}
                                        <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-slate-500">
                                            <BookOpen size={14} />
                                            <span>{expert.publishedCourseCount} {expert.publishedCourseCount === 1 ? 'Course' : 'Courses'}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* --- CTA SECTION --- */}
            <section className="py-32 bg-gradient-to-b from-[#05080a] to-[#0A0D12] border-t border-white/5">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
                        Ready to share your knowledge?
                    </h2>
                    <Link
                        href="/join/expert"
                        className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-white text-brand-black font-bold text-xl hover:bg-brand-orange hover:text-white transition-all shadow-2xl hover:scale-105"
                    >
                        Apply Now <ArrowRight size={24} />
                    </Link>
                </div>
            </section>

        </div>
    );
}
