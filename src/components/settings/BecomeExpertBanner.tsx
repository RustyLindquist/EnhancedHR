'use client';

import { useState } from 'react';
import { ChevronDown, DollarSign, TrendingUp, Zap, ArrowRight } from 'lucide-react';

interface BecomeExpertBannerProps {
    onSubmitProposal: () => void;
}

export default function BecomeExpertBanner({ onSubmitProposal }: BecomeExpertBannerProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm overflow-hidden">
            {/* Collapsed State - Banner */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors group"
            >
                <div className="flex-1 text-left">
                    {/* Gradient accent bar */}
                    <div className="mb-3 h-1 w-16 bg-gradient-to-r from-brand-orange to-brand-red rounded-full opacity-70 group-hover:opacity-100 transition-opacity"></div>

                    <h3 className="text-xl font-bold text-white mb-2">
                        Want to Share Your HR Expertise?
                    </h3>
                    <p className="text-sm text-slate-400">
                        Join our community of expert instructors and help shape the future of HR education
                    </p>
                </div>

                <div className="ml-6 flex items-center gap-3">
                    <div className="hidden md:block text-xs font-bold text-brand-orange uppercase tracking-wider">
                        Learn More
                    </div>
                    <div className={`p-2 rounded-full bg-brand-orange/10 text-brand-orange transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={20} />
                    </div>
                </div>
            </button>

            {/* Expanded State - Info Panel */}
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="p-8 pt-0 space-y-8">

                    {/* Value Props Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Benefit 1: Fair Revenue Share */}
                        <div className="p-6 rounded-xl bg-black/30 border border-white/10 hover:border-brand-blue-light/30 transition-all group">
                            <div className="w-12 h-12 rounded-lg bg-brand-blue-light/10 flex items-center justify-center text-brand-blue-light mb-4 group-hover:scale-110 transition-transform">
                                <DollarSign size={24} />
                            </div>
                            <h4 className="text-lg font-bold text-white mb-2">Fair Revenue Share</h4>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Earn competitive royalties based on watch time and course engagement. We believe creators should be rewarded for their impact.
                            </p>
                        </div>

                        {/* Benefit 2: Build Your Brand */}
                        <div className="p-6 rounded-xl bg-black/30 border border-white/10 hover:border-brand-orange/30 transition-all group">
                            <div className="w-12 h-12 rounded-lg bg-brand-orange/10 flex items-center justify-center text-brand-orange mb-4 group-hover:scale-110 transition-transform">
                                <TrendingUp size={24} />
                            </div>
                            <h4 className="text-lg font-bold text-white mb-2">Build Your Brand</h4>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Reach thousands of HR professionals and decision-makers. Establish yourself as a thought leader in your niche.
                            </p>
                        </div>

                        {/* Benefit 3: AI-Enhanced Content */}
                        <div className="p-6 rounded-xl bg-black/30 border border-white/10 hover:border-purple-500/30 transition-all group">
                            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                                <Zap size={24} />
                            </div>
                            <h4 className="text-lg font-bold text-white mb-2">AI-Enhanced Content</h4>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Our platform automatically generates quizzes, summaries, and AI tutor interactions from your video content, making your course more valuable without extra work.
                            </p>
                        </div>

                    </div>

                    {/* How It Works */}
                    <div className="pt-6 border-t border-white/10">
                        <h4 className="text-xl font-bold text-white mb-6">How It Works</h4>

                        <div className="space-y-6">

                            {/* Step 1 */}
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold border border-white/10">
                                    1
                                </div>
                                <div>
                                    <h5 className="text-base font-bold text-white mb-1">Apply to Join</h5>
                                    <p className="text-sm text-slate-400">
                                        Submit your profile and course proposal. We vet all instructors to ensure high-quality content.
                                    </p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold border border-white/10">
                                    2
                                </div>
                                <div>
                                    <h5 className="text-base font-bold text-white mb-1">Create Your Course</h5>
                                    <p className="text-sm text-slate-400">
                                        Record and upload video lessons. We handle hosting, encoding, and AI processing.
                                    </p>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold border border-white/10">
                                    3
                                </div>
                                <div>
                                    <h5 className="text-base font-bold text-white mb-1">Launch & Earn</h5>
                                    <p className="text-sm text-slate-400">
                                        Go live and track your students and earnings in your instructor dashboard.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* CTA Button */}
                    <div className="pt-6 border-t border-white/10 flex justify-center">
                        <button
                            onClick={onSubmitProposal}
                            className="px-8 py-4 rounded-full bg-brand-orange text-white font-bold hover:bg-brand-orange/90 transition-all shadow-[0_0_30px_rgba(255,147,0,0.4)] hover:shadow-[0_0_50px_rgba(255,147,0,0.6)] hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            Submit a Proposal <ArrowRight size={20} />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
