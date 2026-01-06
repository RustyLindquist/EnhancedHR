'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ExpertProfile, ExpertCourse, ExpertPerformance, updateExpertStatus, updateExpertProfile } from '@/app/actions/experts';
import { CourseProposal, deleteProposal, updateProposalStatus } from '@/app/actions/proposals';
import { ExpertCredential } from '@/app/actions/credentials';
import CredentialsEditor from '@/components/CredentialsEditor';
import {
    User, Mail, Phone, Linkedin, Calendar, Clock, Award, BookOpen,
    TrendingUp, Users, MessageSquare, CheckCircle, XCircle, AlertCircle,
    ExternalLink, Trash2, FileText, ChevronDown, ChevronRight, ArrowLeft,
    Edit3, Save, Loader2, Briefcase
} from 'lucide-react';

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
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [editedBio, setEditedBio] = useState(expert.author_bio || '');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(expert.expert_title || '');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionNotes, setRejectionNotes] = useState('');
    const [showProposalRejectModal, setShowProposalRejectModal] = useState<string | null>(null);
    const [proposalRejectionNotes, setProposalRejectionNotes] = useState('');

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

    const handleSaveBio = async () => {
        if (isPending) return;

        startTransition(async () => {
            const result = await updateExpertProfile(expert.id, {
                author_bio: editedBio,
            });
            if (result.success) {
                setIsEditingBio(false);
                router.refresh();
            } else {
                alert(result.error || 'Failed to save bio');
            }
        });
    };

    const handleCancelBioEdit = () => {
        setEditedBio(expert.author_bio || '');
        setIsEditingBio(false);
    };

    const handleSaveTitle = async () => {
        if (isPending) return;

        startTransition(async () => {
            const result = await updateExpertProfile(expert.id, {
                expert_title: editedTitle,
            });
            if (result.success) {
                setIsEditingTitle(false);
                router.refresh();
            } else {
                alert(result.error || 'Failed to save title');
            }
        });
    };

    const handleCancelTitleEdit = () => {
        setEditedTitle(expert.expert_title || '');
        setIsEditingTitle(false);
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
                        <h1 className="text-3xl font-bold text-white mb-2">{expert.full_name || 'Expert Details'}</h1>
                        <p className="text-slate-400">Expert profile, proposals, and performance metrics.</p>
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
                        {expert.linkedin_url && (
                            <a
                                href={expert.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-bold uppercase tracking-wider text-blue-400 hover:bg-blue-500/20 transition-all"
                            >
                                <Linkedin size={14} />
                                <span>LinkedIn</span>
                                <ExternalLink size={12} />
                            </a>
                        )}
                    </div>
                </div>

                {/* Expert Profile Card - Horizontal Layout */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Avatar & Name Section */}
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-slate-800/80 border-4 border-white/10 flex items-center justify-center text-2xl font-bold text-white shadow-lg overflow-hidden flex-shrink-0">
                                {expert.avatar_url ? (
                                    <img src={expert.avatar_url} alt={expert.full_name || ''} className="w-full h-full object-cover" />
                                ) : (
                                    expert.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || <User size={28} />
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{expert.full_name || 'Unknown'}</h2>
                                <p className="text-slate-400 text-sm">{expert.email}</p>
                                {/* Professional Title */}
                                <div className="flex items-center gap-2 mt-1">
                                    <Briefcase size={12} className="text-slate-500" />
                                    {isEditingTitle ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editedTitle}
                                                onChange={(e) => setEditedTitle(e.target.value)}
                                                placeholder="Professional title..."
                                                className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-sm text-white placeholder-slate-600 outline-none focus:border-brand-blue-light/50 w-48"
                                            />
                                            <button
                                                onClick={handleCancelTitleEdit}
                                                disabled={isPending}
                                                className="text-xs text-slate-400 hover:text-white disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveTitle}
                                                disabled={isPending}
                                                className="text-xs text-brand-orange hover:text-brand-orange/80 disabled:opacity-50"
                                            >
                                                {isPending ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-slate-300 text-sm">{expert.expert_title || 'No title set'}</span>
                                            <button
                                                onClick={() => setIsEditingTitle(true)}
                                                className="text-xs text-brand-blue-light hover:text-white ml-1"
                                            >
                                                <Edit3 size={10} />
                                            </button>
                                        </>
                                    )}
                                </div>
                                <div className="mt-2">
                                    {getStatusBadge(expert.author_status)}
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="hidden md:block w-px bg-white/10"></div>

                        {/* Contact Info */}
                        <div className="flex flex-col justify-center gap-2">
                            {expert.phone_number && (
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <Phone size={14} className="text-slate-500" />
                                    <span>{expert.phone_number}</span>
                                </div>
                            )}
                            {expert.linkedin_url && (
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <Linkedin size={14} className="text-slate-500" />
                                    <a
                                        href={expert.linkedin_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-brand-blue-light hover:underline"
                                    >
                                        {expert.linkedin_url.replace('https://www.linkedin.com/in/', '').replace('/', '')}
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="hidden md:block w-px bg-white/10"></div>

                        {/* Dates */}
                        <div className="flex gap-8">
                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Applied</div>
                                <div className="text-white font-medium text-sm">
                                    {expert.application_submitted_at
                                        ? new Date(expert.application_submitted_at).toLocaleDateString()
                                        : new Date(expert.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Approved</div>
                                <div className="text-white font-medium text-sm">
                                    {expert.approved_at
                                        ? new Date(expert.approved_at).toLocaleDateString()
                                        : '-'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Credentials & Bio Row */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Credentials & Bio</h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Credentials - Uses CredentialsEditor */}
                        <div>
                            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Award size={12} />
                                Credentials & Background
                            </label>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <CredentialsEditor
                                    credentials={credentials}
                                    isAdmin={true}
                                    expertId={expert.id}
                                />
                            </div>
                        </div>

                        {/* Bio - Separate edit mode */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs text-slate-500 uppercase tracking-wider">Professional Bio</label>
                                {isEditingBio ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleCancelBioEdit}
                                            disabled={isPending}
                                            className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveBio}
                                            disabled={isPending}
                                            className="flex items-center gap-1 px-2 py-1 text-xs font-bold uppercase tracking-wider bg-brand-orange text-white rounded-lg hover:bg-brand-orange/80 transition-colors disabled:opacity-50"
                                        >
                                            {isPending ? (
                                                <Loader2 size={10} className="animate-spin" />
                                            ) : (
                                                <Save size={10} />
                                            )}
                                            Save
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsEditingBio(true)}
                                        className="flex items-center gap-1 text-xs font-bold text-brand-blue-light hover:text-white transition-colors uppercase tracking-wider"
                                    >
                                        <Edit3 size={10} />
                                        Edit
                                    </button>
                                )}
                            </div>
                            {isEditingBio ? (
                                <textarea
                                    value={editedBio}
                                    onChange={(e) => setEditedBio(e.target.value)}
                                    placeholder="Enter professional bio..."
                                    rows={5}
                                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none resize-none focus:border-brand-blue-light/50 transition-colors"
                                />
                            ) : (
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 min-h-[120px]">
                                    {expert.author_bio ? (
                                        <p className="text-slate-300 text-sm whitespace-pre-wrap">{expert.author_bio}</p>
                                    ) : (
                                        <p className="text-slate-600 text-sm italic">Not set</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Sections - Single Column */}
                <div className="space-y-6">

                        {/* Course Proposals Section */}
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <FileText size={16} />
                                Course Proposals ({localProposals.length})
                            </h3>

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

                        {/* Performance Section */}
                        {performance && (
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <TrendingUp size={16} />
                                    Performance Metrics
                                </h3>

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

                        {/* Courses Section */}
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <BookOpen size={16} />
                                Courses ({courses.length})
                            </h3>

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
