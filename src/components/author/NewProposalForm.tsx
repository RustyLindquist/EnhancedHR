'use client';

import React, { useState, useTransition } from 'react';
import { FileText, Send, Loader2, CheckCircle, X, Plus } from 'lucide-react';
import { createProposal, CourseProposal } from '@/app/actions/proposals';
import { useRouter } from 'next/navigation';

interface NewProposalFormProps {
    existingProposals: CourseProposal[];
}

export default function NewProposalForm({ existingProposals }: NewProposalFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Please enter a course title');
            return;
        }

        setError(null);
        startTransition(async () => {
            const result = await createProposal({ title, description });
            if (result.success) {
                setSuccess(true);
                setTitle('');
                setDescription('');
                setTimeout(() => {
                    setSuccess(false);
                    setIsOpen(false);
                    router.refresh();
                }, 2000);
            } else {
                setError(result.error || 'Failed to submit proposal');
            }
        });
    };

    const pendingProposals = existingProposals.filter(p => p.status === 'pending');
    const approvedProposals = existingProposals.filter(p => p.status === 'approved');

    return (
        <div className="bg-gradient-to-r from-brand-orange/5 to-purple-500/5 border border-brand-orange/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FileText size={20} className="text-brand-orange" />
                    <h3 className="text-lg font-bold text-white">Course Proposals</h3>
                </div>
                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-orange/10 border border-brand-orange/20 rounded-full text-sm font-bold text-brand-orange hover:bg-brand-orange/20 transition-colors"
                    >
                        <Plus size={16} />
                        New Proposal
                    </button>
                )}
            </div>

            {/* Existing Proposals Summary */}
            {existingProposals.length > 0 && !isOpen && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {pendingProposals.length > 0 && (
                        <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-xs font-bold">
                            {pendingProposals.length} Pending
                        </span>
                    )}
                    {approvedProposals.length > 0 && (
                        <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-bold">
                            {approvedProposals.length} Approved
                        </span>
                    )}
                </div>
            )}

            {/* Proposal Form */}
            {isOpen && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-400">
                            Have another course idea? Submit a new proposal for review.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                            <X size={16} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">
                                Course Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="E.g., Advanced Performance Management Strategies"
                                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-brand-orange/50 transition-colors"
                                disabled={isPending || success}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">
                                Description & Outline
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the course content, target audience, and key learning outcomes..."
                                rows={4}
                                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-brand-orange/50 transition-colors resize-none"
                                disabled={isPending || success}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                            <CheckCircle size={16} />
                            Proposal submitted successfully! Our team will review it shortly.
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            disabled={isPending}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-400 hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || success || !title.trim()}
                            className="flex items-center gap-2 px-5 py-2 bg-brand-orange text-white rounded-lg text-sm font-bold hover:bg-brand-orange/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : success ? (
                                <CheckCircle size={16} />
                            ) : (
                                <Send size={16} />
                            )}
                            {isPending ? 'Submitting...' : success ? 'Submitted!' : 'Submit Proposal'}
                        </button>
                    </div>
                </form>
            )}

            {/* Existing Proposals List (when form is closed) */}
            {!isOpen && existingProposals.length > 0 && (
                <div className="space-y-2 mt-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Your Proposals</p>
                    {existingProposals.slice(0, 3).map((proposal) => (
                        <div
                            key={proposal.id}
                            className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-white font-medium truncate">{proposal.title}</p>
                                <p className="text-xs text-slate-500">
                                    Submitted {new Date(proposal.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <span className={`ml-3 px-2 py-1 rounded text-xs font-bold ${
                                proposal.status === 'approved'
                                    ? 'bg-green-500/10 text-green-400'
                                    : proposal.status === 'rejected'
                                        ? 'bg-red-500/10 text-red-400'
                                        : 'bg-yellow-500/10 text-yellow-400'
                            }`}>
                                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                            </span>
                        </div>
                    ))}
                    {existingProposals.length > 3 && (
                        <p className="text-xs text-slate-500 text-center pt-2">
                            +{existingProposals.length - 3} more proposals
                        </p>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!isOpen && existingProposals.length === 0 && (
                <p className="text-sm text-slate-500">
                    Submit a course proposal to expand your content library. Our team reviews proposals within 48 hours.
                </p>
            )}
        </div>
    );
}
