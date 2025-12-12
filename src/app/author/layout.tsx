import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Video, DollarSign, Settings, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AuthorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Verify Author Access (Mock logic: assume all users can be authors for now, or check role)
    // In production, check if profile.role === 'author' or similar
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

    // For demo purposes, we'll allow access, but in real app:
    // if (profile?.role !== 'author') redirect('/');

    return (
        <div className="flex h-screen w-full bg-[#0A0D12] text-white font-sans selection:bg-brand-blue-light/30">
            {/* Author Sidebar */}
            <aside className="w-64 flex-shrink-0 border-r border-white/10 bg-[#0f172a]/50 backdrop-blur-xl flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <img
                            src="/images/logos/EnhancedHR-logo-mark-flame.png"
                            alt="EnhancedHR"
                            className="h-8 w-8 object-contain"
                        />
                        <span className="font-bold text-sm tracking-wide truncate">Author Portal</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link href="/author" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                        <LayoutDashboard size={18} />
                        <span className="text-sm font-medium">Dashboard</span>
                    </Link>
                    <Link href="/author/courses" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                        <Video size={18} />
                        <span className="text-sm font-medium">My Courses</span>
                    </Link>
                    <Link href="/author/earnings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                        <DollarSign size={18} />
                        <span className="text-sm font-medium">Earnings</span>
                    </Link>
                    <Link href="/author/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
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
                    <h2 className="text-lg font-bold text-white">Author Dashboard</h2>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-bold text-white">{profile?.full_name || user.email}</p>
                            <p className="text-xs text-slate-500 capitalize">Expert</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-400">
                            {(profile?.full_name || user.email || 'U').substring(0, 2).toUpperCase()}
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
