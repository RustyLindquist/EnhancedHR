'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    ArrowRight, User, Mail, Phone, Building, Users, Check,
    CheckCircle, Loader2, Calendar, MessageSquare, Target
} from 'lucide-react';
import FadeIn from '@/components/marketing/FadeIn';
import HeroBackground from '@/components/marketing/HeroBackground';
import { submitDemoRequest } from '@/app/actions/leads';

const interestOptions = [
    'Learning Academy',
    'Knowledge Base',
    'AI-Enhanced Repositories',
    'Recertification Credits',
    'Build Courses For Our Org',
    'Not Sure Yet',
];

const employeeCountOptions = [
    { value: '', label: 'Select...' },
    { value: '1-50', label: '1–50 employees' },
    { value: '51-200', label: '51–200 employees' },
    { value: '201-500', label: '201–500 employees' },
    { value: '501-1000', label: '501–1,000 employees' },
    { value: '1000+', label: '1,000+ employees' },
];

const timelineOptions = [
    { value: '', label: 'Select...' },
    { value: 'immediately', label: 'Immediately' },
    { value: '1-3_months', label: '1–3 months' },
    { value: '3-6_months', label: '3–6 months' },
    { value: 'just_exploring', label: 'Just exploring' },
];

export default function DemoPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [submittedName, setSubmittedName] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const name = (formData.get('fullName') as string)?.trim();
        const email = (formData.get('email') as string)?.trim();
        const phone = (formData.get('phone') as string)?.trim();

        // Client-side validation
        if (!name) {
            setError('Full name is required.');
            setIsLoading(false);
            return;
        }
        if (!email && !phone) {
            setError('Please provide at least one contact method (email or phone).');
            setIsLoading(false);
            return;
        }

        const result = await submitDemoRequest(formData);

        if (result.error) {
            setError(result.error);
            setIsLoading(false);
        } else {
            setSubmittedName(name);
            setSubmitted(true);
            setIsLoading(false);
        }
    };

    return (
        <div className="overflow-hidden">

            {/* MAIN CONTENT */}
            <section className="relative -mt-[72px] min-h-screen bg-[#0A0D12]">
                <HeroBackground />
                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-[120px] pb-16 md:pb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

                        {/* Left Column — Hero + Benefits */}
                        <FadeIn className="lg:col-span-5 lg:sticky lg:top-28">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4B8BB3]/10 border border-[#4B8BB3]/20 text-xs font-medium text-[#4B8BB3] tracking-wide mb-6">
                                <Calendar size={12} /> REQUEST A DEMO
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
                                See EnhancedHR
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B8BB3] to-[#78C0F0]">in Action</span>
                            </h1>
                            <p className="text-lg text-slate-400 leading-relaxed mb-10">
                                Request a personalized demo and discover how AI-enhanced learning transforms your HR organization.
                            </p>
                            <ul className="space-y-5 mb-10">
                                {[
                                    'Personalized walkthrough of the platform',
                                    'See AI agents in action with your use cases',
                                    'Learn how organizations use EnhancedHR',
                                    'Get answers to your specific questions',
                                    'Explore pricing and implementation options',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-300">
                                        <Check size={18} className="text-[#4B8BB3] flex-shrink-0 mt-0.5" />
                                        <span className="text-sm leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#4B8BB3]/10 flex items-center justify-center">
                                        <MessageSquare size={18} className="text-[#4B8BB3]" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">We&apos;ll reach out fast</div>
                                        <div className="text-xs text-slate-500">Within 24 hours — usually much sooner</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 mt-8 text-slate-600 text-xs">
                                <span>SHRM Approved Provider</span>
                                <span className="w-1 h-1 rounded-full bg-slate-700" />
                                <span>HRCI Approved Provider</span>
                            </div>
                        </FadeIn>

                        {/* Right Column — Form */}
                        <FadeIn delay={150} className="lg:col-span-7">
                            <div className="bg-[#0A0D12]/90 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 sm:p-8 shadow-2xl">

                                {submitted ? (
                                    /* Success State */
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle size={32} className="text-emerald-400" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-3">Demo Request Received!</h3>
                                        <p className="text-slate-400 mb-8 max-w-sm mx-auto">
                                            Thank you, {submittedName}! We&apos;ll reach out within 24 hours — usually much sooner.
                                        </p>
                                        <Link
                                            href="/"
                                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#4B8BB3] text-white text-sm font-semibold hover:bg-[#5a9bc3] transition-all"
                                        >
                                            Back to Home <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                ) : (
                                    /* Form */
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-1">Request Your Demo</h3>
                                            <p className="text-sm text-slate-500">Fill out the form and we&apos;ll be in touch.</p>
                                        </div>

                                        {/* Full Name */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                                Full Name <span className="text-[#FF2600]">*</span>
                                            </label>
                                            <div className="relative bg-[#0A0D12] border border-white/10 rounded-lg flex items-center px-4 py-3 focus-within:border-[#4B8BB3]/50 transition-colors">
                                                <User size={16} className="text-slate-500 mr-3 flex-shrink-0" />
                                                <input
                                                    name="fullName"
                                                    type="text"
                                                    placeholder="Jane Doe"
                                                    className="bg-transparent border-none outline-none text-white placeholder-slate-700 w-full text-sm font-medium"
                                                />
                                            </div>
                                        </div>

                                        {/* Email + Phone */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
                                                <div className="relative bg-[#0A0D12] border border-white/10 rounded-lg flex items-center px-4 py-3 focus-within:border-[#4B8BB3]/50 transition-colors">
                                                    <Mail size={16} className="text-slate-500 mr-3 flex-shrink-0" />
                                                    <input
                                                        name="email"
                                                        type="email"
                                                        placeholder="jane@company.com"
                                                        className="bg-transparent border-none outline-none text-white placeholder-slate-700 w-full text-sm font-medium"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Phone</label>
                                                <div className="relative bg-[#0A0D12] border border-white/10 rounded-lg flex items-center px-4 py-3 focus-within:border-[#4B8BB3]/50 transition-colors">
                                                    <Phone size={16} className="text-slate-500 mr-3 flex-shrink-0" />
                                                    <input
                                                        name="phone"
                                                        type="tel"
                                                        placeholder="(555) 123-4567"
                                                        className="bg-transparent border-none outline-none text-white placeholder-slate-700 w-full text-sm font-medium"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-600 ml-1 -mt-2">At least one contact method is required.</p>

                                        {/* Preferred Contact */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Preferred Contact Method</label>
                                            <div className="flex gap-3">
                                                {[
                                                    { value: 'email', label: 'Email' },
                                                    { value: 'phone', label: 'Phone' },
                                                    { value: 'either', label: 'Either' },
                                                ].map((opt) => (
                                                    <label key={opt.value} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0A0D12] border border-white/10 cursor-pointer hover:border-white/20 transition-colors has-[:checked]:border-[#4B8BB3]/50 has-[:checked]:bg-[#4B8BB3]/5">
                                                        <input
                                                            type="radio"
                                                            name="preferredContact"
                                                            value={opt.value}
                                                            defaultChecked={opt.value === 'either'}
                                                            className="sr-only"
                                                        />
                                                        <span className="text-sm text-slate-300">{opt.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="relative flex items-center py-1">
                                            <div className="flex-grow border-t border-white/[0.06]" />
                                            <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Tell us more (optional)</span>
                                            <div className="flex-grow border-t border-white/[0.06]" />
                                        </div>

                                        {/* Job Title + Company */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Job Title</label>
                                                <div className="relative bg-[#0A0D12] border border-white/10 rounded-lg flex items-center px-4 py-3 focus-within:border-[#4B8BB3]/50 transition-colors">
                                                    <Target size={16} className="text-slate-500 mr-3 flex-shrink-0" />
                                                    <input
                                                        name="jobTitle"
                                                        type="text"
                                                        placeholder="VP of People"
                                                        className="bg-transparent border-none outline-none text-white placeholder-slate-700 w-full text-sm font-medium"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Company</label>
                                                <div className="relative bg-[#0A0D12] border border-white/10 rounded-lg flex items-center px-4 py-3 focus-within:border-[#4B8BB3]/50 transition-colors">
                                                    <Building size={16} className="text-slate-500 mr-3 flex-shrink-0" />
                                                    <input
                                                        name="companyName"
                                                        type="text"
                                                        placeholder="Acme Corp"
                                                        className="bg-transparent border-none outline-none text-white placeholder-slate-700 w-full text-sm font-medium"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Employee Count */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Company Size</label>
                                            <div className="relative bg-[#0A0D12] border border-white/10 rounded-lg px-4 py-3 focus-within:border-[#4B8BB3]/50 transition-colors">
                                                <Users size={16} className="text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                                                <select
                                                    name="employeeCount"
                                                    className="bg-transparent border-none outline-none text-white w-full text-sm font-medium pl-7 appearance-none cursor-pointer"
                                                >
                                                    {employeeCountOptions.map((opt) => (
                                                        <option key={opt.value} value={opt.value} className="bg-[#0A0D12] text-white">
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Interests */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">What are you looking for?</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {interestOptions.map((interest) => (
                                                    <label
                                                        key={interest}
                                                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#0A0D12] border border-white/10 cursor-pointer hover:border-white/20 transition-colors has-[:checked]:border-[#4B8BB3]/40 has-[:checked]:bg-[#4B8BB3]/5"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            name="interests"
                                                            value={interest}
                                                            className="w-4 h-4 rounded border-white/20 bg-transparent text-[#4B8BB3] focus:ring-[#4B8BB3]/50"
                                                        />
                                                        <span className="text-sm text-slate-300">{interest}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Decision Timeline */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Decision Timeline</label>
                                            <div className="relative bg-[#0A0D12] border border-white/10 rounded-lg px-4 py-3 focus-within:border-[#4B8BB3]/50 transition-colors">
                                                <Calendar size={16} className="text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                                                <select
                                                    name="decisionTimeline"
                                                    className="bg-transparent border-none outline-none text-white w-full text-sm font-medium pl-7 appearance-none cursor-pointer"
                                                >
                                                    {timelineOptions.map((opt) => (
                                                        <option key={opt.value} value={opt.value} className="bg-[#0A0D12] text-white">
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Problems to Solve */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">What challenges are you hoping to solve?</label>
                                            <textarea
                                                name="problemsToSolve"
                                                rows={4}
                                                placeholder="Tell us about the challenges your team is facing..."
                                                className="w-full bg-[#0A0D12] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-700 resize-none focus:outline-none focus:border-[#4B8BB3]/50 transition-colors font-medium"
                                            />
                                        </div>

                                        {/* Error */}
                                        {error && (
                                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                                                {error}
                                            </div>
                                        )}

                                        {/* Submit */}
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-4 rounded-full bg-[#4B8BB3] text-white font-bold text-base hover:bg-[#5a9bc3] transition-all shadow-[0_0_20px_rgba(75,139,179,0.25)] hover:shadow-[0_0_30px_rgba(75,139,179,0.4)] hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? (
                                                <Loader2 size={20} className="animate-spin" />
                                            ) : (
                                                <>Request a Demo <ArrowRight size={18} /></>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </FadeIn>

                    </div>
                </div>
            </section>
        </div>
    );
}
