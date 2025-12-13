'use client';

import React, { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RemoveUserButtonProps {
    userId: string;
    userName: string;
    variant?: 'icon' | 'full';
}

const RemoveUserButton: React.FC<RemoveUserButtonProps> = ({ userId, userName, variant = 'icon' }) => {
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
            <div className="w-full relative">
                {variant === 'full' ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 animate-fade-in">
                        <p className="text-sm text-white mb-3 font-medium">
                            Remove <span className="font-bold">{userName}</span>?
                        </p>
                        <p className="text-xs text-red-300 mb-4 leading-relaxed">
                            This action is immediate and will stop billing for this seat.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={isLoading}
                                className="text-xs text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRemove}
                                disabled={isLoading}
                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                            >
                                {isLoading ? '...' : (
                                    <>
                                        <Trash2 size={12} />
                                        Confirm Remove
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="absolute right-0 top-0 z-10 bg-[#0f172a] border border-white/10 rounded-lg p-4 shadow-xl w-64 animate-fade-in">
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
                                className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRemove}
                                disabled={isLoading}
                                className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded text-xs font-medium"
                            >
                                {isLoading ? 'Removing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (variant === 'full') {
        return (
            <button
                onClick={() => setShowConfirm(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-red-500/10 text-slate-300 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20 group"
            >
                <div className="flex items-center space-x-3">
                    <Trash2 size={18} className="group-hover:text-red-500 transition-colors" />
                    <span>Remove User</span>
                </div>
            </button>
        )
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowConfirm(true)}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                title="Remove User"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
};

export default RemoveUserButton;
