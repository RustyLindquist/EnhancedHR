'use client';

import React, { useState, useTransition } from 'react';
import { FileText, BookOpen, Loader2, CheckCircle, Clock, Briefcase, Linkedin, Phone } from 'lucide-react';
import { submitExpertProposal } from '@/app/actions/expert-application';

interface ExpertProposalFormProps {
    userId: string;
    fullName: string;
    existingTitle?: string;
    existingLinkedIn?: string;
    existingBio?: string;
    onSubmitSuccess: () => void;
}

export default function ExpertProposalForm({
    userId,
    fullName,
    existingTitle,
    existingLinkedIn,
    existingBio,
    onSubmitSuccess,
}: ExpertProposalFormProps) {
    const [isPending, startTransition] = useTransition();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        expert_title: existingTitle || '',
        phone_number: '',
        linkedin_url: existingLinkedIn || '',
        author_bio: existingBio || '',
        course_proposal_title: '',
        course_proposal_description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate required fields
        if (!formData.course_proposal_title.trim()) {
            setError('Course title is required');
            return;
        }
        if (formData.course_proposal_title.length > 150) {
            setError('Course title must be 150 characters or less');
            return;
        }
        if (!formData.course_proposal_description.trim()) {
            setError('Course description is required');
            return;
        }
        if (formData.course_proposal_description.length > 2000) {
            setError('Course description must be 2000 characters or less');
            return;
        }

        startTransition(async () => {
            const result = await submitExpertProposal({
                ...formData,
                full_name: fullName,
            });

            if (result.success) {
                setIsSubmitted(true);
                onSubmitSuccess();
            } else {
                setError(result.error || 'Failed to submit application');
            }
        });
    };

    // Success state - show submitted status card
    if (isSubmitted) {
        return (
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-brand-orange/10 text-brand-orange">
                        <CheckCircle size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Become an Expert</h2>
                </div>

                <div className="bg-brand-orange/10 border border-brand-orange/30 rounded-2xl p-8 backdrop-blur-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-brand-orange/20 text-brand-orange flex-shrink-0">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2">Application Submitted</h3>
                            <p className="text-slate-300 text-sm mb-4">
                                Thank you for applying to become an EnhancedHR Expert. Our team is reviewing your profile and course proposal. We typically respond within 48 hours.
                            </p>
                            <p className="text-xs text-slate-500">
                                Someone from our team will reach out to you soon.
                            </p>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-white/10">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-brand-blue-light flex items-center justify-center text-brand-black font-bold">
                                <CheckCircle size={16} />
                            </div>
                            <span className="text-xs text-brand-blue-light mt-1">Submitted</span>
                        </div>
                        <div className="w-24 h-0.5 bg-gradient-to-r from-brand-blue-light/50 to-brand-orange/50 animate-pulse"></div>
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-brand-orange/20 border-2 border-brand-orange flex items-center justify-center text-brand-orange font-bold animate-pulse">
                                <Clock size={16} />
                            </div>
                            <span className="text-xs text-brand-orange mt-1">Under Review</span>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // Form state
    return (
        <section>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-brand-orange/10 text-brand-orange">
                    <BookOpen size={24} />
                </div>
                <h2 className="text-2xl font-bold text-white">Become an Expert</h2>
            </div>

            <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm space-y-6">
                <p className="text-slate-400 text-sm">
                    Apply to become an EnhancedHR Expert and share your knowledge by creating courses for HR professionals.
                </p>

                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Professional Title - Optional but encouraged */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Professional Title
                    </label>
                    <p className="text-xs text-slate-600 mb-2">
                        Your role or title (e.g., &quot;Senior HR Consultant&quot;, &quot;CHRO&quot;, &quot;HR Director&quot;)
                    </p>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 focus-within:border-brand-blue-light/50 transition-colors">
                        <Briefcase size={16} className="text-slate-400" />
                        <input
                            type="text"
                            value={formData.expert_title}
                            onChange={(e) => setFormData({ ...formData, expert_title: e.target.value })}
                            placeholder="Senior HR Consultant"
                            className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                            disabled={isPending}
                        />
                    </div>
                </div>

                {/* Phone Number - Optional */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Phone Number
                    </label>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 focus-within:border-brand-blue-light/50 transition-colors">
                        <Phone size={16} className="text-slate-400" />
                        <input
                            type="tel"
                            value={formData.phone_number}
                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                            placeholder="+1 (555) 123-4567"
                            className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                            disabled={isPending}
                        />
                    </div>
                </div>

                {/* LinkedIn URL - Optional */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        LinkedIn Profile
                    </label>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 focus-within:border-brand-blue-light/50 transition-colors">
                        <Linkedin size={16} className="text-slate-400" />
                        <input
                            type="url"
                            value={formData.linkedin_url}
                            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                            placeholder="https://linkedin.com/in/your-profile"
                            className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                            disabled={isPending}
                        />
                    </div>
                </div>

                {/* Expert Bio - Optional */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Expert Bio
                    </label>
                    <p className="text-xs text-slate-600 mb-2">
                        A short bio that will be displayed on your course pages and expert profile
                    </p>
                    <textarea
                        value={formData.author_bio}
                        onChange={(e) => setFormData({ ...formData, author_bio: e.target.value.slice(0, 500) })}
                        placeholder="Write a compelling bio that introduces you to learners. Describe your expertise, experience, and what makes you passionate about teaching this subject..."
                        rows={4}
                        maxLength={500}
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none resize-none focus:border-brand-blue-light/50 transition-colors"
                        disabled={isPending}
                    />
                    <p className="text-xs text-slate-600 text-right mt-1">
                        {formData.author_bio.length}/500
                    </p>
                </div>

                {/* Course Proposal Section */}
                <div className="pt-6 border-t border-white/10">
                    <h3 className="text-xs font-bold text-brand-orange uppercase tracking-wider mb-4 flex items-center gap-2">
                        <BookOpen size={12} />
                        Course Proposal
                    </h3>

                    {/* Course Title - Required */}
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Proposed Course Title <span className="text-brand-orange">*</span>
                        </label>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 focus-within:border-brand-orange/50 transition-colors">
                            <FileText size={16} className="text-slate-400" />
                            <input
                                type="text"
                                value={formData.course_proposal_title}
                                onChange={(e) => setFormData({ ...formData, course_proposal_title: e.target.value.slice(0, 150) })}
                                placeholder="E.g., Strategic Talent Acquisition in the AI Era"
                                maxLength={150}
                                className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                                disabled={isPending}
                                required
                            />
                        </div>
                        <p className="text-xs text-slate-600 text-right mt-1">
                            {formData.course_proposal_title.length}/150
                        </p>
                    </div>

                    {/* Course Description - Required */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Course Description & Outline <span className="text-brand-orange">*</span>
                        </label>
                        <p className="text-xs text-slate-600 mb-2">
                            Describe the course content, target audience, key learning outcomes, and rough module outline
                        </p>
                        <textarea
                            value={formData.course_proposal_description}
                            onChange={(e) => setFormData({ ...formData, course_proposal_description: e.target.value.slice(0, 2000) })}
                            placeholder={`Describe your course idea in detail. Include:
• What problems does this course solve?
• Who is the target audience?
• What will learners be able to do after completing it?
• Rough outline of modules/lessons`}
                            rows={8}
                            maxLength={2000}
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none resize-none focus:border-brand-orange/50 transition-colors"
                            disabled={isPending}
                            required
                        />
                        <p className="text-xs text-slate-600 text-right mt-1">
                            {formData.course_proposal_description.length}/2000
                        </p>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4 border-t border-white/5">
                    <button
                        type="submit"
                        disabled={isPending || !formData.course_proposal_title.trim() || !formData.course_proposal_description.trim()}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-orange to-red-500 text-white rounded-lg text-sm font-bold hover:shadow-[0_0_20px_rgba(255,147,0,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={18} />
                                Submit Application
                            </>
                        )}
                    </button>
                </div>
            </form>
        </section>
    );
}
