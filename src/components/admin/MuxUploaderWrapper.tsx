'use client';

import React, { useState, useEffect } from 'react';
import MuxUploader from '@mux/mux-uploader-react';
import { Loader2 } from 'lucide-react';
import { getMuxUploadUrl, waitForMuxAssetId, waitForMuxAssetReady } from '@/app/actions/mux';

interface MuxUploaderWrapperProps {
    onUploadStart?: () => void;
    onSuccess?: (playbackId: string, duration?: number) => void;
    onError?: (error: any) => void;
}

export default function MuxUploaderWrapper({ onUploadStart, onSuccess, onError }: MuxUploaderWrapperProps) {
    const [uploadUrl, setUploadUrl] = useState<string | null>(null);
    const [uploadId, setUploadId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState<string>('');

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

    const handleUploadSuccess = async () => {
        if (!uploadId) {
            console.error('No upload ID available');
            if (onError) onError(new Error('No upload ID available'));
            return;
        }

        console.log('Upload success, ID:', uploadId);
        setIsProcessing(true);
        setProcessingStatus('Getting asset ID...');

        try {
            // Step 1: Wait for the asset ID from the upload (may take a few seconds)
            const assetId = await waitForMuxAssetId(uploadId);
            if (!assetId) {
                throw new Error('Failed to get asset ID from upload - timed out');
            }
            console.log('Got asset ID:', assetId);

            // Step 2: Wait for the asset to be ready and get the playback ID
            setProcessingStatus('Processing video...');
            const result = await waitForMuxAssetReady(assetId);

            if (!result.ready || !result.playbackId) {
                throw new Error('Asset processing failed or timed out');
            }

            console.log('Asset ready, playback ID:', result.playbackId, 'duration:', result.duration);
            setIsProcessing(false);

            // Return the playback ID and duration
            if (onSuccess) onSuccess(result.playbackId, result.duration);
        } catch (err: any) {
            console.error('Error processing upload:', err);
            setIsProcessing(false);
            if (onError) onError(err);
        }
    };

    if (!uploadUrl) {
        return <div className="text-xs text-slate-500 animate-pulse">Initializing uploader...</div>;
    }

    // Show processing state while waiting for Mux to process the video
    if (isProcessing) {
        return (
            <div className="w-full p-6 rounded-xl bg-brand-blue-light/10 border border-brand-blue-light/30 flex flex-col items-center gap-3">
                <Loader2 size={24} className="text-brand-blue-light animate-spin" />
                <div className="text-center">
                    <p className="text-sm font-medium text-white">Processing video...</p>
                    <p className="text-xs text-slate-400 mt-1">{processingStatus}</p>
                    <p className="text-xs text-slate-500 mt-2">This may take a minute</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <MuxUploader
                endpoint={uploadUrl}
                onUploadStart={onUploadStart}
                onSuccess={handleUploadSuccess}
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
