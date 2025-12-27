import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, Layers, Settings, LogOut, BarChart2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function OrgLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Verify Org Access
    const { data: profile } = await supabase
        .from('profiles')
        .select('org_id, membership_status, organizations(name)')
        .eq('id', user.id)
        .single();

    if (!profile?.org_id || (profile.membership_status !== 'org_admin' && profile.membership_status !== 'employee')) {
        // If not in an org, redirect to join or home
        redirect('/');
    }

    const orgName = (profile.organizations as any)?.name || 'Organization';

    return (
        <div className="flex h-screen w-full bg-[#0A0D12] text-white font-sans selection:bg-brand-blue-light/30">
            {/* Org Sidebar */}
            <aside className="w-64 flex-shrink-0 border-r border-white/10 bg-[#0f172a]/50 backdrop-blur-xl flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold">
                            {orgName.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-sm tracking-wide truncate">{orgName}</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link href="/org" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                        <LayoutDashboard size={18} />
                        <span className="text-sm font-medium">Dashboard</span>
                    </Link>
                    <Link href="/org/team" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                        <Users size={18} />
                        <span className="text-sm font-medium">Team Members</span>
                    </Link>
                    <Link href="/org/collections" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                        <Layers size={18} />
                        <span className="text-sm font-medium">Collections</span>
                    </Link>
                    {profile.membership_status === 'org_admin' && (
                        <Link href="/org/analytics" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                            <BarChart2 size={18} />
                            <span className="text-sm font-medium">AI Analytics</span>
                        </Link>
                    )}
                    <Link href="/org/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                        <Settings size={18} />
                        <span className="text-sm font-medium">Settings</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Back to Learning</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden flex flex-col relative">
                {/* Header */}
                <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#0A0D12]/80 backdrop-blur-xl z-20">
                    <h2 className="text-lg font-bold text-white">Organization Portal</h2>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-bold text-white">{user.user_metadata?.full_name || user.email}</p>
                            <p className="text-xs text-slate-500 capitalize">{profile.membership_status?.replace('_', ' ')}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-400">
                            {(user.email || 'U').substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {children}
                </div>
            </main>
        </div>
    );
}
