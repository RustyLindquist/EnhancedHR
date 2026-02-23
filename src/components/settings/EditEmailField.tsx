'use client';

import { useState, useRef, useEffect } from 'react';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { updateEmailAction } from '@/app/actions/profile';

interface EditEmailFieldProps {
    currentEmail: string;
}

export default function EditEmailField({ currentEmail }: EditEmailFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [email, setEmail] = useState(currentEmail);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleChange = () => {
        setEmail(currentEmail);
        setError(null);
        setSuccessMessage(null);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setError(null);
        setEmail(currentEmail);
    };

    const handleSave = async () => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) {
            setError('Email address cannot be empty');
            return;
        }

        setIsLoading(true);
        setError(null);

        const result = await updateEmailAction(trimmed);

        setIsLoading(false);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccessMessage(result.message || 'A confirmation email has been sent to your new email address.');
            setTimeout(() => {
                setIsEditing(false);
                setSuccessMessage(null);
            }, 4000);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (successMessage) {
        return (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                <CheckCircle size={16} className="flex-shrink-0" />
                <span className="text-sm">{successMessage}</span>
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-brand-blue-light/50 transition-colors"
                        placeholder="Enter new email address"
                    />
                </div>
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg bg-white/5 text-slate-400 text-sm font-medium hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg bg-brand-blue-light text-brand-black text-sm font-bold hover:bg-brand-blue-light/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save'
                        )}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 text-white">
            <div className="flex items-center gap-3">
                <Mail size={16} className="text-slate-400" />
                <span>{currentEmail}</span>
            </div>
            <button
                onClick={handleChange}
                className="text-xs font-bold text-brand-blue-light hover:text-white transition-colors"
            >
                CHANGE
            </button>
        </div>
    );
}
