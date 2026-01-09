'use client';

import React, { useState, useEffect } from 'react';
import {
    AdminUser,
    promoteUser,
    createUser,
    deleteUser,
    resetUserPassword,
    updateAuthorStatus,
    updateOrgAdmin,
    addUserToOrg,
    removeUserFromOrg,
    changeUserOrg,
    transferOrgOwnership,
    updateBillingDisabled,
    emailTemporaryPassword,
    getAllOrganizations,
    getOrgMembersForTransfer
} from '@/app/actions/users';
import { User, Shield, Plus, Search, Check, X, Trash2, AlertTriangle, Key, ChevronDown, Mail, KeyRound, UserCog, Building2, CreditCard } from 'lucide-react';

interface UsersTableProps {
    initialUsers: AdminUser[];
}

// Toggle Switch Component
function ToggleSwitch({ checked, onChange, disabled = false }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); !disabled && onChange(!checked); }}
            disabled={disabled}
            className={`relative w-11 h-6 rounded-full transition-colors ${
                checked ? 'bg-brand-blue-light' : 'bg-white/10'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                checked ? 'translate-x-5' : ''
            }`} />
        </button>
    );
}

export default function UsersTable({ initialUsers }: UsersTableProps) {
    const [users, setUsers] = useState<AdminUser[]>(initialUsers);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
    const [userToResetPassword, setUserToResetPassword] = useState<AdminUser | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // New state for expandable panel
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [organizations, setOrganizations] = useState<{id: string, name: string, slug: string}[]>([]);
    const [orgMembers, setOrgMembers] = useState<{id: string, fullName: string, email: string}[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [transferOwnershipUser, setTransferOwnershipUser] = useState<AdminUser | null>(null);

    // Fetch organizations on mount
    useEffect(() => {
        getAllOrganizations().then(result => {
            if (result.data) {
                setOrganizations(result.data);
            }
        });
    }, []);

    // Filter users
    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePromote = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            await promoteUser(userId, newRole);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            alert('Failed to update role');
            console.error(error);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            const res = await deleteUser(userId);
            if (res?.error) {
                alert(res.error);
            } else {
                setUsers(prev => prev.filter(u => u.id !== userId));
                setUserToDelete(null);
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('Failed to delete user');
        }
    };

    // Handler functions for expanded panel actions
    const handleEmailTempPassword = async (user: AdminUser) => {
        setActionLoading('email-password');
        try {
            const result = await emailTemporaryPassword(user.id);
            if (result.error) {
                alert(`Failed to send email: ${result.error}`);
            } else {
                alert(`Temporary password sent to ${user.email}`);
            }
        } catch (error) {
            alert('Failed to send temporary password');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateAuthorStatus = async (userId: string, status: string) => {
        try {
            await updateAuthorStatus(userId, status as 'none' | 'pending' | 'approved' | 'rejected');
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, authorStatus: status as AdminUser['authorStatus'] } : u));
        } catch (error) {
            alert('Failed to update instructor status');
        }
    };

    const handleUpdateOrgAdmin = async (userId: string, isOrgAdmin: boolean) => {
        try {
            await updateOrgAdmin(userId, isOrgAdmin);
            setUsers(prev => prev.map(u => u.id === userId ? {
                ...u,
                membershipStatus: isOrgAdmin ? 'org_admin' : 'employee'
            } : u));
        } catch (error) {
            alert('Failed to update org admin status');
        }
    };

    const handleAddToOrg = async (userId: string, orgId: string) => {
        try {
            await addUserToOrg(userId, orgId);
            const org = organizations.find(o => o.id === orgId);
            setUsers(prev => prev.map(u => u.id === userId ? {
                ...u,
                orgId,
                orgName: org?.name || null,
                membershipStatus: 'employee'
            } : u));
        } catch (error) {
            alert('Failed to add user to organization');
        }
    };

    const handleRemoveFromOrg = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this user from their organization?')) return;
        try {
            await removeUserFromOrg(userId);
            setUsers(prev => prev.map(u => u.id === userId ? {
                ...u,
                orgId: null,
                orgName: null,
                membershipStatus: 'trial',
                isOrgOwner: false
            } : u));
        } catch (error) {
            alert('Failed to remove user from organization');
        }
    };

    const handleChangeOrg = async (userId: string, newOrgId: string) => {
        try {
            await changeUserOrg(userId, newOrgId);
            const org = organizations.find(o => o.id === newOrgId);
            setUsers(prev => prev.map(u => u.id === userId ? {
                ...u,
                orgId: newOrgId,
                orgName: org?.name || null
            } : u));
        } catch (error) {
            alert('Failed to change organization');
        }
    };

    const handleUpdateBillingDisabled = async (userId: string, disabled: boolean) => {
        try {
            await updateBillingDisabled(userId, disabled);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, billingDisabled: disabled } : u));
        } catch (error) {
            alert('Failed to update billing status');
        }
    };

    const handleTransferOwnershipClick = async (user: AdminUser) => {
        if (user.orgId) {
            const result = await getOrgMembersForTransfer(user.orgId);
            if (result.data) {
                setOrgMembers(result.data);
            }
            setTransferOwnershipUser(user);
        }
    };

    const handleTransferOwnership = async (newOwnerId: string) => {
        if (!transferOwnershipUser?.orgId) return;
        if (!confirm('Are you sure you want to transfer ownership? The new owner will automatically become an org admin.')) return;

        try {
            await transferOrgOwnership(transferOwnershipUser.orgId, newOwnerId);
            // Update local state - old owner loses ownership, new owner gains it
            setUsers(prev => prev.map(u => {
                if (u.id === transferOwnershipUser.id) {
                    return { ...u, isOrgOwner: false };
                }
                if (u.id === newOwnerId) {
                    return { ...u, isOrgOwner: true, membershipStatus: 'org_admin' };
                }
                return u;
            }));
            setTransferOwnershipUser(null);
        } catch (error) {
            alert('Failed to transfer ownership');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-blue-light/50 transition-colors"
                    />
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center px-4 py-2.5 bg-brand-blue text-brand-black rounded-xl font-bold hover:bg-brand-blue-light transition-colors"
                >
                    <Plus size={20} className="mr-2" />
                    Create User
                </button>
            </div>

            {/* Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Joined</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Last Login</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredUsers.map((user) => (
                            <React.Fragment key={user.id}>
                                <tr
                                    onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                                    className="hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold mr-3">
                                                {user.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{user.fullName}</div>
                                                <div className="text-sm text-slate-400">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === 'admin'
                                            ? 'bg-brand-orange/10 text-brand-orange border-brand-orange/20'
                                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                            }`}>
                                            {user.role === 'admin' && <Shield size={12} className="mr-1" />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {user.lastSignIn ? new Date(user.lastSignIn).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ChevronDown
                                            size={16}
                                            className={`text-slate-400 transition-transform duration-200 ${expandedUserId === user.id ? 'rotate-180' : ''}`}
                                        />
                                    </td>
                                </tr>

                                {/* Expandable Panel */}
                                {expandedUserId === user.id && (
                                    <tr>
                                        <td colSpan={5} className="p-0">
                                            <div className="bg-slate-900/50 border-t border-white/5 px-6 py-8 animate-fade-in">
                                                {/* Two Column Grid for Main Sections */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                                                    {/* Card 1: Reset Password */}
                                                    <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-5 hover:border-white/[0.12] transition-colors">
                                                        <div className="flex items-center gap-2.5 mb-4">
                                                            <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                                                                <KeyRound size={16} className="text-brand-blue-light" />
                                                            </div>
                                                            <h4 className="text-sm font-semibold text-white">Reset Password</h4>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleEmailTempPassword(user); }}
                                                                disabled={actionLoading === 'email-password'}
                                                                className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-slate-300 hover:bg-white/[0.08] hover:border-white/[0.12] transition-all disabled:opacity-50 group"
                                                            >
                                                                <Mail size={16} className="text-slate-400 group-hover:text-brand-blue-light transition-colors" />
                                                                <div className="text-left">
                                                                    <div className="font-medium">Email Temporary Password</div>
                                                                    <div className="text-xs text-slate-500 mt-0.5">Send a secure reset link to user's email</div>
                                                                </div>
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setUserToResetPassword(user); }}
                                                                className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-slate-300 hover:bg-white/[0.08] hover:border-white/[0.12] transition-all group"
                                                            >
                                                                <Key size={16} className="text-slate-400 group-hover:text-brand-blue-light transition-colors" />
                                                                <div className="text-left">
                                                                    <div className="font-medium">Set Password Manually</div>
                                                                    <div className="text-xs text-slate-500 mt-0.5">Create a new password for this user</div>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Card 2: Roles */}
                                                    <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-5 hover:border-white/[0.12] transition-colors">
                                                        <div className="flex items-center gap-2.5 mb-4">
                                                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                                                <UserCog size={16} className="text-purple-400" />
                                                            </div>
                                                            <h4 className="text-sm font-semibold text-white">Roles & Permissions</h4>
                                                        </div>
                                                        <div className="space-y-1">
                                                            {/* Instructor Status - Dropdown */}
                                                            <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                                                                <div>
                                                                    <span className="text-sm text-slate-300">Instructor Status</span>
                                                                    <p className="text-xs text-slate-500 mt-0.5">Can create and publish courses</p>
                                                                </div>
                                                                <select
                                                                    value={user.authorStatus}
                                                                    onChange={(e) => handleUpdateAuthorStatus(user.id, e.target.value)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-blue-light/50 focus:ring-1 focus:ring-brand-blue-light/20"
                                                                >
                                                                    <option value="none">None</option>
                                                                    <option value="pending">Pending</option>
                                                                    <option value="approved">Approved</option>
                                                                    <option value="rejected">Rejected</option>
                                                                </select>
                                                            </div>

                                                            {/* Org Admin Toggle - Only if user has org */}
                                                            {user.orgId && (
                                                                <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                                                                    <div>
                                                                        <span className="text-sm text-slate-300">Organization Admin</span>
                                                                        <p className="text-xs text-slate-500 mt-0.5">Manage org members and settings</p>
                                                                    </div>
                                                                    <ToggleSwitch
                                                                        checked={user.membershipStatus === 'org_admin'}
                                                                        onChange={(checked) => handleUpdateOrgAdmin(user.id, checked)}
                                                                        disabled={user.isOrgOwner}
                                                                    />
                                                                </div>
                                                            )}

                                                            {/* Platform Admin Toggle */}
                                                            <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                                                                <div>
                                                                    <span className="text-sm text-slate-300">Platform Admin</span>
                                                                    <p className="text-xs text-slate-500 mt-0.5">Full access to admin dashboard</p>
                                                                </div>
                                                                <ToggleSwitch
                                                                    checked={user.role === 'admin'}
                                                                    onChange={() => handlePromote(user.id, user.role)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Card 3: Accounts & Membership */}
                                                    <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-5 hover:border-white/[0.12] transition-colors">
                                                        <div className="flex items-center gap-2.5 mb-4">
                                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                                <Building2 size={16} className="text-emerald-400" />
                                                            </div>
                                                            <h4 className="text-sm font-semibold text-white">Organization Membership</h4>
                                                        </div>

                                                        {/* Individual Account */}
                                                        {!user.orgId && (
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-300 border border-slate-500/20">
                                                                        Individual Account
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-slate-500">This user is not part of any organization.</p>
                                                                <select
                                                                    onChange={(e) => e.target.value && handleAddToOrg(user.id, e.target.value)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-light/50"
                                                                    defaultValue=""
                                                                >
                                                                    <option value="" disabled>Add to Organization...</option>
                                                                    {organizations.map(org => (
                                                                        <option key={org.id} value={org.id}>{org.name}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )}

                                                        {/* Employee */}
                                                        {user.orgId && !user.isOrgOwner && (
                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                                                            Employee
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <span className="text-slate-400">Organization:</span>
                                                                    <span className="text-white font-medium">{user.orgName}</span>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <select
                                                                        onChange={(e) => e.target.value && handleChangeOrg(user.id, e.target.value)}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-light/50"
                                                                        defaultValue=""
                                                                    >
                                                                        <option value="" disabled>Change Organization...</option>
                                                                        {organizations.filter(o => o.id !== user.orgId).map(org => (
                                                                            <option key={org.id} value={org.id}>{org.name}</option>
                                                                        ))}
                                                                    </select>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleRemoveFromOrg(user.id); }}
                                                                        className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors whitespace-nowrap"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Org Owner */}
                                                        {user.isOrgOwner && (
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-orange/20 text-brand-orange border border-brand-orange/30">
                                                                        Owner
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <span className="text-slate-400">Organization:</span>
                                                                    <span className="text-white font-medium">{user.orgName}</span>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleTransferOwnershipClick(user); }}
                                                                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-slate-300 hover:bg-white/[0.08] transition-colors"
                                                                >
                                                                    Transfer Ownership...
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Card 4: Billing */}
                                                    <div className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-5 hover:border-white/[0.12] transition-colors">
                                                        <div className="flex items-center gap-2.5 mb-4">
                                                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                                <CreditCard size={16} className="text-amber-400" />
                                                            </div>
                                                            <h4 className="text-sm font-semibold text-white">Billing Settings</h4>
                                                        </div>
                                                        <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                                                            <div>
                                                                <span className="text-sm text-slate-300">Billing Disabled</span>
                                                                <p className="text-xs text-slate-500 mt-0.5">Exempts user from all platform charges</p>
                                                            </div>
                                                            <ToggleSwitch
                                                                checked={user.billingDisabled}
                                                                onChange={(checked) => handleUpdateBillingDisabled(user.id, checked)}
                                                            />
                                                        </div>
                                                        {user.billingDisabled && (
                                                            <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                                                <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                                                                <p className="text-xs text-amber-300/80">This user will not be charged for any platform services.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Full Width Danger Zone Card */}
                                                <div className="bg-red-500/[0.05] rounded-xl border border-red-500/20 p-5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                                                                <AlertTriangle size={16} className="text-red-400" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-red-400">Danger Zone</h4>
                                                                <p className="text-xs text-red-400/60 mt-0.5">Permanently delete this account and all associated data</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setUserToDelete(user); }}
                                                            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 border border-red-500/30 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/30 hover:border-red-500/40 transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                            Delete Account
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <CreateUserModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={(newUser) => {
                        setUsers(prev => [newUser, ...prev]);
                        setIsCreateModalOpen(false);
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {userToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
                                <AlertTriangle size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Delete User?</h2>
                            <p className="text-slate-400">
                                Are you sure you want to delete <span className="text-white font-medium">{userToDelete.fullName}</span>?
                                <br />
                                This action is permanent and cannot be undone.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setUserToDelete(null)}
                                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteUser(userToDelete.id)}
                                className="flex-1 px-4 py-2.5 bg-red-500 text-white hover:bg-red-600 rounded-xl font-bold transition-colors"
                            >
                                Delete User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {userToResetPassword && (
                <ResetPasswordModal
                    user={userToResetPassword}
                    onClose={() => setUserToResetPassword(null)}
                />
            )}

            {/* Transfer Ownership Modal */}
            {transferOwnershipUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-white">Transfer Ownership</h2>
                                <p className="text-sm text-slate-400 mt-1">
                                    Transfer ownership of <span className="text-white">{transferOwnershipUser.orgName}</span>
                                </p>
                            </div>
                            <button onClick={() => setTransferOwnershipUser(null)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {orgMembers.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-slate-400">No eligible members to transfer ownership to.</p>
                                <p className="text-sm text-slate-500 mt-2">Add other members to the organization first.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {orgMembers.map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => handleTransferOwnership(member.id)}
                                        className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        <div className="text-left">
                                            <div className="text-sm text-white font-medium">{member.fullName}</div>
                                            <div className="text-xs text-slate-400">{member.email}</div>
                                        </div>
                                        <span className="text-xs text-brand-blue-light">Select</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="mt-6">
                            <button
                                onClick={() => setTransferOwnershipUser(null)}
                                className="w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: (user: AdminUser) => void }) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError('');

        const res = await createUser(null, formData);

        if (res?.error) {
            setError(res.error);
            setLoading(false);
        } else {
            // Refresh page or manually add to list (requires returning user object from action, which we didn't implement yet)
            // For now, let's just reload window to fetch fresh data or we can update the action to return the user
            window.location.reload();
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Create New User</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                        <input name="fullName" required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-blue" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                        <input name="email" type="email" required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-blue" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                        <input name="password" type="password" required minLength={6} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-blue" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Role</label>
                        <select name="role" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-blue">
                            <option value="user">User</option>
                            <option value="admin">Platform Admin</option>
                            <option value="org_admin">Org Admin</option>
                            <option value="instructor">Expert</option>
                        </select>
                    </div>

                    {error && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</div>}

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-brand-blue text-brand-black font-bold rounded-lg hover:bg-brand-blue-light disabled:opacity-50">
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ResetPasswordModal({ user, onClose }: { user: AdminUser, onClose: () => void }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        const res = await resetUserPassword(user.id, newPassword);

        if (res?.error) {
            setError(res.error);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 text-emerald-500">
                            <Check size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Password Reset</h2>
                        <p className="text-slate-400">
                            Password for <span className="text-white font-medium">{user.fullName}</span> has been successfully updated.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2.5 bg-brand-blue text-brand-black rounded-xl font-bold hover:bg-brand-blue-light transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center text-brand-orange">
                            <Key size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Reset Password</h2>
                            <p className="text-sm text-slate-400">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder="Enter new password"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-blue transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder="Confirm new password"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-blue transition-colors"
                        />
                    </div>

                    {error && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</div>}

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-brand-orange text-white rounded-xl font-bold hover:bg-brand-orange/90 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
