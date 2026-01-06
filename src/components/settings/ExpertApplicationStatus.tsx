'use client';

import React, { useState } from 'react';
import { Award, Clock, CheckCircle, XCircle, FileText, AlertCircle, Plus } from 'lucide-react';

interface ExpertApplicationStatusProps {
    profile: {
        id: string;
        author_status: string;
        application_status: string;
        application_submitted_at: string;
        rejection_notes?: string;
        course_proposal_title?: string;
        course_proposal_description?: string;
    };
    proposals: Array<{
        id: string;
        title: string;
        description: string;
        status: string;
        admin_notes?: string;
        created_at: string;
    }>;
    onNewProposal?: () => void;
}

export default function ExpertApplicationStatus({
    profile,
    proposals,
    onNewProposal
}: ExpertApplicationStatusProps) {
    const [showNewProposalForm, setShowNewProposalForm] = useState(false);

    const isRejected = profile.application_status === 'rejected';
    const isPending = profile.application_status === 'submitted' || profile.application_status === 'reviewing';

    // Helper to get status badge colors and text
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return {
                    bg: 'bg-green-500/20',
                    text: 'text-green-400',
                    border: 'border-green-500/30',
                    label: 'Approved'
                };
            case 'rejected':
                return {
                    bg: 'bg-red-500/20',
                    text: 'text-red-400',
                    border: 'border-red-500/30',
                    label: 'Rejected'
                };
            case 'pending':
            case 'submitted':
            case 'reviewing':
                return {
                    bg: 'bg-brand-orange/20',
                    text: 'text-brand-orange',
                    border: 'border-brand-orange/30',
                    label: 'Under Review'
                };
            default:
                return {
                    bg: 'bg-slate-500/20',
                    text: 'text-slate-400',
                    border: 'border-slate-500/30',
                    label: status
                };
        }
    };

    const appStatusBadge = getStatusBadge(profile.application_status);

    return (
        <section>
            <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${appStatusBadge.bg} ${appStatusBadge.text}`}>
                    <Award size={24} />
                </div>
                <h2 className="text-2xl font-bold text-white">Expert Application</h2>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm space-y-6">

                {/* Application Status Banner */}
                <div className={`p-6 rounded-xl border backdrop-blur-sm ${
                    isRejected
                        ? 'bg-red-500/10 border-red-500/30'
                        : isPending
                            ? 'bg-brand-orange/10 border-brand-orange/30'
                            : 'bg-green-500/10 border-green-500/30'
                }`}>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${
                            isRejected
                                ? 'bg-red-500/20 text-red-400'
                                : isPending
                                    ? 'bg-brand-orange/20 text-brand-orange'
                                    : 'bg-green-500/20 text-green-400'
                        }`}>
                            {isRejected ? (
                                <XCircle size={24} />
                            ) : isPending ? (
                                <Clock size={24} className="animate-pulse" />
                            ) : (
                                <CheckCircle size={24} />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold text-white">
                                    {isRejected
                                        ? 'Application Needs Revision'
                                        : isPending
                                            ? 'Application Under Review'
                                            : 'Application Status'}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${appStatusBadge.bg} ${appStatusBadge.text} ${appStatusBadge.border}`}>
                                    {appStatusBadge.label}
                                </span>
                            </div>

                            <p className="text-slate-400 text-sm mb-2">
                                {isRejected
                                    ? 'Please review the feedback below and submit a revised proposal.'
                                    : isPending
                                        ? 'Our team is reviewing your profile and course proposal. We typically respond within 48 hours.'
                                        : 'Thank you for your application.'}
                            </p>

                            {profile.application_submitted_at && (
                                <p className="text-xs text-slate-500">
                                    Submitted: {new Date(profile.application_submitted_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            )}

                            {/* Rejection Notes from Profile */}
                            {isRejected && profile.rejection_notes && (
                                <div className="mt-4 p-4 bg-white/5 rounded-lg border border-red-500/20">
                                    <div className="flex items-start gap-2 mb-2">
                                        <AlertCircle size={16} className="text-red-400 mt-0.5" />
                                        <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                                            Feedback from our team
                                        </h4>
                                    </div>
                                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{profile.rejection_notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Current Proposals Section */}
                {proposals && proposals.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                            Your Course Proposals
                        </h3>
                        <div className="space-y-3">
                            {proposals.map((proposal) => {
                                const proposalStatus = getStatusBadge(proposal.status);
                                return (
                                    <div
                                        key={proposal.id}
                                        className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FileText size={16} className="text-brand-blue-light" />
                                                    <h4 className="font-bold text-white">{proposal.title}</h4>
                                                </div>
                                                <p className="text-sm text-slate-400 line-clamp-2">
                                                    {proposal.description}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${proposalStatus.bg} ${proposalStatus.text} ${proposalStatus.border}`}>
                                                {proposalStatus.label}
                                            </span>
                                        </div>

                                        {/* Admin Notes for Rejected Proposals */}
                                        {proposal.status === 'rejected' && proposal.admin_notes && (
                                            <div className="mt-3 p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                                                <div className="flex items-start gap-2 mb-1">
                                                    <AlertCircle size={14} className="text-red-400 mt-0.5" />
                                                    <h5 className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                                                        Reviewer Feedback
                                                    </h5>
                                                </div>
                                                <p className="text-xs text-slate-400 whitespace-pre-wrap">{proposal.admin_notes}</p>
                                            </div>
                                        )}

                                        <p className="text-xs text-slate-600 mt-2">
                                            Submitted: {new Date(proposal.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Submit Another Proposal Button */}
                <div className="pt-4 border-t border-white/5">
                    <button
                        onClick={() => {
                            if (onNewProposal) {
                                onNewProposal();
                            } else {
                                setShowNewProposalForm(!showNewProposalForm);
                            }
                        }}
                        className="flex items-center gap-2 px-5 py-3 bg-brand-orange/20 hover:bg-brand-orange/30 text-brand-orange rounded-lg text-sm font-bold transition-colors border border-brand-orange/30"
                    >
                        <Plus size={18} />
                        Submit {proposals.length > 0 ? 'Another' : 'New'} Proposal
                    </button>
                    <p className="text-xs text-slate-500 mt-2">
                        {isRejected
                            ? 'Submit a revised proposal addressing the feedback above.'
                            : 'You can submit multiple course proposals for review.'}
                    </p>
                </div>

                {/* Help Text */}
                <div className="pt-4 border-t border-white/5">
                    <p className="text-xs text-slate-600">
                        Questions about your application? Contact us at{' '}
                        <a
                            href="mailto:experts@enhancedhr.ai"
                            className="text-brand-blue-light hover:underline"
                        >
                            experts@enhancedhr.ai
                        </a>
                    </p>
                </div>
            </div>
        </section>
    );
}
