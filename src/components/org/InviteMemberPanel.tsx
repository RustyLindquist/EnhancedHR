'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Copy, Check, Save, Link as LinkIcon, Users } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { updateOrgInviteHash, InviteInfo } from '@/app/actions/org';

interface InviteMemberPanelProps {
    isOpen: boolean;
    onClose: () => void;
    inviteInfo: InviteInfo | null;
    onUpdate: () => void;
}

const InviteMemberPanel: React.FC<InviteMemberPanelProps> = ({ isOpen, onClose, inviteInfo, onUpdate }) => {
    const [baseUrl, setBaseUrl] = useState('');
    const [inviteHash, setInviteHash] = useState('');
    const [originalHash, setOriginalHash] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);

    useEffect(() => {
        if (inviteInfo) {
            // Parse URL to separate base and hash for editing
            // URL format: .../[slug]/[hash]
            const parts = inviteInfo.inviteUrl.split('/');
            const hash = parts.pop() || '';
            const slug = parts.pop() || '';
            const base = parts.join('/') + '/' + slug + '/';

            setBaseUrl(base);
            setInviteHash(hash);
            setOriginalHash(hash);
        }
    }, [inviteInfo, isOpen]);

    const handleCopy = () => {
        if (!inviteInfo) return;
        const fullUrl = `${baseUrl}${inviteHash}`;
        navigator.clipboard.writeText(fullUrl);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    const handleSaveHash = async () => {
        if (inviteHash === originalHash) return;

        setIsSaving(true);
        try {
            const result = await updateOrgInviteHash(inviteHash);
            if (result.success) {
                setOriginalHash(inviteHash);
                onUpdate(); // Refresh parent data
                // Optional: Show success toast
            } else {
                alert(result.error);
                setInviteHash(originalHash); // Revert on error
            }
        } catch (error) {
            console.error(error);
            alert('Failed to update link');
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = inviteHash !== originalHash;

    // --- Header Actions ---
    const renderHeaderActions = () => (
        <div className="flex items-center gap-3">
            {hasChanges && (
                <button
                    onClick={handleSaveHash}
                    disabled={isSaving}
                    className="
                        flex items-center gap-2 px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wide
                        bg-brand-blue-light text-brand-black hover:bg-white transition-colors shadow-[0_0_20px_rgba(120,192,240,0.3)]
                        disabled:opacity-50 disabled:cursor-not-allowed
                    "
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                    {!isSaving && <Save size={14} />}
                </button>
            )}
            {/* Removed Start Inviting button */}
        </div>
    );

    return (
        <DropdownPanel
            isOpen={isOpen}
            onClose={onClose}
            title="Invite Members"
            icon={UserPlus}
            headerActions={renderHeaderActions()}
        >
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row items-center gap-12 mb-16">
                <div className="flex-1 space-y-6">
                    <h3 className="text-3xl font-light text-white">
                        Bring your team to <span className="font-bold text-brand-blue-light">EnhancedHR</span>
                    </h3>
                    <p className="text-slate-300 leading-relaxed text-lg font-light">
                        Empower your organization with AI-driven learning. Share this unique link with your colleagues to grant them instant access to our library of expert courses and their own personal AI tutor.
                    </p>

                    <div className="flex items-start gap-3 mt-4 text-sm text-slate-400 bg-white/5 p-4 rounded-lg border border-white/5">
                        <Users size={18} className="text-brand-green mt-0.5 shrink-0" />
                        <p>Anyone with this link can join your organization as a member. You can manage roles or revoke access at any time from the <strong>User Management page</strong>.</p>
                    </div>
                </div>

                {/* Vector Illustration */}
                <div className="w-full md:w-1/3 flex justify-center">
                    <div className="relative w-48 h-48 bg-gradient-to-tr from-brand-blue-light/20 to-purple-500/20 rounded-full blur-2xl animate-pulse" />
                    <div className="absolute p-8 bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
                        <div className="p-4 bg-brand-blue-light/10 text-brand-blue-light rounded-full">
                            <LinkIcon size={32} />
                        </div>
                        <div className="h-2 w-24 bg-white/10 rounded-full" />
                        <div className="h-2 w-16 bg-white/10 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Link Editor Section */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-8 space-y-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">
                        Your Organization Invite Link
                    </label>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 flex items-center bg-black/60 border border-white/10 rounded-xl px-4 py-3 focus-within:border-brand-blue-light transition-colors group">
                            <span className="text-slate-500 select-none mr-1 whitespace-nowrap">{baseUrl}</span>
                            <input
                                type="text"
                                value={inviteHash}
                                onChange={(e) => setInviteHash(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                                className="bg-transparent text-white font-medium focus:outline-none flex-1 placeholder-slate-700 min-w-[150px]"
                                placeholder="custom-code"
                            />
                        </div>

                        <button
                            onClick={handleCopy}
                            className="
                                    flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-all
                                    bg-brand-blue-light text-brand-black hover:bg-white hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(120,192,240,0.2)]
                                    min-w-[140px]
                                "
                        >
                            {hasCopied ? <Check size={18} /> : <Copy size={18} />}
                            {hasCopied ? 'Copied!' : 'Copy Link'}
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-3 pl-1">
                        Tip: Customize the end of the URL to make it memorable for your team (e.g., "join-acme-corp").
                    </p>
                </div>
            </div>
        </DropdownPanel>
    );
};

export default InviteMemberPanel;
