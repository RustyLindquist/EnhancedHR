'use client';

import React, { useState, useEffect, useRef } from 'react';
import MuxUploader from '@mux/mux-uploader-react';
import { Loader2, CheckCircle } from 'lucide-react';
import { getMuxUploadUrl, waitForMuxAssetId, waitForMuxAssetReady, checkMuxAssetStatus } from '@/app/actions/mux';

interface MuxUploaderWrapperProps {
    onUploadStart?: () => void;
    onSuccess?: (playbackId: string, duration?: number) => void;
    onError?: (error: any) => void;
    onLargeFileProcessing?: (uploadId: string, assetId: string, fileSizeMB?: number) => void;
}

function formatElapsed(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export default function MuxUploaderWrapper({ onUploadStart, onSuccess, onError, onLargeFileProcessing }: MuxUploaderWrapperProps) {
    const [uploadUrl, setUploadUrl] = useState<string | null>(null);
    const [uploadId, setUploadId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState<string>('');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [fileSizeMB, setFileSizeMB] = useState<number | undefined>(undefined);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const uploaderRef = useRef<HTMLDivElement>(null);

    // Elapsed time counter during processing
    useEffect(() => {
        if (isProcessing) {
            setElapsedSeconds(0);
            timerRef.current = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isProcessing]);

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

    // Capture file size from the native file input change event
    useEffect(() => {
        if (!uploaderRef.current) return;
        const el = uploaderRef.current;
        const handleFileSelected = (e: Event) => {
            const input = (e.target as HTMLInputElement);
            if (input?.files?.[0]) {
                setFileSizeMB(Math.round(input.files[0].size / (1024 * 1024)));
            }
        };
        el.addEventListener('change', handleFileSelected, true); // capture phase to intercept file input
        return () => el.removeEventListener('change', handleFileSelected, true);
    }, [uploadUrl]);

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
            // Step 1: Get the asset ID from the upload (fast, seconds)
            const assetId = await waitForMuxAssetId(uploadId);
            if (!assetId) {
                throw new Error('Failed to get asset ID from upload - timed out');
            }
            console.log('Got asset ID:', assetId);

            // Step 2: Single instant check — if already ready (tiny files), complete now
            setProcessingStatus('Checking encoding status...');
            const quickCheck = await checkMuxAssetStatus(assetId);

            if (quickCheck.ready && quickCheck.playbackId) {
                // Already encoded (very small file) — complete immediately
                console.log('Asset already ready, playback ID:', quickCheck.playbackId);
                setIsProcessing(false);
                if (onSuccess) onSuccess(quickCheck.playbackId, quickCheck.duration);
            } else if (onLargeFileProcessing) {
                // Still encoding — delegate to background so user can save and close
                console.log('Asset still encoding, delegating to background');
                setIsProcessing(false);
                onLargeFileProcessing(uploadId, assetId, fileSizeMB);
            } else {
                // No background handler — poll until ready (legacy fallback)
                setProcessingStatus('Encoding video...');
                const longResult = await waitForMuxAssetReady(assetId);
                setIsProcessing(false);
                if (longResult.ready && longResult.playbackId) {
                    if (onSuccess) onSuccess(longResult.playbackId, longResult.duration);
                } else if (longResult.errored) {
                    throw new Error('Video encoding failed. Please try uploading again.');
                } else {
                    throw new Error('Asset processing failed or timed out');
                }
            }
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
                    <p className="text-xs text-slate-500 mt-2">
                        {elapsedSeconds < 30
                            ? 'This may take a few minutes'
                            : elapsedSeconds < 120
                                ? 'Still encoding — longer videos take more time'
                                : 'Your video uploaded successfully and is still encoding. Please don\u2019t close this page.'}
                    </p>
                    {elapsedSeconds >= 10 && (
                        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
                            {elapsedSeconds >= 30 && <CheckCircle size={12} className="text-green-500" />}
                            {elapsedSeconds >= 30 && <span className="text-green-400/70 mr-2">Upload complete</span>}
                            <span>Elapsed: {formatElapsed(elapsedSeconds)}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full" ref={uploaderRef}>
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
