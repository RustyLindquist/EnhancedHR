import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, Linkedin, BookOpen, Clock, Award, GraduationCap, Briefcase, Star, BookMarked, Trophy, Globe } from 'lucide-react';

// Credential type icons mapping
const credentialIcons: Record<string, React.ReactNode> = {
    certification: <Award size={16} className="text-amber-400" />,
    degree: <GraduationCap size={16} className="text-blue-400" />,
    experience: <Briefcase size={16} className="text-green-400" />,
    expertise: <Star size={16} className="text-purple-400" />,
    publication: <BookMarked size={16} className="text-pink-400" />,
    achievement: <Trophy size={16} className="text-orange-400" />
};

interface ExpertPageProps {
    params: Promise<{ id: string }>;
}

export default async function StandaloneExpertPage({ params }: ExpertPageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch standalone expert
    const { data: expert } = await supabase
        .from('standalone_experts')
        .select(`
            id,
            full_name,
            expert_title,
            author_bio,
            avatar_url,
            linkedin_url,
            website_url,
            is_active
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

    if (!expert) {
        notFound();
    }

    // Fetch their published courses
    const { data: courses } = await supabase
        .from('courses')
        .select('id, title, description, image_url, category, duration, badges')
        .eq('standalone_expert_id', id)
        .eq('status', 'published');

    // Only show page if they have published courses
    if (!courses || courses.length === 0) {
        notFound();
    }

    // Fetch credentials
    const { data: credentials } = await supabase
        .from('standalone_expert_credentials')
        .select('id, title, type, display_order')
        .eq('standalone_expert_id', id)
        .order('display_order');

    return (
        <div className="min-h-screen bg-brand-black">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-6 pt-8">
                <Link
                    href="/experts"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                >
                    <ArrowLeft size={16} />
                    Back to Experts
                </Link>
            </div>

            {/* Hero Section */}
            <section className="relative py-20">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-brand-blue-light/5 rounded-full blur-[100px]"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row gap-12 items-start">
                        {/* Left: Avatar & Basic Info */}
                        <div className="flex-shrink-0">
                            {expert.avatar_url ? (
                                <Image
                                    src={expert.avatar_url}
                                    alt={expert.full_name || 'Expert'}
                                    width={200}
                                    height={200}
                                    className="w-48 h-48 rounded-2xl object-cover border-2 border-white/10 shadow-2xl"
                                />
                            ) : (
                                <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-brand-blue-light/20 to-brand-orange/20 flex items-center justify-center text-6xl font-bold text-white border-2 border-white/10">
                                    {(expert.full_name || 'E').charAt(0)}
                                </div>
                            )}
                        </div>

                        {/* Right: Details */}
                        <div className="flex-1">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                                {expert.full_name || 'Expert'}
                            </h1>

                            {expert.expert_title && (
                                <p className="text-xl text-brand-blue-light mb-6">
                                    {expert.expert_title}
                                </p>
                            )}

                            {expert.author_bio && (
                                <p className="text-slate-400 leading-relaxed max-w-2xl mb-6">
                                    {expert.author_bio}
                                </p>
                            )}

                            {/* Links */}
                            <div className="flex items-center gap-4 flex-wrap">
                                {expert.linkedin_url && (
                                    <a
                                        href={expert.linkedin_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0077B5]/20 text-[#0077B5] hover:bg-[#0077B5]/30 transition-colors text-sm font-medium"
                                    >
                                        <Linkedin size={18} />
                                        LinkedIn Profile
                                    </a>
                                )}

                                {expert.website_url && (
                                    <a
                                        href={expert.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm font-medium"
                                    >
                                        <Globe size={18} />
                                        Website
                                    </a>
                                )}

                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <BookOpen size={16} />
                                    <span>{courses.length} {courses.length === 1 ? 'Course' : 'Courses'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Credentials Section */}
            {credentials && credentials.length > 0 && (
                <section className="py-16 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-6">
                        <h2 className="text-2xl font-bold text-white mb-8">Credentials & Background</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {credentials.map(credential => (
                                <div
                                    key={credential.id}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
                                >
                                    <div className="flex-shrink-0">
                                        {credentialIcons[credential.type] || <Award size={16} className="text-slate-400" />}
                                    </div>
                                    <span className="text-white text-sm">{credential.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Courses Section */}
            <section className="py-16 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-white mb-8">Courses by {expert.full_name?.split(' ')[0] || 'this Expert'}</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map(course => (
                            <Link
                                key={course.id}
                                href={`/?courseId=${course.id}`}
                                className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-brand-blue-light/30 transition-all hover:-translate-y-1"
                            >
                                {/* Course Image */}
                                <div className="aspect-video relative bg-slate-800">
                                    {course.image_url ? (
                                        <Image
                                            src={course.image_url}
                                            alt={course.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <BookOpen size={48} className="text-slate-600" />
                                        </div>
                                    )}

                                    {/* Category Badge */}
                                    {course.category && (
                                        <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 text-xs text-white font-medium backdrop-blur-sm">
                                            {course.category}
                                        </div>
                                    )}
                                </div>

                                {/* Course Details */}
                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-white group-hover:text-brand-blue-light transition-colors line-clamp-2 mb-2">
                                        {course.title}
                                    </h3>

                                    {course.description && (
                                        <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                                            {course.description}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        {course.duration && (
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} />
                                                <span>{course.duration}</span>
                                            </div>
                                        )}

                                        {course.badges && (
                                            <div className="flex items-center gap-1">
                                                <Award size={12} />
                                                <span>{course.badges} Credits</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 border-t border-white/5">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Want to become an expert like {expert.full_name?.split(' ')[0]}?
                    </h2>
                    <p className="text-slate-400 mb-8">
                        Share your knowledge with HR professionals around the world.
                    </p>
                    <Link
                        href="/join/expert"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-brand-orange text-white font-bold hover:bg-white hover:text-brand-black transition-all"
                    >
                        Become an Expert
                    </Link>
                </div>
            </section>
        </div>
    );
}
