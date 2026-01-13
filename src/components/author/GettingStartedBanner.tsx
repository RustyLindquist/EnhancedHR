'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Sparkles, User, FileText, BookOpen, ArrowRight, Rocket, Star, Lightbulb } from 'lucide-react';

const STORAGE_KEY = 'expert_getting_started_dismissed';

export default function GettingStartedBanner() {
    const [isDismissed, setIsDismissed] = useState(true); // Start hidden to prevent flash
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Check localStorage on mount
        const dismissed = localStorage.getItem(STORAGE_KEY) === 'true';
        setIsDismissed(dismissed);
        setIsLoaded(true);
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsDismissed(true);
    };

    // Don't render anything until we've checked localStorage
    if (!isLoaded || isDismissed) return null;

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 shadow-2xl">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Gradient orbs */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-orange/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-brand-blue-light/15 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

                {/* Decorative grid pattern */}
                <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Floating decorative icons */}
                <div className="absolute top-8 right-32 text-brand-orange/20 animate-pulse">
                    <Star size={24} />
                </div>
                <div className="absolute bottom-12 right-20 text-purple-400/20 animate-pulse" style={{ animationDelay: '0.5s' }}>
                    <Lightbulb size={20} />
                </div>
                <div className="absolute top-16 left-1/4 text-brand-blue-light/20 animate-pulse" style={{ animationDelay: '1s' }}>
                    <Sparkles size={18} />
                </div>
            </div>

            {/* Dismiss Button */}
            <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all group"
                aria-label="Dismiss getting started guide"
            >
                <X size={18} className="group-hover:rotate-90 transition-transform duration-200" />
            </button>

            {/* Content */}
            <div className="relative p-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-brand-orange to-brand-red shadow-lg shadow-brand-orange/20">
                        <Rocket size={20} className="text-white" />
                    </div>
                    <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">Getting Started</span>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    Welcome to the Expert Console
                </h2>
                <p className="text-slate-400 max-w-2xl mb-8">
                    You're now part of an exclusive community of HR thought leaders. Here's how to make the most of your expertise and start earning.
                </p>

                {/* Three Paths */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Path 1: Expert Profile */}
                    <Link
                        href="/settings/account"
                        className="group p-6 rounded-xl bg-white/5 border border-white/10 hover:border-brand-blue-light/50 hover:bg-white/10 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-blue-light/10"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-blue-light/20 to-brand-blue-light/5 flex items-center justify-center text-brand-blue-light group-hover:scale-110 transition-transform">
                                <User size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-brand-blue-light bg-brand-blue-light/10 px-2 py-0.5 rounded-full">Step 1</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-brand-blue-light transition-colors">
                                    Complete Your Profile
                                </h3>
                                <p className="text-sm text-slate-400">
                                    Add your bio, credentials, and photo to build credibility with learners.
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-xs font-bold text-brand-blue-light opacity-0 group-hover:opacity-100 transition-opacity">
                            Edit Profile <ArrowRight size={14} />
                        </div>
                    </Link>

                    {/* Path 2: Course Proposal */}
                    <div className="group p-6 rounded-xl bg-white/5 border border-white/10 hover:border-brand-orange/50 hover:bg-white/10 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-orange/10 cursor-default">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-orange/20 to-brand-orange/5 flex items-center justify-center text-brand-orange group-hover:scale-110 transition-transform">
                                <FileText size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full">Step 2</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-brand-orange transition-colors">
                                    Submit a Course Proposal
                                </h3>
                                <p className="text-sm text-slate-400">
                                    Pitch your course idea below. Once approved, you can start building.
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-xs font-bold text-brand-orange opacity-0 group-hover:opacity-100 transition-opacity">
                            See form below <ArrowRight size={14} />
                        </div>
                    </div>

                    {/* Path 3: Build Course */}
                    <Link
                        href="/author/courses"
                        className="group p-6 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                <BookOpen size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">Step 3</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
                                    Build Your Course
                                </h3>
                                <p className="text-sm text-slate-400">
                                    Use our course builder to create engaging content. Submit for review when ready.
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-xs font-bold text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            Go to My Courses <ArrowRight size={14} />
                        </div>
                    </Link>
                </div>

                {/* Pro Tips */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-brand-orange/10 border border-yellow-500/20">
                    <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-yellow-500/20">
                            <Sparkles size={16} className="text-yellow-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-yellow-400 mb-1">Pro Tips for Success</h4>
                            <ul className="text-sm text-slate-400 space-y-1">
                                <li className="flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-yellow-500/50" />
                                    Your earnings are based on watch time — create comprehensive, valuable content
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-yellow-500/50" />
                                    AI automatically generates quizzes and transcripts from your videos
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-yellow-500/50" />
                                    Start with a topic you know deeply — authenticity drives engagement
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Dismiss text link */}
                <div className="mt-6 text-center">
                    <button
                        onClick={handleDismiss}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        I've got it, don't show this again
                    </button>
                </div>
            </div>
        </div>
    );
}
