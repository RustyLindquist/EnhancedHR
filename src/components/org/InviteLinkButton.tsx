'use client';

import React, { useState } from 'react';
import { UserPlus, Copy, Check, Plus } from 'lucide-react';

export default function InviteLinkButton({ inviteUrl }: { inviteUrl: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-all hover:scale-105"
        >
            {copied ? <Check size={14} /> : <UserPlus size={14} />}
            {copied ? 'Link Copied!' : 'Invite Member'}
        </button>
    );
}
