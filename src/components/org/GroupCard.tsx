import React from 'react';
import { Users, Sparkles } from 'lucide-react';
import { EmployeeGroup } from '@/app/actions/groups';

interface GroupCardProps {
    group: EmployeeGroup;
    onClick: () => void;
    isDynamic?: boolean;
}

export default function GroupCard({ group, onClick, isDynamic = false }: GroupCardProps) {
    return (
        <div
            onClick={onClick}
            className="group relative bg-[#131b2c] border border-white/5 rounded-2xl overflow-hidden hover:border-brand-blue-light/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-brand-blue-light/10 min-h-[200px] flex flex-col"
        >
            {/* Dynamic Badge - positioned at top left like Admin badge on UserCard */}
            {isDynamic && (
                <div className="absolute top-4 left-4 z-10">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider border border-purple-500/30">
                        <Sparkles size={10} />
                        Dynamic
                    </div>
                </div>
            )}

            {/* Header / Icon Area */}
            <div className="p-6 pb-4 flex items-start justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-blue-dark to-brand-blue-light/30 flex items-center justify-center border border-white/10">
                        <Users size={24} className="text-brand-blue-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg group-hover:text-brand-blue-light transition-colors truncate">
                            {group.name}
                        </h3>
                        <p className="text-slate-400 text-sm">Custom Group</p>
                    </div>
                </div>
            </div>

            {/* Members Count */}
            <div className="px-6 pb-6 flex-1 flex flex-col justify-end">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 group-hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-slate-400" />
                            <span className="text-sm text-slate-400">Members</span>
                        </div>
                        <span className="text-2xl font-bold text-white">{group.member_count || 0}</span>
                    </div>
                </div>
            </div>

            {/* Subtle hover glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-light/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
    );
}
