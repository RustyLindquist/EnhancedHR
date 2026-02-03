'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { StandaloneExpert, StandaloneExpertCredential } from '@/types';
import {
    createStandaloneExpert,
    updateStandaloneExpert,
    deleteStandaloneExpert,
    uploadStandaloneExpertAvatar
} from '@/app/actions/standalone-experts';
import CredentialsEditor from '@/components/CredentialsEditor';
import {
    User, Phone, Linkedin, Calendar, BookOpen, Mail,
    ArrowLeft, Edit3, Save, Loader2,
    Briefcase, Globe, Trash2, UserCircle, AlertTriangle,
    Upload, Camera
} from 'lucide-react';

// Custom X (formerly Twitter) icon
const XIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-slate-400">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

interface StandaloneExpertDetailsDashboardProps {
    expert?: StandaloneExpert;
    credentials?: StandaloneExpertCredential[];
    courses?: Array<{
        id: number;
        title: string;
        status: string;
        category: string | null;
        image_url: string | null;
        created_at: string;
    }>;
    isNew?: boolean;
}


export default function StandaloneExpertDetailsDashboard({
    expert,
    credentials = [],
    courses = [],
    isNew = false
}: StandaloneExpertDetailsDashboardProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(isNew);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [localAvatarUrl, setLocalAvatarUrl] = useState(expert?.avatar_url || '');
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
    const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string>('');

    // Form state
    const [formData, setFormData] = useState({
        full_name: expert?.full_name || '',
        email: expert?.email || '',
        phone_number: expert?.phone_number || '',
        linkedin_url: expert?.linkedin_url || '',
        twitter_url: expert?.twitter_url || '',
        website_url: expert?.website_url || '',
        author_bio: expert?.author_bio || '',
        expert_title: expert?.expert_title || '',
        is_active: expert?.is_active ?? true,
    });

    const handleBack = () => {
        router.push('/admin/experts');
    };

    const handleSave = async () => {
        if (isPending) return;
        if (!formData.full_name.trim()) {
            alert('Name is required');
            return;
        }

        startTransition(async () => {
            if (isNew) {
                const result = await createStandaloneExpert(formData);
                if (result.expert) {
                    // If there's a pending avatar, upload it now that we have the expert ID
                    if (pendingAvatarFile) {
                        const avatarFormData = new FormData();
                        avatarFormData.append('avatar', pendingAvatarFile);
                        await uploadStandaloneExpertAvatar(result.expert.id, avatarFormData);
                    }
                    router.push(`/admin/experts/standalone/${result.expert.id}`);
                } else {
                    alert(result.error || 'Failed to create expert');
                }
            } else if (expert) {
                const result = await updateStandaloneExpert(expert.id, formData);
                if (result.success) {
                    setIsEditing(false);
                    router.refresh();
                } else {
                    alert(result.error || 'Failed to update expert');
                }
            }
        });
    };

    const handleCancel = () => {
        if (isNew) {
            router.push('/admin/experts');
        } else {
            setFormData({
                full_name: expert?.full_name || '',
                email: expert?.email || '',
                phone_number: expert?.phone_number || '',
                linkedin_url: expert?.linkedin_url || '',
                twitter_url: expert?.twitter_url || '',
                website_url: expert?.website_url || '',
                author_bio: expert?.author_bio || '',
                expert_title: expert?.expert_title || '',
                is_active: expert?.is_active ?? true,
            });
            setIsEditing(false);
        }
    };

    const handleDelete = async () => {
        if (isPending || !expert) return;

        startTransition(async () => {
            const result = await deleteStandaloneExpert(expert.id);
            if (result.success) {
                router.push('/admin/experts');
            } else {
                alert(result.error || 'Failed to delete expert');
            }
        });
    };


    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please upload a JPEG, PNG, GIF, or WebP image.');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert('File too large. Maximum size is 5MB.');
            return;
        }

        // For new experts, store the file and show preview (upload happens on save)
        if (isNew) {
            setPendingAvatarFile(file);
            // Create a preview URL
            const previewUrl = URL.createObjectURL(file);
            setPendingAvatarPreview(previewUrl);
            e.target.value = '';
            return;
        }

        // For existing experts, upload immediately
        if (!expert) return;

        setIsUploadingAvatar(true);

        const formData = new FormData();
        formData.append('avatar', file);

        const result = await uploadStandaloneExpertAvatar(expert.id, formData);

        setIsUploadingAvatar(false);

        if (result.success && result.url) {
            setLocalAvatarUrl(result.url);
        } else {
            alert(result.error || 'Failed to upload avatar');
        }

        // Reset the input so the same file can be selected again
        e.target.value = '';
    };

    return (
        <div className="flex flex-col w-full h-full relative overflow-auto">
            <div className="w-full max-w-7xl mx-auto pb-32 pt-8 px-8 animate-fade-in space-y-8">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm"
                        >
                            <ArrowLeft size={16} />
                            Back to Experts
                        </button>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold text-white">
                                {isNew ? 'Add New Expert' : (expert?.full_name || 'Expert Details')}
                            </h1>
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                                <UserCircle size={12} /> Standalone Expert
                            </span>
                            {!isNew && expert && !expert.is_active && (
                                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-500/10 text-slate-400 text-xs font-bold">
                                    Inactive
                                </span>
                            )}
                        </div>
                        {expert?.email && <p className="text-slate-400 mt-1">{expert.email}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                        {!isNew && !isEditing && (
                            <>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isPending}
                                    className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                                >
                                    <Trash2 size={14} />
                                    <span>Delete</span>
                                </button>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-bold uppercase tracking-wider text-amber-400 hover:bg-amber-500/20 transition-all"
                                >
                                    <Edit3 size={14} />
                                    <span>Edit</span>
                                </button>
                            </>
                        )}
                        {isEditing && (
                            <>
                                <button
                                    onClick={handleCancel}
                                    disabled={isPending}
                                    className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-slate-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                                >
                                    <span>Cancel</span>
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isPending}
                                    className="flex items-center space-x-2 px-4 py-2 bg-amber-500 rounded-full text-xs font-bold uppercase tracking-wider text-white hover:bg-amber-400 transition-all disabled:opacity-50"
                                >
                                    {isPending ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Save size={14} />
                                    )}
                                    <span>{isPending ? 'Saving...' : isNew ? 'Create Expert' : 'Save Changes'}</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Created Date (for existing experts) */}
                {!isNew && expert && (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-slate-500" />
                            <span className="text-xs text-slate-500 uppercase tracking-wider">Created:</span>
                            <span className="text-white text-sm">
                                {new Date(expert.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                )}

                {/* Section 1: Profile Photo */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                            <User size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Profile Photo</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-4 border-white/10 flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden flex-shrink-0">
                                {(isNew ? pendingAvatarPreview : localAvatarUrl) ? (
                                    <img src={isNew ? pendingAvatarPreview : localAvatarUrl} alt={formData.full_name || ''} className="w-full h-full object-cover" />
                                ) : (
                                    formData.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || <User size={32} />
                                )}
                            </div>
                            {/* Upload overlay */}
                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                {isUploadingAvatar ? (
                                    <Loader2 size={24} className="text-white animate-spin" />
                                ) : (
                                    <Camera size={24} className="text-white" />
                                )}
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    onChange={handleAvatarUpload}
                                    disabled={isUploadingAvatar}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <div>
                            <p className="text-white font-medium text-lg">{formData.full_name || 'New Expert'}</p>
                            <div className="mt-2">
                                <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-all cursor-pointer">
                                    {isUploadingAvatar ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={14} />
                                            {isNew && pendingAvatarFile ? 'Change Photo' : 'Upload Photo'}
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        onChange={handleAvatarUpload}
                                        disabled={isUploadingAvatar}
                                        className="hidden"
                                    />
                                </label>
                                <p className="text-xs text-slate-500 mt-2">
                                    {isNew && pendingAvatarFile
                                        ? 'Photo will be uploaded when you save.'
                                        : 'JPEG, PNG, GIF, or WebP. Max 5MB.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Profile Information */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-brand-orange/10 text-brand-orange">
                            <Briefcase size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Profile Information</h2>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Full Name <span className="text-red-400">*</span>
                        </label>
                        {isEditing ? (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                <User size={16} className="text-slate-400" />
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="John Smith"
                                    className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                                    required
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-white">
                                <User size={16} className="text-slate-400" />
                                <span>{formData.full_name || 'Not set'}</span>
                            </div>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Email Address
                        </label>
                        {isEditing ? (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                <Mail size={16} className="text-slate-400" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="john@example.com"
                                    className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-white">
                                <Mail size={16} className="text-slate-400" />
                                <span>{formData.email || 'Not set'}</span>
                            </div>
                        )}
                    </div>

                    {/* Professional Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Professional Title
                        </label>
                        <p className="text-xs text-slate-600 mb-2">
                            Their role or title (e.g., Senior HR Consultant, CHRO, HR Director)
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
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-white">
                                <Briefcase size={16} className="text-slate-400" />
                                <span>{formData.expert_title || 'Not set'}</span>
                            </div>
                        )}
                    </div>

                    {/* Expert Bio */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Expert Bio
                        </label>
                        <p className="text-xs text-slate-600 mb-2">
                            Bio displayed on their course pages and expert profile
                        </p>
                        {isEditing ? (
                            <textarea
                                value={formData.author_bio}
                                onChange={(e) => setFormData({ ...formData, author_bio: e.target.value })}
                                placeholder="Write a compelling bio that introduces the expert to learners..."
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

                    {/* Status Toggle (only when editing existing) */}
                    {isEditing && !isNew && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Status
                            </label>
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_active: true })}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.is_active
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    Active
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_active: false })}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!formData.is_active
                                        ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                                        : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    Inactive
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Section 3: Credentials & Background */}
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
                        Professional certifications, degrees, and areas of expertise displayed on their expert profile.
                    </p>
                    {isNew ? (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-slate-500 text-center">
                            Save the expert first to add credentials.
                        </div>
                    ) : expert ? (
                        <CredentialsEditor
                            credentials={credentials}
                            standaloneExpertId={expert.id}
                        />
                    ) : null}
                </div>

                {/* Section 4: Contact & Social Links */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                            <Globe size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Contact & Social Links</h2>
                    </div>
                    <p className="text-sm text-slate-400">
                        Contact information and social profiles to help learners connect with this expert.
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
                                    placeholder="Enter phone number"
                                    className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-white">
                                <Phone size={16} className="text-slate-400" />
                                <span>{formData.phone_number || 'Not set'}</span>
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
                                    placeholder="https://linkedin.com/in/profile"
                                    className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-white">
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
                                    placeholder="https://x.com/handle"
                                    className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-white">
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
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-white">
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
                        )}
                    </div>
                </div>

                {/* Section 5: Courses (only for existing experts) */}
                {!isNew && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                                <BookOpen size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-white">Courses ({courses.length})</h2>
                        </div>

                        {courses.length > 0 ? (
                            <div className="space-y-3">
                                {courses.map((course) => (
                                    <div
                                        key={course.id}
                                        onClick={() => router.push(`/admin/courses/${course.id}`)}
                                        className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            {course.image_url ? (
                                                <img
                                                    src={course.image_url}
                                                    alt={course.title}
                                                    className="w-16 h-10 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-16 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                                                    <BookOpen size={16} className="text-slate-500" />
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="text-white font-medium group-hover:text-amber-400 transition-colors">{course.title}</h4>
                                                <p className="text-xs text-slate-500">
                                                    {course.category || 'Uncategorized'} • Created {new Date(course.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${course.status === 'published'
                                            ? 'bg-green-500/10 text-green-400'
                                            : course.status === 'draft'
                                                ? 'bg-yellow-500/10 text-yellow-400'
                                                : 'bg-slate-500/10 text-slate-400'
                                            }`}>
                                            {course.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500 italic">
                                No courses assigned to this expert yet.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <AlertTriangle className="text-red-400" size={20} />
                            Delete Expert
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Are you sure you want to delete this expert? This will mark them as inactive.
                            Any courses assigned to this expert will retain the assignment.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isPending}
                                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isPending}
                                className="px-4 py-2 text-sm font-bold bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            >
                                {isPending ? 'Deleting...' : 'Delete Expert'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
