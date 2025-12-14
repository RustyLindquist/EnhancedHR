'use client';

// Same pattern as InviteMemberPanel (Dropdown)
import React, { useState, useEffect } from 'react';
import DropdownPanel from '../DropdownPanel';
import { Users, Search, Check, Loader2 } from 'lucide-react';
import { createGroup, updateGroup } from '@/app/actions/groups';
import { getOrgMembers } from '@/app/actions/org';

interface GroupManagementProps {
    isOpen: boolean;
    onClose: () => void;
    editGroup?: any; // If editing
    onSuccess?: () => void;
}

const GroupManagement: React.FC<GroupManagementProps> = ({ isOpen, onClose, editGroup, onSuccess }) => {
    const [name, setName] = useState('');
    const [members, setMembers] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadMembers();
            if (editGroup) {
                setName(editGroup.name);
                setSelectedIds(new Set(editGroup.members?.map((m: any) => m.user_id) || []));
            } else {
                setName('');
                setSelectedIds(new Set());
            }
        }
    }, [isOpen, editGroup]);

    const loadMembers = async () => {
        setLoading(true);
        const { members: userList } = await getOrgMembers();
        setMembers(userList || []);
        setLoading(false);
    };

    const toggleMember = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setSubmitting(true);

        let res;
        if (editGroup) {
            res = await updateGroup(editGroup.id, name, Array.from(selectedIds));
        } else {
            res = await createGroup(name, Array.from(selectedIds));
        }

        setSubmitting(false);

        if (res.success) {
            if (onSuccess) onSuccess();
            onClose();
        } else {
            alert('Failed to save group');
        }
    };

    const filteredMembers = members.filter(m =>
        m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DropdownPanel isOpen={isOpen} onClose={onClose} title={editGroup ? "Manage Group" : "Create Group"} icon={Users}>
            <div className="space-y-6">

                {/* Name Input */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Group Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Sales Team, Leadership, Onboarding"
                        className="w-full px-4 py-3 bg-[#0B1120] border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue/50 focus:border-brand-blue/50 text-white font-medium placeholder-slate-600 shadow-inner"
                    />
                </div>

                {/* Member Selection */}
                <div className="flex-1 flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center mb-3">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Add Employees</label>
                        <span className="text-xs text-brand-blue font-bold">{selectedIds.size} Selected</span>
                    </div>

                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            className="w-full pl-9 pr-4 py-2 bg-[#0B1120] border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue/50 text-white placeholder-slate-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 border border-white/10 rounded-xl overflow-hidden bg-[#0B1120]/50 max-h-[300px] overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="animate-spin text-slate-500" />
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {filteredMembers.map(member => (
                                    <div
                                        key={member.id}
                                        onClick={() => toggleMember(member.id)}
                                        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors ${selectedIds.has(member.id) ? 'bg-brand-blue/10' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedIds.has(member.id) ? 'bg-brand-blue text-white' : 'bg-white/10 text-slate-400'
                                                }`}>
                                                {(member.full_name || 'U').charAt(0)}
                                            </div>
                                            <div>
                                                <div className={`text-sm font-medium ${selectedIds.has(member.id) ? 'text-brand-blue-light' : 'text-slate-200'}`}>
                                                    {member.full_name}
                                                </div>
                                                <div className="text-xs text-slate-500">{member.role}</div>
                                            </div>
                                        </div>
                                        {selectedIds.has(member.id) && (
                                            <Check size={16} className="text-brand-blue" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Action */}
                <button
                    onClick={handleSubmit}
                    disabled={!name.trim() || submitting}
                    className="w-full py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-brand-blue-light transition-colors disabled:opacity-50 shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2"
                >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    {submitting ? 'Saving...' : (editGroup ? 'Update Group' : 'Create Group')}
                </button>

            </div>
        </DropdownPanel>
    );
};

export default GroupManagement;
