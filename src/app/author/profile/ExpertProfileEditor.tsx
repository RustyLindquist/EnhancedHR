'use client';

import React, { useState, useTransition } from 'react';
import { Phone, Linkedin, Globe, Loader2, CheckCircle, Save, Briefcase, User } from 'lucide-react';
import { updateExpertProfileAction } from '@/app/actions/profile';
import CredentialsEditor from '@/components/CredentialsEditor';
import AvatarSection from '@/components/settings/AvatarSection';
import { ExpertCredential } from '@/app/actions/credentials';

// Custom X (formerly Twitter) icon
const XIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-slate-400">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

interface ExpertProfileEditorProps {
    userId: string;
    fullName: string;
    avatarUrl: string | null;
    phoneNumber: string | null;
    linkedinUrl: string | null;
    twitterUrl: string | null;
    websiteUrl: string | null;
    credentials: ExpertCredential[];
    authorBio: string | null;
    expertTitle: string | null;
}

export default function ExpertProfileEditor({
    userId,
    fullName,
    avatarUrl,
    phoneNumber,
    linkedinUrl,
    twitterUrl,
    websiteUrl,
    credentials,
    authorBio,
    expertTitle,
}: ExpertProfileEditorProps) {
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        phone_number: phoneNumber || '',
        linkedin_url: linkedinUrl || '',
        twitter_url: twitterUrl || '',
        website_url: websiteUrl || '',
        author_bio: authorBio || '',
        expert_title: expertTitle || '',
    });

    const handleSave = () => {
        setError(null);
        startTransition(async () => {
            const result = await updateExpertProfileAction(formData);
            if (result.success) {
                setShowSuccess(true);
                setIsEditing(false);
                setTimeout(() => setShowSuccess(false), 3000);
            } else {
                setError(result.error || 'Failed to save');
            }
        });
    };

    const handleCancel = () => {
        setFormData({
            phone_number: phoneNumber || '',
            linkedin_url: linkedinUrl || '',
            twitter_url: twitterUrl || '',
            website_url: websiteUrl || '',
            author_bio: authorBio || '',
            expert_title: expertTitle || '',
        });
        setIsEditing(false);
        setError(null);
    };

    return (
        <div className="space-y-8">
            {/* Avatar & Name Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-brand-blue-light/10 text-brand-blue-light">
                        <User size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-white">Profile Photo</h2>
                </div>
                <AvatarSection userId={userId} currentAvatarUrl={avatarUrl} />
                <p className="text-sm text-slate-400 mt-4">
                    Your profile photo will be displayed on your expert profile and course pages.
                </p>
            </div>

            {/* Profile Information */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-brand-orange/10 text-brand-orange">
                            <Briefcase size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Profile Information</h2>
                    </div>
                    {showSuccess && (
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                            <CheckCircle size={16} />
                            <span>Saved</span>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Professional Title */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Professional Title
                    </label>
                    <p className="text-xs text-slate-600 mb-2">
                        Your role or title (e.g., Senior HR Consultant, CHRO, HR Director)
                    </p>
                    {isEditing ? (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                            <Briefcase size={16} className="text-slate-400" />
                            <input
                                type="text"
                                value={formData.expert_title}
                                onChange={(e) => setFormData({ ...formData, expert_title: e.target.value })}
                                placeholder="Senior HR Consultant"
                                className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 text-white">
                            <div className="flex items-center gap-3">
                                <Briefcase size={16} className="text-slate-400" />
                                <span>{formData.expert_title || 'Not set'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Expert Bio */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Expert Bio
                    </label>
                    <p className="text-xs text-slate-600 mb-2">
                        A short bio that will be displayed on your course pages and expert profile
                    </p>
                    {isEditing ? (
                        <textarea
                            value={formData.author_bio}
                            onChange={(e) => setFormData({ ...formData, author_bio: e.target.value })}
                            placeholder="Write a compelling bio that introduces you to learners..."
                            rows={4}
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none resize-none"
                        />
                    ) : (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-white min-h-[100px]">
                            {formData.author_bio ? (
                                <p className="text-slate-300 whitespace-pre-wrap">{formData.author_bio}</p>
                            ) : (
                                <p className="text-slate-600">Not set</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleCancel}
                                disabled={isPending}
                                className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isPending}
                                className="flex items-center gap-2 px-5 py-2 bg-brand-orange text-white rounded-lg text-sm font-bold hover:bg-brand-orange/80 transition-colors disabled:opacity-50"
                            >
                                {isPending ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                {isPending ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-xs font-bold text-brand-blue-light hover:text-white transition-colors"
                        >
                            EDIT PROFILE INFO
                        </button>
                    )}
                </div>
            </div>

            {/* Credentials Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="6" />
                            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">Credentials & Background</h2>
                </div>
                <p className="text-sm text-slate-400 mb-6">
                    Add your professional certifications, degrees, and areas of expertise. These will be displayed on your expert profile.
                </p>
                <CredentialsEditor credentials={credentials} />
            </div>

            {/* Contact Information */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                            <Globe size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Contact & Social Links</h2>
                    </div>
                </div>
                <p className="text-sm text-slate-400">
                    Add your contact information and social profiles to help learners connect with you.
                </p>

                {/* Phone Number */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Phone Number
                    </label>
                    {isEditing ? (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                            <Phone size={16} className="text-slate-400" />
                            <input
                                type="tel"
                                value={formData.phone_number}
                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                placeholder="Enter your phone number"
                                className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 text-white">
                            <div className="flex items-center gap-3">
                                <Phone size={16} className="text-slate-400" />
                                <span>{formData.phone_number || 'Not set'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* LinkedIn URL */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        LinkedIn Profile
                    </label>
                    {isEditing ? (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                            <Linkedin size={16} className="text-slate-400" />
                            <input
                                type="url"
                                value={formData.linkedin_url}
                                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                placeholder="https://linkedin.com/in/your-profile"
                                className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 text-white">
                            <div className="flex items-center gap-3">
                                <Linkedin size={16} className="text-slate-400" />
                                {formData.linkedin_url ? (
                                    <a
                                        href={formData.linkedin_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-blue-light hover:underline"
                                    >
                                        {formData.linkedin_url.replace('https://www.linkedin.com/in/', '').replace('https://linkedin.com/in/', '').replace('/', '')}
                                    </a>
                                ) : (
                                    <span>Not set</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* X (Twitter) URL */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        X (Twitter) Profile
                    </label>
                    {isEditing ? (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                            <XIcon size={16} />
                            <input
                                type="url"
                                value={formData.twitter_url}
                                onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                                placeholder="https://x.com/your-handle"
                                className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 text-white">
                            <div className="flex items-center gap-3">
                                <XIcon size={16} />
                                {formData.twitter_url ? (
                                    <a
                                        href={formData.twitter_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-blue-light hover:underline"
                                    >
                                        {formData.twitter_url.replace('https://x.com/', '@').replace('https://twitter.com/', '@')}
                                    </a>
                                ) : (
                                    <span>Not set</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Website URL */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Website
                    </label>
                    {isEditing ? (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                            <Globe size={16} className="text-slate-400" />
                            <input
                                type="url"
                                value={formData.website_url}
                                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                                placeholder="https://your-website.com"
                                className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 text-white">
                            <div className="flex items-center gap-3">
                                <Globe size={16} className="text-slate-400" />
                                {formData.website_url ? (
                                    <a
                                        href={formData.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-blue-light hover:underline"
                                    >
                                        {formData.website_url.replace('https://', '').replace('http://', '').replace(/\/$/, '')}
                                    </a>
                                ) : (
                                    <span>Not set</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Edit Button for Contact Section */}
                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-xs font-bold text-brand-blue-light hover:text-white transition-colors"
                        >
                            EDIT CONTACT INFO
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
