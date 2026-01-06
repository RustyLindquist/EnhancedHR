'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ProposalWithExpert, updateProposalStatus, deleteProposal } from '@/app/actions/proposals';
import {
    FileText, CheckCircle, XCircle, AlertCircle, Trash2, User,
    ChevronDown, ChevronRight, Filter, Clock
} from 'lucide-react';

interface ProposalsDashboardProps {
    proposals: ProposalWithExpert[];
}

export default function ProposalsDashboard({ proposals }: ProposalsDashboardProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [expandedProposalId, setExpandedProposalId] = useState<string | null>(null);
    const [localProposals, setLocalProposals] = useState(proposals);
    const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
    const [rejectionNotes, setRejectionNotes] = useState('');

    const filteredProposals = localProposals.filter(p => {
        if (statusFilter === 'all') return true;
        return p.status === statusFilter;
    });

    const statusCounts = {
        all: localProposals.length,
        pending: localProposals.filter(p => p.status === 'pending').length,
        approved: localProposals.filter(p => p.status === 'approved').length,
        rejected: localProposals.filter(p => p.status === 'rejected').length,
    };

    const handleApprove = async (proposalId: string) => {
        if (isPending) return;

        startTransition(async () => {
            const result = await updateProposalStatus(proposalId, 'approved');
            if (result.success) {
                setLocalProposals(prev =>
                    prev.map(p => p.id === proposalId ? { ...p, status: 'approved' } : p)
                );
            } else {
                alert(result.error || 'Failed to approve proposal');
            }
        });
    };

    const handleReject = async (proposalId: string) => {
        setShowRejectModal(proposalId);
    };

    const handleConfirmReject = async () => {
        if (!showRejectModal || isPending) return;

        startTransition(async () => {
            const result = await updateProposalStatus(showRejectModal, 'rejected', rejectionNotes || undefined);
            if (result.success) {
                setLocalProposals(prev =>
                    prev.map(p => p.id === showRejectModal ? { ...p, status: 'rejected', admin_notes: rejectionNotes } : p)
                );
                setShowRejectModal(null);
                setRejectionNotes('');
            } else {
                alert(result.error || 'Failed to reject proposal');
            }
        });
    };

    const handleDelete = async (proposalId: string) => {
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

    return (
        <div className="flex flex-col w-full h-full relative overflow-auto">
            <div className="w-full max-w-7xl mx-auto pb-32 pt-8 px-8 animate-fade-in space-y-8">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Course Proposals</h1>
                        <p className="text-slate-400">Review and manage course proposals from all experts.</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4">
                    <div
                        onClick={() => setStatusFilter('pending')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            statusFilter === 'pending'
                                ? 'bg-yellow-500/10 border-yellow-500/30'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Clock size={16} className="text-yellow-400" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{statusCounts.pending}</div>
                    </div>
                    <div
                        onClick={() => setStatusFilter('approved')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            statusFilter === 'approved'
                                ? 'bg-green-500/10 border-green-500/30'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle size={16} className="text-green-400" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approved</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{statusCounts.approved}</div>
                    </div>
                    <div
                        onClick={() => setStatusFilter('rejected')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            statusFilter === 'rejected'
                                ? 'bg-red-500/10 border-red-500/30'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <XCircle size={16} className="text-red-400" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rejected</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{statusCounts.rejected}</div>
                    </div>
                    <div
                        onClick={() => setStatusFilter('all')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            statusFilter === 'all'
                                ? 'bg-brand-blue-light/10 border-brand-blue-light/30'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <FileText size={16} className="text-brand-blue-light" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">All</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{statusCounts.all}</div>
                    </div>
                </div>

                {/* Proposals List */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Filter size={16} />
                            {statusFilter === 'all' ? 'All Proposals' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Proposals`}
                            <span className="text-brand-blue-light">({filteredProposals.length})</span>
                        </h3>
                    </div>

                    {filteredProposals.length > 0 ? (
                        <div className="space-y-3">
                            {filteredProposals.map((proposal) => (
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
                                            {/* Expert Avatar */}
                                            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-white/10 flex items-center justify-center text-sm font-bold text-white overflow-hidden flex-shrink-0">
                                                {proposal.expert?.avatar_url ? (
                                                    <img src={proposal.expert.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    proposal.expert?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || <User size={16} />
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <h4 className="text-white font-medium">{proposal.title}</h4>
                                                <p className="text-xs text-slate-500">
                                                    by {proposal.expert?.full_name || 'Unknown'} • Submitted {new Date(proposal.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(proposal.status)}
                                        </div>
                                    </button>

                                    {expandedProposalId === proposal.id && (
                                        <div className="px-4 pb-4 border-t border-white/5 pt-4 ml-[72px]">
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
                                                            onClick={() => handleApprove(proposal.id)}
                                                            disabled={isPending}
                                                            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-50"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(proposal.id)}
                                                            disabled={isPending}
                                                            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => router.push(`/admin/experts/${proposal.expert_id}`)}
                                                    className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-brand-blue-light/10 text-brand-blue-light border border-brand-blue-light/20 rounded-lg hover:bg-brand-blue-light/20 transition-colors"
                                                >
                                                    View Expert
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(proposal.id)}
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
                        <div className="text-center py-12 text-slate-500">
                            <FileText size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="italic">No {statusFilter === 'all' ? '' : statusFilter + ' '}proposals found.</p>
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
                            Reject Proposal
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Provide feedback to help the expert understand why their proposal was rejected.
                        </p>
                        <textarea
                            value={rejectionNotes}
                            onChange={(e) => setRejectionNotes(e.target.value)}
                            placeholder="Enter rejection reason and feedback..."
                            rows={4}
                            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none resize-none focus:border-red-500/50 transition-colors text-sm"
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setShowRejectModal(null);
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
        </div>
    );
}
