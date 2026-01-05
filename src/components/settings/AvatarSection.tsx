'use client';

import React, { useState } from 'react';
import AvatarUpload from '@/components/onboarding/AvatarUpload';

interface AvatarSectionProps {
    userId: string;
    currentAvatarUrl?: string | null;
}

export default function AvatarSection({ userId, currentAvatarUrl }: AvatarSectionProps) {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleUploadComplete = (url: string) => {
        setSuccess(true);
        setError(null);
        setTimeout(() => setSuccess(false), 3000);
        // Dispatch event so NavigationPanel can update avatar immediately
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { url } }));
        }
    };

    const handleUploadError = (errorMessage: string) => {
        setError(errorMessage);
        setSuccess(false);
    };

    return (
        <div className="flex items-center gap-6 pb-6 border-b border-white/10">
            <AvatarUpload
                userId={userId}
                currentAvatarUrl={currentAvatarUrl}
                size="lg"
                showEditButton={true}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
            />
            <div>
                <h3 className="text-lg font-semibold text-white mb-1">Profile Photo</h3>
                <p className="text-sm text-slate-400">
                    Click to upload a new photo
                </p>
                {error && (
                    <p className="text-sm text-red-400 mt-2">{error}</p>
                )}
                {success && (
                    <p className="text-sm text-emerald-400 mt-2">Photo updated successfully!</p>
                )}
            </div>
        </div>
    );
}
