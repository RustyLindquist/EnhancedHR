'use client';

import React, { useState, useEffect } from 'react';
import MuxUploader from '@mux/mux-uploader-react';
import { getMuxUploadUrl } from '@/app/actions/mux';

interface MuxUploaderWrapperProps {
    onUploadStart?: () => void;
    onSuccess?: (uploadId: string) => void;
    onError?: (error: any) => void;
}

export default function MuxUploaderWrapper({ onUploadStart, onSuccess, onError }: MuxUploaderWrapperProps) {
    const [uploadUrl, setUploadUrl] = useState<string | null>(null);
    const [uploadId, setUploadId] = useState<string | null>(null);

    useEffect(() => {
        const prepareUpload = async () => {
            try {
                const { uploadUrl, uploadId } = await getMuxUploadUrl();
                setUploadUrl(uploadUrl);
                setUploadId(uploadId);
            } catch (err) {
                console.error("Failed to prepare upload", err);
                if (onError) onError(err);
            }
        };
        prepareUpload();
    }, []);

    if (!uploadUrl) {
        return <div className="text-xs text-slate-500 animate-pulse">Initializing uploader...</div>;
    }

    return (
        <div className="w-full">
            <MuxUploader
                endpoint={uploadUrl}
                onUploadStart={onUploadStart}
                onSuccess={() => {
                    console.log('Upload success, ID:', uploadId);
                    if (onSuccess && uploadId) onSuccess(uploadId);
                }}
                onUploadError={onError}
                className="mux-uploader-custom"
            />
            <style jsx global>{`
                mux-uploader {
                    --uploader-font-family: inherit;
                    --uploader-background-color: rgba(255, 255, 255, 0.05);
                    --uploader-border: 1px dashed rgba(255, 255, 255, 0.1);
                    --uploader-border-radius: 0.75rem;
                    --button-background-color: #78C0F0;
                    --button-border-radius: 9999px;
                    --button-color: #000;
                }
            `}</style>
        </div>
    );
}
