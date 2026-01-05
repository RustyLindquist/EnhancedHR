'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import AvatarUpload from '../AvatarUpload';

interface AvatarUploadStepProps {
    userId: string;
    currentAvatarUrl?: string | null;
    onNext: () => void;
    onSkip: () => void;
}

export default function AvatarUploadStep({
    userId,
    currentAvatarUrl,
    onNext,
    onSkip,
}: AvatarUploadStepProps) {
    const [hasUploaded, setHasUploaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUploadComplete = (url: string) => {
        setHasUploaded(true);
        setError(null);
        // Dispatch event so NavigationPanel can update avatar immediately
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { url } }));
        }
    };

    const handleUploadError = (errorMessage: string) => {
        setError(errorMessage);
    };

    return (
        <div className="flex flex-col items-center text-center px-8 py-6">
            {/* Header */}
            <div className="mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-blue-light/10 mb-4">
                    <Sparkles size={24} className="text-brand-blue-light" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                    Add Your Photo
                </h2>
                <p className="text-slate-400 text-sm max-w-xs">
                    Help others recognize you by adding a profile photo. You can always change it later.
                </p>
            </div>

            {/* Avatar Upload */}
            <div className="mb-6">
                <AvatarUpload
                    userId={userId}
                    currentAvatarUrl={currentAvatarUrl}
                    size="lg"
                    onUploadComplete={handleUploadComplete}
                    onUploadError={handleUploadError}
                />
                <p className="text-xs text-slate-500 mt-3">
                    Click or drag to upload • Max 5MB
                </p>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-4 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                    onClick={onNext}
                    className={`
                        w-full py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-wider transition-all
                        ${hasUploaded
                            ? 'bg-brand-blue-light text-brand-black hover:bg-white'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }
                    `}
                >
                    {hasUploaded ? 'Continue' : 'Continue Without Photo'}
                </button>

                {!hasUploaded && (
                    <button
                        onClick={onSkip}
                        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        Skip for now
                    </button>
                )}
            </div>
        </div>
    );
}
