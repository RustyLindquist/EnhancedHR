'use client';

import React, { useState } from 'react';
import { AdminUser, promoteUser, createUser } from '@/app/actions/users';
import { User, Shield, MoreVertical, Plus, Search, Check, X } from 'lucide-react';

interface UsersTableProps {
    initialUsers: AdminUser[];
}

export default function UsersTable({ initialUsers }: UsersTableProps) {
    const [users, setUsers] = useState<AdminUser[]>(initialUsers);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Filter users
    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePromote = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

        try {
            await promoteUser(userId, newRole);
            // Optimistic update
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            alert('Failed to update role');
            console.error(error);
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
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
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
                                    <button
                                        onClick={() => handlePromote(user.id, user.role)}
                                        className="text-sm text-brand-blue-light hover:text-white transition-colors"
                                    >
                                        {user.role === 'admin' ? 'Demote' : 'Promote'}
                                    </button>
                                </td>
                            </tr>
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
                            <option value="admin">Admin</option>
                            <option value="instructor">Instructor</option>
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
