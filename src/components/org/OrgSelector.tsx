'use client';

import React, { useState, useTransition } from 'react';
import { ChevronDown, Building2, Check, Shield, Users } from 'lucide-react';
import { switchPlatformAdminOrg } from '@/app/actions/org';

interface Organization {
    id: string;
    name: string;
    slug: string;
    memberCount: number;
}

interface OrgSelectorProps {
    organizations: Organization[];
    currentOrgId: string;
    currentOrgName: string;
}

export default function OrgSelector({ organizations, currentOrgId, currentOrgName }: OrgSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSelectOrg = (orgId: string) => {
        if (orgId === currentOrgId) {
            setIsOpen(false);
            return;
        }

        startTransition(async () => {
            const result = await switchPlatformAdminOrg(orgId);
            if (result.success) {
                setIsOpen(false);
                // The page will revalidate automatically
            } else {
                console.error('Failed to switch org:', result.error);
            }
        });
    };

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-16 flex items-center justify-between px-6 hover:bg-white/5 transition-colors"
                disabled={isPending}
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                        <Shield size={16} />
                    </div>
                    <div className="text-left">
                        <span className="font-bold text-sm tracking-wide truncate block max-w-[140px]">
                            {isPending ? 'Switching...' : currentOrgName}
                        </span>
                        <span className="text-xs text-purple-400">Admin View</span>
                    </div>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Panel */}
                    <div className="absolute left-0 right-0 top-full z-50 bg-[#0f172a] border border-white/10 shadow-2xl max-h-80 overflow-y-auto">
                        <div className="p-2">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-2">
                                Switch Organization
                            </p>
                            {organizations.map((org) => (
                                <button
                                    key={org.id}
                                    onClick={() => handleSelectOrg(org.id)}
                                    disabled={isPending}
                                    className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg transition-colors ${
                                        org.id === currentOrgId
                                            ? 'bg-brand-blue-light/10 text-brand-blue-light'
                                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                            org.id === currentOrgId
                                                ? 'bg-brand-blue-light/20 text-brand-blue-light'
                                                : 'bg-white/10 text-slate-400'
                                        }`}>
                                            {org.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-sm">{org.name}</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                <Users size={10} />
                                                {org.memberCount} {org.memberCount === 1 ? 'member' : 'members'}
                                            </p>
                                        </div>
                                    </div>
                                    {org.id === currentOrgId && (
                                        <Check size={16} className="text-brand-blue-light" />
                                    )}
                                </button>
                            ))}

                            {organizations.length === 0 && (
                                <p className="text-sm text-slate-500 text-center py-4">
                                    No organizations found
                                </p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
