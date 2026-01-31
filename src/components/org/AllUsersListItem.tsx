'use client';

import React from 'react';
import { Users, ChevronRight } from 'lucide-react';

interface AllUsersListItemProps {
    onClick: () => void;
    memberCount: number;
}

export default function AllUsersListItem({ onClick, memberCount }: AllUsersListItemProps) {
    const glowColor = 'rgba(52, 211, 153, 0.6)'; // Emerald for All Users

    return (
        <div
            onClick={onClick}
            className="group relative flex items-center gap-4 px-4 py-3
                       bg-white/[0.03] hover:bg-white/[0.08]
                       border border-white/[0.06] hover:border-white/20
                       rounded-xl transition-all duration-300 cursor-pointer
                       overflow-hidden"
            style={{
                borderLeftWidth: '3px',
                borderLeftColor: glowColor,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 20px ${glowColor}30, 0 0 40px ${glowColor}15, inset 0 0 20px ${glowColor}08`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {/* Subtle gradient overlay on hover */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[10px]"
                style={{
                    background: `linear-gradient(135deg, ${glowColor}08 0%, transparent 50%)`
                }}
            />

            {/* Icon */}
            <div
                className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0
                           transition-transform duration-200 group-hover:scale-105"
                style={{
                    backgroundColor: 'rgba(52, 211, 153, 0.15)',
                    boxShadow: `0 0 20px ${glowColor}10`
                }}
            >
                <Users size={20} className="text-emerald-400" />
            </div>

            {/* Separator */}
            <div className="w-px h-8 bg-white/10 flex-shrink-0" />

            {/* Main Content */}
            <div className="flex-1 min-w-0 relative z-10">
                <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    All Users
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                    View all organization members
                </p>
            </div>

            {/* Right section - Member Count & Type Badge */}
            <div className="flex items-center gap-4 flex-shrink-0 relative z-10">
                {/* Member count */}
                <div className="flex items-center gap-2 text-slate-400 hidden sm:flex">
                    <Users size={14} />
                    <span className="text-sm font-medium text-white">{memberCount}</span>
                    <span className="text-[11px]">total</span>
                </div>

                <div className="w-px h-8 bg-white/10 flex-shrink-0 hidden sm:block" />

                {/* Type Badge */}
                <span
                    className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md hidden sm:block w-24 text-center"
                    style={{
                        backgroundColor: 'rgba(52, 211, 153, 0.12)',
                        color: 'rgb(52, 211, 153)',
                        border: '1px solid rgba(52, 211, 153, 0.20)'
                    }}
                >
                    All Members
                </span>

                <ChevronRight size={16} className="text-slate-600 ml-1" />
            </div>
        </div>
    );
}
