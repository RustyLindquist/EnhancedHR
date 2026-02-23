'use client';

import React, { useState, useTransition } from 'react';
import {
    FileText, Plus, Send, Loader2, CheckCircle, X,
    Clock, ChevronDown, ChevronUp, Pencil, MessageSquare
} from 'lucide-react';
import { createProposal, updateProposal, CourseProposal } from '@/app/actions/proposals';
import { useRouter } from 'next/navigation';

interface CourseProposalsPageProps {
    proposals: CourseProposal[];
}

export default function CourseProposalsPage({ proposals }: CourseProposalsPageProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editError, setEditError] = useState<string | null>(null);

    // Expanded proposal IDs
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleExpanded = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const pendingProposals = proposals.filter(p => p.status === 'pending');
    const approvedProposals = proposals.filter(p => p.status === 'approved');
    const rejectedProposals = proposals.filter(p => p.status === 'rejected');
    const convertedProposals = proposals.filter(p => p.status === 'converted');

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
                    setIsFormOpen(false);
                    router.refresh();
                }, 2000);
            } else {
                setError(result.error || 'Failed to submit proposal');
            }
        });
    };

    const handleEdit = (proposal: CourseProposal) => {
        setEditingId(proposal.id);
        setEditTitle(proposal.title);
        setEditDescription(proposal.description || '');
        setEditError(null);
    };

    const handleEditSave = async (proposalId: string) => {
        if (!editTitle.trim()) {
            setEditError('Please enter a course title');
            return;
        }

        setEditError(null);
        startTransition(async () => {
            const result = await updateProposal(proposalId, {
                title: editTitle,
                description: editDescription,
            });
            if (result.success) {
                setEditingId(null);
                router.refresh();
            } else {
                setEditError(result.error || 'Failed to update proposal');
            }
        });
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending':
                return { label: 'Pending Review', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Clock };
            case 'approved':
                return { label: 'Approved', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle };
            case 'rejected':
                return { label: 'Needs Revision', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: X };
            case 'converted':
                return { label: 'Converted to Course', color: 'text-brand-blue-light', bg: 'bg-brand-blue-light/10', border: 'border-brand-blue-light/20', icon: CheckCircle };
            default:
                return { label: status, color: 'text-slate-400', bg: 'bg-white/5', border: 'border-white/10', icon: Clock };
        }
    };

    const renderProposalCard = (proposal: CourseProposal) => {
        const statusConfig = getStatusConfig(proposal.status);
        const StatusIcon = statusConfig.icon;
        const isExpanded = expandedIds.has(proposal.id);
        const isEditing = editingId === proposal.id;

        return (
            <div
                key={proposal.id}
                className={`bg-white/5 border ${statusConfig.border} rounded-xl overflow-hidden transition-all hover:bg-white/[0.07]`}
            >
                {/* Card Header */}
                <div
                    className="flex items-center gap-4 p-5 cursor-pointer"
                    onClick={() => !isEditing && toggleExpanded(proposal.id)}
                >
                    <div className={`p-2 rounded-lg ${statusConfig.bg}`}>
                        <StatusIcon size={18} className={statusConfig.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                        {isEditing ? (
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-orange/50 transition-colors"
                            />
                        ) : (
                            <h3 className="font-bold text-white truncate">{proposal.title}</h3>
                        )}
                        <p className="text-xs text-slate-500 mt-0.5">
                            Submitted {new Date(proposal.created_at).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.label}
                    </span>
                    {!isEditing && (
                        <div className="text-slate-500">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                    )}
                </div>

                {/* Expanded Content */}
                {(isExpanded || isEditing) && (
                    <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                        {isEditing ? (
                            <>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">
                                        Description & Outline
                                    </label>
                                    <textarea
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        placeholder="Describe the course content, target audience, and key learning outcomes..."
                                        rows={4}
                                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-brand-orange/50 transition-colors resize-none"
                                    />
                                </div>
                                {editError && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        {editError}
                                    </div>
                                )}
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setEditingId(null)}
                                        disabled={isPending}
                                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-400 hover:bg-white/10 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleEditSave(proposal.id)}
                                        disabled={isPending || !editTitle.trim()}
                                        className="flex items-center gap-2 px-5 py-2 bg-brand-orange text-white rounded-lg text-sm font-bold hover:bg-brand-orange/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                        {isPending ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {proposal.description && (
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Description</p>
                                        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{proposal.description}</p>
                                    </div>
                                )}

                                {proposal.admin_notes && (
                                    <div className={`p-4 rounded-lg ${statusConfig.bg} border ${statusConfig.border}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <MessageSquare size={14} className={statusConfig.color} />
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admin Feedback</p>
                                        </div>
                                        <p className="text-sm text-slate-300">{proposal.admin_notes}</p>
                                    </div>
                                )}

                                {proposal.reviewed_at && (
                                    <p className="text-xs text-slate-500">
                                        Reviewed on {new Date(proposal.reviewed_at).toLocaleDateString('en-US', {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </p>
                                )}

                                {proposal.status === 'pending' && (
                                    <div className="flex justify-end">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(proposal); }}
                                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                        >
                                            <Pencil size={14} />
                                            Edit Proposal
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Course Proposals</h1>
                    <p className="text-slate-400">
                        Submit course ideas for review. Once approved, you can start building your course.
                    </p>
                </div>
                {!isFormOpen && (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand-orange text-white rounded-xl font-bold text-sm hover:bg-brand-orange/80 transition-colors shadow-lg shadow-brand-orange/20"
                    >
                        <Plus size={18} />
                        New Proposal
                    </button>
                )}
            </div>

            {/* New Proposal Form */}
            {isFormOpen && (
                <div className="bg-gradient-to-r from-brand-orange/5 to-purple-500/5 border border-brand-orange/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FileText size={20} className="text-brand-orange" />
                            <h3 className="text-lg font-bold text-white">New Course Proposal</h3>
                        </div>
                        <button
                            onClick={() => setIsFormOpen(false)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X size={18} className="text-slate-400" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-sm text-slate-400">
                            Describe your course idea. Our team typically reviews proposals within 48 hours.
                        </p>

                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">
                                Course Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="E.g., Advanced Performance Management Strategies"
                                autoFocus
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
                                rows={5}
                                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-brand-orange/50 transition-colors resize-none"
                                disabled={isPending || success}
                            />
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
                                onClick={() => setIsFormOpen(false)}
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
                </div>
            )}

            {/* Status Summary */}
            {proposals.length > 0 && (
                <div className="flex flex-wrap gap-3">
                    {pendingProposals.length > 0 && (
                        <span className="px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full text-sm font-bold">
                            {pendingProposals.length} Pending
                        </span>
                    )}
                    {approvedProposals.length > 0 && (
                        <span className="px-4 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-sm font-bold">
                            {approvedProposals.length} Approved
                        </span>
                    )}
                    {rejectedProposals.length > 0 && (
                        <span className="px-4 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-sm font-bold">
                            {rejectedProposals.length} Needs Revision
                        </span>
                    )}
                    {convertedProposals.length > 0 && (
                        <span className="px-4 py-1.5 bg-brand-blue-light/10 border border-brand-blue-light/20 text-brand-blue-light rounded-full text-sm font-bold">
                            {convertedProposals.length} Converted
                        </span>
                    )}
                </div>
            )}

            {/* Proposals List */}
            {proposals.length > 0 ? (
                <div className="space-y-3">
                    {proposals.map(renderProposalCard)}
                </div>
            ) : !isFormOpen ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                    <div className="inline-flex p-4 rounded-2xl bg-brand-orange/10 mb-4">
                        <FileText size={32} className="text-brand-orange" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">No proposals yet</h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                        Submit a course proposal to get started. Describe your course idea and our team will review it within 48 hours.
                    </p>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-orange text-white rounded-xl font-bold text-sm hover:bg-brand-orange/80 transition-colors"
                    >
                        <Plus size={18} />
                        Submit Your First Proposal
                    </button>
                </div>
            ) : null}

            {/* Info Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">How It Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold text-sm shrink-0">1</div>
                        <div>
                            <p className="text-sm font-bold text-white">Submit a Proposal</p>
                            <p className="text-xs text-slate-400 mt-0.5">Describe your course idea, target audience, and learning outcomes.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold text-sm shrink-0">2</div>
                        <div>
                            <p className="text-sm font-bold text-white">Team Review</p>
                            <p className="text-xs text-slate-400 mt-0.5">Our team reviews proposals within 48 hours and may provide feedback.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold text-sm shrink-0">3</div>
                        <div>
                            <p className="text-sm font-bold text-white">Start Building</p>
                            <p className="text-xs text-slate-400 mt-0.5">Once approved, head to My Courses to start creating your content.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
