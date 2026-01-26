'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ExpertProfile, ExpertCourse, ExpertPerformance, updateExpertStatus, updateExpertProfile } from '@/app/actions/experts';
import { CourseProposal, deleteProposal, updateProposalStatus } from '@/app/actions/proposals';
import { ExpertCredential } from '@/app/actions/credentials';
import CredentialsEditor from '@/components/CredentialsEditor';
import {
    User, Phone, Linkedin, Calendar, BookOpen,
    TrendingUp, CheckCircle, XCircle, AlertCircle,
    ExternalLink, Trash2, FileText, ChevronDown, ChevronRight, ArrowLeft,
    Edit3, Save, Loader2, Briefcase, Globe, Eye
} from 'lucide-react';
import Link from 'next/link';

// Custom X (formerly Twitter) icon
const XIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-slate-400">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

interface ExpertDetailsDashboardProps {
    expert: ExpertProfile;
    proposals: CourseProposal[];
    courses: ExpertCourse[];
    performance: ExpertPerformance | null;
    credentials: ExpertCredential[];
}

export default function ExpertDetailsDashboard({
    expert,
    proposals,
    courses,
    performance,
    credentials
}: ExpertDetailsDashboardProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [expandedProposalId, setExpandedProposalId] = useState<string | null>(null);
    const [localProposals, setLocalProposals] = useState(proposals);
    const [isEditing, setIsEditing] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionNotes, setRejectionNotes] = useState('');
    const [showProposalRejectModal, setShowProposalRejectModal] = useState<string | null>(null);
    const [proposalRejectionNotes, setProposalRejectionNotes] = useState('');

    // Form state for editing
    const [formData, setFormData] = useState({
        phone_number: expert.phone_number || '',
        linkedin_url: expert.linkedin_url || '',
        twitter_url: expert.twitter_url || '',
        website_url: expert.website_url || '',
        author_bio: expert.author_bio || '',
        expert_title: expert.expert_title || '',
    });

    const handleBack = () => {
        router.push('/admin/experts');
    };

    const handleApprove = async () => {
        if (isPending) return;
        if (!confirm('Are you sure you want to approve this expert?')) return;

        startTransition(async () => {
            const result = await updateExpertStatus(expert.id, 'approve');
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error || 'Failed to approve expert');
            }
        });
    };

    const handleReject = async () => {
        if (isPending) return;
        setShowRejectModal(true);
    };

    const handleConfirmReject = async () => {
        if (isPending) return;

        startTransition(async () => {
            const result = await updateExpertStatus(expert.id, 'reject', rejectionNotes || undefined);
            if (result.success) {
                setShowRejectModal(false);
                setRejectionNotes('');
                router.refresh();
            } else {
                alert(result.error || 'Failed to reject expert');
            }
        });
    };

    const handleDeleteProposal = async (proposalId: string) => {
        if (isPending) return;
        if (!confirm('Are you sure you want to delete this proposal?')) return;

        startTransition(async () => {
            const result = await deleteProposal(proposalId);
            if (result.success) {
                setLocalProposals(prev => prev.filter(p => p.id !== proposalId));
            } else {
                alert(result.error || 'Failed to delete proposal');
            }
        });
    };

    const handleUpdateProposalStatus = async (proposalId: string, status: 'approved' | 'rejected', notes?: string) => {
        if (isPending) return;

        startTransition(async () => {
            const result = await updateProposalStatus(proposalId, status, notes);
            if (result.success) {
                setLocalProposals(prev =>
                    prev.map(p => p.id === proposalId ? { ...p, status, admin_notes: notes || p.admin_notes } : p)
                );
                if (status === 'rejected') {
                    setShowProposalRejectModal(null);
                    setProposalRejectionNotes('');
                }
            } else {
                alert(result.error || 'Failed to update proposal status');
            }
        });
    };

    const handleRejectProposal = (proposalId: string) => {
        setShowProposalRejectModal(proposalId);
    };

    const handleConfirmProposalReject = async () => {
        if (!showProposalRejectModal) return;
        await handleUpdateProposalStatus(showProposalRejectModal, 'rejected', proposalRejectionNotes || undefined);
    };

    const handleSaveProfile = async () => {
        if (isPending) return;

        startTransition(async () => {
            const result = await updateExpertProfile(expert.id, formData);
            if (result.success) {
                setIsEditing(false);
                router.refresh();
            } else {
                alert(result.error || 'Failed to save profile');
            }
        });
    };

    const handleCancelEdit = () => {
        setFormData({
            phone_number: expert.phone_number || '',
            linkedin_url: expert.linkedin_url || '',
            twitter_url: expert.twitter_url || '',
            website_url: expert.website_url || '',
            author_bio: expert.author_bio || '',
            expert_title: expert.expert_title || '',
        });
        setIsEditing(false);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
                        <CheckCircle size={12} />
                        Approved
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                        <XCircle size={12} />
                        Rejected
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        <AlertCircle size={12} />
                        Pending
                    </span>
                );
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toFixed(0);
    };

    const getTrendIndicator = (current: number, previous: number) => {
        if (previous === 0) return null;
        const change = ((current - previous) / previous) * 100;
        if (change > 0) {
            return <span className="text-green-400 text-xs">+{change.toFixed(0)}%</span>;
        } else if (change < 0) {
            return <span className="text-red-400 text-xs">{change.toFixed(0)}%</span>;
        }
        return null;
    };

    return (
        <div className="flex flex-col w-full h-full relative overflow-auto">
            <div className="w-full max-w-7xl mx-auto pb-32 pt-8 px-8 animate-fade-in space-y-8">
                {/* Page Header with Admin Actions */}
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
                            <h1 className="text-3xl font-bold text-white">{expert.full_name || 'Expert Details'}</h1>
                            {getStatusBadge(expert.author_status)}
                        </div>
                        <p className="text-slate-400 mt-1">{expert.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {expert.author_status === 'pending' && (
                            <>
                                <button
                                    onClick={handleReject}
                                    disabled={isPending}
                                    className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                                >
                                    <XCircle size={14} />
                                    <span>{isPending ? 'Processing...' : 'Reject'}</span>
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={isPending}
                                    className="flex items-center space-x-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-bold uppercase tracking-wider text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50"
                                >
                                    <CheckCircle size={14} />
                                    <span>{isPending ? 'Processing...' : 'Approve'}</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Admin Info Bar - Application Dates */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-slate-500" />
                            <span className="text-xs text-slate-500 uppercase tracking-wider">Applied:</span>
                            <span className="text-white text-sm">
                                {expert.application_submitted_at
                                    ? new Date(expert.application_submitted_at).toLocaleDateString()
                                    : new Date(expert.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-slate-500" />
                            <span className="text-xs text-slate-500 uppercase tracking-wider">Approved:</span>
                            <span className="text-white text-sm">
                                {expert.approved_at
                                    ? new Date(expert.approved_at).toLocaleDateString()
                                    : '-'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Section 1: Profile Photo */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-brand-blue-light/10 text-brand-blue-light">
                            <User size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Profile Photo</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-slate-800/80 border-4 border-white/10 flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden flex-shrink-0">
                            {expert.avatar_url ? (
                                <img src={expert.avatar_url} alt={expert.full_name || ''} className="w-full h-full object-cover" />
                            ) : (
                                expert.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || <User size={32} />
                            )}
                        </div>
                        <div>
                            <p className="text-white font-medium text-lg">{expert.full_name}</p>
                            <p className="text-sm text-slate-400 mt-1">
                                Profile photo is managed by the expert from their Expert Console.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 2: Profile Information */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-brand-orange/10 text-brand-orange">
                                <Briefcase size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-white">Profile Information</h2>
                        </div>
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

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleCancelEdit}
                                    disabled={isPending}
                                    className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveProfile}
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
                    <CredentialsEditor
                        credentials={credentials}
                        isAdmin={true}
                        expertId={expert.id}
                    />
                </div>

                {/* Section 4: Contact & Social Links */}
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
                                    placeholder="https://linkedin.com/in/profile"
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
                                    placeholder="https://x.com/handle"
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

                {/* Admin-Specific Sections */}
                <div className="pt-4 border-t border-white/10">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">Admin Sections</h3>
                </div>

                {/* Section 5: Course Proposals */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                            <FileText size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Course Proposals ({localProposals.length})</h2>
                    </div>

                    {localProposals.length > 0 ? (
                        <div className="space-y-3">
                            {localProposals.map((proposal) => (
                                <div
                                    key={proposal.id}
                                    className="bg-white/5 border border-white/5 rounded-xl overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedProposalId(
                                            expandedProposalId === proposal.id ? null : proposal.id
                                        )}
                                        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            {expandedProposalId === proposal.id ? (
                                                <ChevronDown size={16} className="text-slate-400" />
                                            ) : (
                                                <ChevronRight size={16} className="text-slate-400" />
                                            )}
                                            <div className="text-left">
                                                <h4 className="text-white font-medium">{proposal.title}</h4>
                                                <p className="text-xs text-slate-500">
                                                    Submitted {new Date(proposal.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(proposal.status)}
                                        </div>
                                    </button>

                                    {expandedProposalId === proposal.id && (
                                        <div className="px-4 pb-4 border-t border-white/5 pt-4">
                                            {proposal.description && (
                                                <div className="mb-4">
                                                    <h5 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Description</h5>
                                                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{proposal.description}</p>
                                                </div>
                                            )}
                                            {proposal.admin_notes && (
                                                <div className="mb-4">
                                                    <h5 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Admin Notes</h5>
                                                    <p className="text-slate-400 text-sm italic">{proposal.admin_notes}</p>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 pt-2">
                                                {proposal.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdateProposalStatus(proposal.id, 'approved')}
                                                            disabled={isPending}
                                                            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-50"
                                                        >
                                                            Approve Proposal
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectProposal(proposal.id)}
                                                            disabled={isPending}
                                                            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                        >
                                                            Reject Proposal
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteProposal(proposal.id)}
                                                    disabled={isPending}
                                                    className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-white/5 text-slate-400 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 ml-auto"
                                                >
                                                    <Trash2 size={12} className="inline mr-1" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500 italic">
                            No course proposals submitted.
                        </div>
                    )}
                </div>

                {/* Section 6: Performance Metrics */}
                {performance && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                                <TrendingUp size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-white">Performance Metrics</h2>
                        </div>

                        {/* All-Time Stats */}
                        <div className="mb-6">
                            <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-3">All-Time</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Courses</div>
                                    <div className="text-2xl font-bold text-brand-blue-light">{performance.allTime.courses}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Students</div>
                                    <div className="text-2xl font-bold text-purple-400">{formatNumber(performance.allTime.students)}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Watch Hours</div>
                                    <div className="text-2xl font-bold text-brand-orange">{formatNumber(performance.allTime.watchMinutes / 60)}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Completions</div>
                                    <div className="text-2xl font-bold text-green-400">{formatNumber(performance.allTime.completions)}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Citations</div>
                                    <div className="text-2xl font-bold text-pink-400">{formatNumber(performance.allTime.citations)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Current Month Stats */}
                        <div>
                            <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-3">{performance.monthLabel}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Watch Hours</div>
                                    <div className="text-2xl font-bold text-brand-orange flex items-center gap-2">
                                        {formatNumber(performance.currentMonth.watchMinutes / 60)}
                                        {getTrendIndicator(
                                            performance.currentMonth.watchMinutes,
                                            performance.previousMonth.watchMinutes
                                        )}
                                    </div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Active Learners</div>
                                    <div className="text-2xl font-bold text-purple-400">{formatNumber(performance.currentMonth.activeLearners)}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Completions</div>
                                    <div className="text-2xl font-bold text-green-400">{formatNumber(performance.currentMonth.completions)}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Citations</div>
                                    <div className="text-2xl font-bold text-pink-400 flex items-center gap-2">
                                        {formatNumber(performance.currentMonth.citations)}
                                        {getTrendIndicator(
                                            performance.currentMonth.citations,
                                            performance.previousMonth.citations
                                        )}
                                    </div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Platform Share</div>
                                    <div className="text-2xl font-bold text-brand-blue-light">{performance.currentMonth.sharePercent.toFixed(1)}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 7: Courses */}
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
                                            <h4 className="text-white font-medium group-hover:text-brand-blue-light transition-colors">{course.title}</h4>
                                            <p className="text-xs text-slate-500">
                                                {course.category || 'Uncategorized'} • Created {new Date(course.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${course.status === 'published'
                                            ? 'bg-green-500/10 text-green-400'
                                            : course.status === 'draft'
                                                ? 'bg-yellow-500/10 text-yellow-400'
                                                : 'bg-slate-500/10 text-slate-400'
                                            }`}>
                                            {course.status}
                                        </span>
                                        <Link
                                            href={`/dashboard?courseId=${course.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                            title="Preview Course"
                                        >
                                            <Eye size={14} />
                                        </Link>
                                        <ExternalLink size={14} className="text-slate-500 group-hover:text-white transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500 italic">
                            No courses created yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <XCircle className="text-red-400" size={20} />
                            Reject Expert Application
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Provide feedback to help the expert understand why their application was rejected and what they can improve.
                        </p>
                        <textarea
                            value={rejectionNotes}
                            onChange={(e) => setRejectionNotes(e.target.value)}
                            placeholder="Enter rejection reason and feedback for the expert..."
                            rows={4}
                            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none resize-none focus:border-red-500/50 transition-colors text-sm"
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionNotes('');
                                }}
                                disabled={isPending}
                                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmReject}
                                disabled={isPending}
                                className="px-4 py-2 text-sm font-bold bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            >
                                {isPending ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Proposal Rejection Modal */}
            {showProposalRejectModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <XCircle className="text-red-400" size={20} />
                            Reject Course Proposal
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Provide feedback to help the expert understand why their proposal was rejected.
                        </p>
                        <textarea
                            value={proposalRejectionNotes}
                            onChange={(e) => setProposalRejectionNotes(e.target.value)}
                            placeholder="Enter rejection reason and feedback..."
                            rows={4}
                            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none resize-none focus:border-red-500/50 transition-colors text-sm"
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setShowProposalRejectModal(null);
                                    setProposalRejectionNotes('');
                                }}
                                disabled={isPending}
                                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmProposalReject}
                                disabled={isPending}
                                className="px-4 py-2 text-sm font-bold bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            >
                                {isPending ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
