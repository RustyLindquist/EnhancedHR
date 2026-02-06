import type { Metadata } from 'next';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Award, GraduationCap, Briefcase, Star, BookMarked, Trophy } from 'lucide-react';
import ExpertDetailsHeader from '@/components/ExpertDetailsHeader';
import ExpertCoursesContent from './ExpertCoursesContent';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createClient();
    const { data: expert } = await supabase.from('profiles').select('full_name, expert_title').eq('id', id).single();
    return {
        title: expert ? `${expert.full_name} — EnhancedHR.ai` : 'Expert — EnhancedHR.ai',
        description: expert?.expert_title ? `${expert.full_name}, ${expert.expert_title}. View courses and credentials on EnhancedHR.ai.` : 'Expert instructor on EnhancedHR.ai.',
    };
}

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

export default async function ExpertPage({ params }: ExpertPageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch expert profile (must be admin OR approved expert)
    const { data: expert } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            expert_title,
            author_bio,
            avatar_url,
            linkedin_url,
            role,
            author_status
        `)
        .eq('id', id)
        .or('role.eq.admin,author_status.eq.approved')
        .single();

    if (!expert) {
        notFound();
    }

    // Fetch their published courses
    const { data: courses } = await supabase
        .from('courses')
        .select('id, title, description, image_url, category, duration, badges')
        .eq('author_id', id)
        .eq('status', 'published');

    // Only show page if they have published courses
    if (!courses || courses.length === 0) {
        notFound();
    }

    // Fetch credentials
    const { data: credentials } = await supabase
        .from('expert_credentials')
        .select('id, title, type, display_order')
        .eq('expert_id', id)
        .order('display_order');

    return (
        <div className="min-h-screen bg-brand-black">
            {/* Header */}
            <ExpertDetailsHeader linkedinUrl={expert.linkedin_url} />

            {/* Hero Section */}
            <section className="relative py-20">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                </div>

                <div className="relative max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row gap-12 items-start">
                        {/* Left: Avatar & Basic Info */}
                        <div className="flex-shrink-0">
                            {expert.avatar_url ? (
                                <Image
                                    src={expert.avatar_url}
                                    alt={expert.full_name || 'Expert'}
                                    width={576}
                                    height={576}
                                    className="w-[576px] h-[576px] rounded-2xl object-cover border-2 border-white/10 shadow-2xl"
                                />
                            ) : (
                                <div className="w-[576px] h-[576px] rounded-2xl bg-gradient-to-br from-brand-blue-light/20 to-brand-orange/20 flex items-center justify-center text-[180px] font-bold text-white border-2 border-white/10">
                                    {(expert.full_name || 'E').charAt(0)}
                                </div>
                            )}
                        </div>

                        {/* Right: Details */}
                        <div className="flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
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
            <ExpertCoursesContent
                courses={courses}
                expertFirstName={expert.full_name?.split(' ')[0] || 'this Expert'}
            />

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
