'use client';

import React, { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RemoveUserButtonProps {
    userId: string;
    userName: string;
}

const RemoveUserButton: React.FC<RemoveUserButtonProps> = ({ userId, userName }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    const handleRemove = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/org/remove-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });

            if (!res.ok) throw new Error('Failed to remove user');

            router.refresh();
            setShowConfirm(false);
        } catch (error) {
            console.error('Error removing user:', error);
            alert('Failed to remove user. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (showConfirm) {
        return (
            <div className="absolute right-0 top-0 z-10 bg-[#0f172a] border border-white/10 rounded-lg p-4 shadow-xl w-64">
                <p className="text-sm text-white mb-3">
                    Are you sure you want to remove <span className="font-bold">{userName}</span>?
                </p>
                <p className="text-xs text-slate-400 mb-4">
                    This will remove their access and update your billing immediately.
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => setShowConfirm(false)}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleRemove}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold hover:bg-red-500/20"
                    >
                        {isLoading ? 'Removing...' : 'Confirm Remove'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowConfirm(true)}
                className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors group"
                title="Remove User"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
};

export default RemoveUserButton;
