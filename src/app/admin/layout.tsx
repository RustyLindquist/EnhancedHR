import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, BookOpen, Users, Settings, LogOut } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-full bg-[#0A0D12] text-white font-sans selection:bg-brand-blue-light/30">
            {/* Admin Sidebar */}
            <aside className="w-64 flex-shrink-0 border-r border-white/10 bg-[#0f172a]/50 backdrop-blur-xl flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center font-bold text-white">
                            E
                        </div>
                        <span className="font-bold text-lg tracking-tight">EnhancedHR</span>
                    </div>
                    <div className="mt-2 px-2 py-1 bg-white/5 rounded text-[10px] font-bold uppercase tracking-widest text-slate-400 w-fit">
                        Admin Console
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <NavItem href="/admin" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem href="/admin/courses" icon={BookOpen} label="Courses" active />
                    <NavItem href="/admin/users" icon={Users} label="Users" />
                    <NavItem href="/admin/settings" icon={Settings} label="Settings" />
                </nav>

                <div className="p-4 border-t border-white/10">
                    <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Exit Admin</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden flex flex-col relative">
                {/* Top Bar */}
                <header className="h-16 border-b border-white/10 bg-[#0f172a]/30 backdrop-blur-md flex items-center justify-between px-8 flex-shrink-0">
                    <h1 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                        Platform Administration
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-700 border border-white/10"></div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavItem({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${active
                    ? 'bg-brand-blue-light/10 text-brand-blue-light border border-brand-blue-light/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}
            `}
        >
            <Icon size={18} className={active ? 'text-brand-blue-light' : 'text-slate-500 group-hover:text-white'} />
            <span className="text-sm font-bold">{label}</span>
        </Link>
    );
}
