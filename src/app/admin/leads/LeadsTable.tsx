'use client';

import React, { useState, useMemo } from 'react';
import {
    Search, ChevronDown, Mail, Phone, Building2, Target,
    Calendar, MessageSquare, ClipboardList, User, Loader2
} from 'lucide-react';
import { DemoLead, updateLeadStatus, updateLeadNotes } from '@/app/actions/leads';

const STATUS_STYLES: Record<string, string> = {
    new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    contacted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    qualified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    converted: 'bg-green-500/10 text-green-400 border-green-500/20',
    closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const TIMELINE_LABELS: Record<string, string> = {
    immediately: 'Immediately',
    '1-3_months': '1–3 months',
    '3-6_months': '3–6 months',
    just_exploring: 'Just exploring',
};

export default function LeadsTable({ initialLeads }: { initialLeads: DemoLead[] }) {
    const [leads, setLeads] = useState<DemoLead[]>(initialLeads);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
    const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
    const [savingNotes, setSavingNotes] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

    const filteredLeads = useMemo(() => {
        if (!searchTerm.trim()) return leads;
        const term = searchTerm.toLowerCase();
        return leads.filter((lead) =>
            lead.full_name.toLowerCase().includes(term) ||
            (lead.email && lead.email.toLowerCase().includes(term)) ||
            (lead.company_name && lead.company_name.toLowerCase().includes(term)) ||
            (lead.phone && lead.phone.includes(term))
        );
    }, [leads, searchTerm]);

    const handleStatusChange = async (leadId: string, newStatus: string) => {
        setUpdatingStatus(leadId);
        const result = await updateLeadStatus(leadId, newStatus);
        if (result.success) {
            setLeads((prev) =>
                prev.map((l) => (l.id === leadId ? { ...l, status: newStatus as DemoLead['status'] } : l))
            );
        }
        setUpdatingStatus(null);
    };

    const handleSaveNotes = async (leadId: string) => {
        const notes = editingNotes[leadId];
        if (notes === undefined) return;
        setSavingNotes(leadId);
        const result = await updateLeadNotes(leadId, notes);
        if (result.success) {
            setLeads((prev) =>
                prev.map((l) => (l.id === leadId ? { ...l, admin_notes: notes } : l))
            );
            setEditingNotes((prev) => {
                const next = { ...prev };
                delete next[leadId];
                return next;
            });
        }
        setSavingNotes(null);
    };

    const getNotesValue = (lead: DemoLead) => {
        return editingNotes[lead.id] !== undefined ? editingNotes[lead.id] : (lead.admin_notes || '');
    };

    const hasUnsavedNotes = (lead: DemoLead) => {
        return editingNotes[lead.id] !== undefined && editingNotes[lead.id] !== (lead.admin_notes || '');
    };

    return (
        <div className="space-y-6">
            {/* Search */}
            <div className="relative max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-blue-light/50 transition-colors"
                />
            </div>

            {/* Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Company</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Role</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredLeads.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                    {searchTerm ? 'No leads match your search.' : 'No leads yet.'}
                                </td>
                            </tr>
                        ) : (
                            filteredLeads.map((lead) => (
                                <React.Fragment key={lead.id}>
                                    <tr
                                        onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}
                                        className="hover:bg-white/5 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue-light font-bold mr-3 flex-shrink-0">
                                                    {lead.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-medium text-white truncate">{lead.full_name}</div>
                                                    <div className="text-sm text-slate-400 truncate">{lead.email || lead.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400 hidden md:table-cell">
                                            {lead.company_name || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400 hidden lg:table-cell">
                                            {lead.job_title || '—'}
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                                {lead.email && (
                                                    <span className="flex items-center gap-1">
                                                        <Mail size={12} className="text-slate-500" />
                                                        <span className="hidden xl:inline truncate max-w-[140px]">{lead.email}</span>
                                                    </span>
                                                )}
                                                {lead.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone size={12} className="text-slate-500" />
                                                        <span className="hidden xl:inline">{lead.phone}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[lead.status] || STATUS_STYLES.new}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400 hidden md:table-cell">
                                            {new Date(lead.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ChevronDown
                                                size={16}
                                                className={`text-slate-400 transition-transform duration-200 ${expandedLeadId === lead.id ? 'rotate-180' : ''}`}
                                            />
                                        </td>
                                    </tr>

                                    {/* Expandable Panel */}
                                    {expandedLeadId === lead.id && (
                                        <tr>
                                            <td colSpan={7} className="p-0">
                                                <div className="bg-slate-900/50 border-t border-white/5 px-6 py-8 animate-fade-in">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                                                        {/* Card 1: Contact Details */}
                                                        <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-5 hover:border-white/[0.12] transition-colors">
                                                            <div className="flex items-center gap-2.5 mb-4">
                                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                                    <User size={16} className="text-blue-400" />
                                                                </div>
                                                                <h4 className="text-sm font-semibold text-white">Contact Details</h4>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <DetailRow label="Full Name" value={lead.full_name} />
                                                                <DetailRow label="Email" value={lead.email} />
                                                                <DetailRow label="Phone" value={lead.phone} />
                                                                <DetailRow label="Preferred Contact" value={lead.preferred_contact} />
                                                            </div>
                                                        </div>

                                                        {/* Card 2: Professional Info */}
                                                        <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-5 hover:border-white/[0.12] transition-colors">
                                                            <div className="flex items-center gap-2.5 mb-4">
                                                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                                                    <Building2 size={16} className="text-purple-400" />
                                                                </div>
                                                                <h4 className="text-sm font-semibold text-white">Professional Info</h4>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <DetailRow label="Job Title" value={lead.job_title} />
                                                                <DetailRow label="Company" value={lead.company_name} />
                                                                <DetailRow label="Company Size" value={lead.employee_count} />
                                                            </div>
                                                        </div>

                                                        {/* Card 3: Interests & Timing */}
                                                        <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-5 hover:border-white/[0.12] transition-colors">
                                                            <div className="flex items-center gap-2.5 mb-4">
                                                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                                    <Target size={16} className="text-amber-400" />
                                                                </div>
                                                                <h4 className="text-sm font-semibold text-white">Interests & Timing</h4>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Interests</div>
                                                                    {lead.interests && lead.interests.length > 0 ? (
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {lead.interests.map((interest) => (
                                                                                <span
                                                                                    key={interest}
                                                                                    className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[11px] text-slate-300"
                                                                                >
                                                                                    {interest}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-sm text-slate-600">—</span>
                                                                    )}
                                                                </div>
                                                                <DetailRow
                                                                    label="Decision Timeline"
                                                                    value={lead.decision_timeline ? TIMELINE_LABELS[lead.decision_timeline] || lead.decision_timeline : null}
                                                                />
                                                                {lead.problems_to_solve && (
                                                                    <div>
                                                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Challenges</div>
                                                                        <p className="text-sm text-slate-300 leading-relaxed bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                                                                            {lead.problems_to_solve}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Card 4: Status & Notes */}
                                                        <div
                                                            className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-5 hover:border-white/[0.12] transition-colors"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <div className="flex items-center gap-2.5 mb-4">
                                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                                    <ClipboardList size={16} className="text-emerald-400" />
                                                                </div>
                                                                <h4 className="text-sm font-semibold text-white">Status & Notes</h4>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Status</div>
                                                                    <select
                                                                        value={lead.status}
                                                                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                                                        disabled={updatingStatus === lead.id}
                                                                        className="bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white w-full focus:outline-none focus:border-brand-blue-light/50 disabled:opacity-50 cursor-pointer"
                                                                    >
                                                                        <option value="new" className="bg-[#0A0D12]">New</option>
                                                                        <option value="contacted" className="bg-[#0A0D12]">Contacted</option>
                                                                        <option value="qualified" className="bg-[#0A0D12]">Qualified</option>
                                                                        <option value="converted" className="bg-[#0A0D12]">Converted</option>
                                                                        <option value="closed" className="bg-[#0A0D12]">Closed</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Admin Notes</div>
                                                                    <textarea
                                                                        value={getNotesValue(lead)}
                                                                        onChange={(e) => setEditingNotes((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                                                                        rows={4}
                                                                        placeholder="Add notes about this lead..."
                                                                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-brand-blue-light/50 transition-colors"
                                                                    />
                                                                    {hasUnsavedNotes(lead) && (
                                                                        <button
                                                                            onClick={() => handleSaveNotes(lead.id)}
                                                                            disabled={savingNotes === lead.id}
                                                                            className="mt-2 px-4 py-2 bg-brand-blue-light/20 text-brand-blue-light rounded-lg text-sm font-medium hover:bg-brand-blue-light/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                                                                        >
                                                                            {savingNotes === lead.id ? (
                                                                                <Loader2 size={14} className="animate-spin" />
                                                                            ) : null}
                                                                            Save Notes
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Count */}
            <div className="text-sm text-slate-500">
                {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
                {searchTerm && ` matching "${searchTerm}"`}
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{label}</div>
            <div className="text-sm text-slate-300">{value || '—'}</div>
        </div>
    );
}
