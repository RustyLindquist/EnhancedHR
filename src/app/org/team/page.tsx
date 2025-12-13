import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Shield } from 'lucide-react';
import RemoveUserButton from '@/components/org/RemoveUserButton';

export default async function OrgTeamPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get Org Details
    const { data: profile } = await supabase
        .from('profiles')
        .select('org_id, organizations(*)')
        .eq('id', user?.id)
        .single();

    if (!profile?.org_id) return <div>Access Denied</div>;

    const org = profile.organizations as any;
    // URL format: /[slug]/[hash]
    // We need to make sure we have the hash. In a real app, we might regenerate this.
    const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${org.slug}/${org.invite_hash}`;

    // Fetch Members
    const { data: members } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Team Members</h1>
                    <p className="text-slate-400">Manage your team and their access.</p>
                </div>
            </div>

            {/* Members List */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Member</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {members?.map((member) => (
                            <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                                            {(member.full_name || member.email || '?').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{member.full_name || 'Unknown'}</p>
                                            <p className="text-xs text-slate-400">{member.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${member.membership_status === 'org_admin'
                                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        }`}>
                                        {member.membership_status === 'org_admin' && <Shield size={10} />}
                                        {member.membership_status?.replace('_', ' ') || 'Member'}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-slate-400">
                                    {new Date(member.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                                        Active
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <RemoveUserButton userId={member.id} userName={member.full_name || member.email} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {members?.length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                        No members found. Invite someone!
                    </div>
                )}
            </div>
        </div>
    );
}
