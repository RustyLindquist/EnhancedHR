
import React from 'react';
import { OrgMember } from '@/app/actions/org';
import { User, Clock, Award, MessageSquare, BookOpen } from 'lucide-react';

interface UserCardProps {
    member: OrgMember;
    onClick: () => void;
}

export default function UserCard({ member, onClick }: UserCardProps) {
    return (
        <div
            onClick={onClick}
            className="group relative bg-[#131b2c] border border-white/5 rounded-2xl overflow-hidden hover:border-brand-blue-light/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-brand-blue-light/10"
        >
            {/* Header / Avatar Area */}
            <div className="p-6 pb-4 flex items-start justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue-dark to-brand-blue-light/30 flex items-center justify-center border border-white/10 text-white font-bold text-lg">
                        {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            member.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                        )}
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-lg group-hover:text-brand-blue-light transition-colors">
                            {member.full_name}
                        </h3>
                        <p className="text-slate-400 text-sm">{member.role_title || member.role}</p>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${member.membership_status === 'active' || member.membership_status === 'org_admin' ? 'bg-green-500/10 text-green-400' : 'bg-slate-500/10 text-slate-400'
                    }`}>
                    {member.membership_status === 'org_admin' ? 'Admin' : 'Member'}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-px bg-white/5 mx-6 mb-6 mt-2 rounded-xl overflow-hidden border border-white/5">

                {/* Courses */}
                <div className="bg-[#131b2c] p-3 flex flex-col items-center justify-center text-center group-hover:bg-[#1a2438] transition-colors">
                    <BookOpen size={16} className="text-brand-blue-light mb-1 opacity-70" />
                    <span className="text-white font-bold text-lg">{member.courses_completed || 0}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Courses</span>
                </div>

                {/* Credits */}
                <div className="bg-[#131b2c] p-3 flex flex-col items-center justify-center text-center group-hover:bg-[#1a2438] transition-colors">
                    <Award size={16} className="text-brand-orange mb-1 opacity-70" />
                    <span className="text-white font-bold text-lg">{member.credits_earned || 0}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Credits</span>
                </div>

                {/* Time */}
                <div className="bg-[#131b2c] p-3 flex flex-col items-center justify-center text-center group-hover:bg-[#1a2438] transition-colors">
                    <Clock size={16} className="text-purple-400 mb-1 opacity-70" />
                    <span className="text-white font-bold text-lg">{member.total_time_spent_minutes || 0}<span className="text-xs font-normal text-slate-500 ml-0.5">m</span></span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Time</span>
                </div>

                {/* AI Chats */}
                <div className="bg-[#131b2c] p-3 flex flex-col items-center justify-center text-center group-hover:bg-[#1a2438] transition-colors">
                    <MessageSquare size={16} className="text-pink-400 mb-1 opacity-70" />
                    <span className="text-white font-bold text-lg">{member.conversations_count || 0}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">AI Chats</span>
                </div>
            </div>

            {/* Footer / Last Active */}
            <div className="px-6 pb-4 pt-0 flex justify-between items-center text-xs text-slate-500 border-t border-white/5 mt-auto">
                <span className="py-3">Last Active:</span>
                <span className="text-slate-400">
                    {member.last_login ? new Date(member.last_login).toLocaleDateString() : 'Never'}
                </span>
            </div>
        </div>
    );
}
