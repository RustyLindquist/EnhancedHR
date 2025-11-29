'use client';

import React, { useState } from 'react';
import { UserPlus, Copy, Check } from 'lucide-react';

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
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue-light text-brand-black font-bold uppercase tracking-wider hover:bg-white transition-colors"
        >
            {copied ? <Check size={16} /> : <UserPlus size={16} />}
            {copied ? 'Link Copied!' : 'Invite Member'}
        </button>
    );
}
