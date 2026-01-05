'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Users, Loader2 } from 'lucide-react';
import { getOrgGroups, getMemberGroups, updateMemberGroups, EmployeeGroup } from '@/app/actions/groups';

interface AddToGroupModalProps {
    memberId: string;
    memberName: string;
    onClose: () => void;
    onSuccess?: () => void;
}

const AddToGroupModal: React.FC<AddToGroupModalProps> = ({
    memberId,
    memberName,
    onClose,
    onSuccess
}) => {
    const [groups, setGroups] = useState<EmployeeGroup[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [originalIds, setOriginalIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    useEffect(() => {
        loadData();
    }, [memberId]);

    const loadData = async () => {
        setLoading(true);
        const [allGroups, memberGroupIds] = await Promise.all([
            getOrgGroups(),
            getMemberGroups(memberId)
        ]);
        setGroups(allGroups);
        setSelectedIds(new Set(memberGroupIds));
        setOriginalIds(new Set(memberGroupIds));
        setLoading(false);
    };

    const toggleGroup = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        const result = await updateMemberGroups(
            memberId,
            Array.from(selectedIds),
            isCreatingNew && newGroupName.trim() ? { name: newGroupName.trim() } : undefined
        );

        if (result.success) {
            onSuccess?.();
            onClose();
        } else {
            alert(result.error || 'Failed to update groups');
        }
        setSaving(false);
    };

    const hasChanges = isCreatingNew && newGroupName.trim() ||
        selectedIds.size !== originalIds.size ||
        [...selectedIds].some(id => !originalIds.has(id));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Add to Group</h2>
                        <p className="text-xs text-slate-400 mt-1 truncate max-w-[250px]">{memberName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 pt-6 pb-0 max-h-[60vh] overflow-y-auto dropdown-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-slate-500" size={24} />
                        </div>
                    ) : (
                        <>
                            {/* Existing Groups List */}
                            <div className="space-y-3 mb-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Groups</h3>
                                {groups.length === 0 ? (
                                    <p className="text-sm text-slate-500 py-4 text-center">No groups yet. Create one below.</p>
                                ) : (
                                    groups.map(group => (
                                        <div
                                            key={group.id}
                                            onClick={() => toggleGroup(group.id)}
                                            className={`
                                                flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-300
                                                ${selectedIds.has(group.id)
                                                    ? 'bg-white/10 border-brand-blue-light/50 shadow-[0_0_15px_rgba(120,192,240,0.1)]'
                                                    : 'bg-transparent border-white/5 hover:border-white/20 hover:bg-white/5'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-brand-blue-light/20 flex items-center justify-center">
                                                    <Users size={14} className="text-brand-blue-light" />
                                                </div>
                                                <div>
                                                    <span className={`text-sm font-medium ${selectedIds.has(group.id) ? 'text-white' : 'text-slate-400'}`}>
                                                        {group.name}
                                                    </span>
                                                    <p className="text-xs text-slate-500">{group.member_count || 0} members</p>
                                                </div>
                                            </div>
                                            <div className={`
                                                w-5 h-5 rounded-full border flex items-center justify-center transition-all
                                                ${selectedIds.has(group.id)
                                                    ? 'bg-brand-blue-light border-brand-blue-light text-brand-black'
                                                    : 'border-slate-600'}
                                            `}>
                                                {selectedIds.has(group.id) && <Check size={12} />}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Create New Section */}
                            <div className={`border-t border-white/10 pt-4 transition-all duration-300 ${isCreatingNew ? 'bg-white/5 -mx-6 px-6 pb-4 mt-4' : ''}`}>
                                {!isCreatingNew ? (
                                    <button
                                        onClick={() => setIsCreatingNew(true)}
                                        className="flex items-center gap-2 text-brand-blue-light text-sm font-bold hover:text-white transition-colors mb-6"
                                    >
                                        <Plus size={16} />
                                        Create New Group
                                    </button>
                                ) : (
                                    <div className="animate-fade-in">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                                <Users size={14} className="text-brand-orange" />
                                                New Group
                                            </h3>
                                            <button
                                                onClick={() => {
                                                    setIsCreatingNew(false);
                                                    setNewGroupName('');
                                                }}
                                                className="text-xs text-slate-500 hover:text-white"
                                            >
                                                Cancel
                                            </button>
                                        </div>

                                        <input
                                            type="text"
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                            placeholder="Group Name..."
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue-light mb-2"
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3 z-10 relative">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className="px-6 py-2 bg-brand-blue-light text-brand-black text-sm font-bold rounded-lg hover:bg-white hover:shadow-[0_0_20px_rgba(120,192,240,0.4)] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AddToGroupModal;
