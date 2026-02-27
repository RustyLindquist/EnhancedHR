'use client';

import React, { useState, useEffect, useRef } from 'react';
import MuxUploader from '@mux/mux-uploader-react';
import { Loader2, CheckCircle } from 'lucide-react';
import { getMuxUploadUrl, waitForMuxAssetId, waitForMuxAssetReady } from '@/app/actions/mux';

interface MuxUploaderWrapperProps {
    onUploadStart?: () => void;
    onSuccess?: (playbackId: string, duration?: number) => void;
    onError?: (error: any) => void;
    onLargeFileProcessing?: (uploadId: string, assetId: string) => void;
}

function formatElapsed(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
}

const LARGE_FILE_THRESHOLD = 500 * 1024 * 1024; // 500MB

export default function MuxUploaderWrapper({ onUploadStart, onSuccess, onError, onLargeFileProcessing }: MuxUploaderWrapperProps) {
    const [uploadUrl, setUploadUrl] = useState<string | null>(null);
    const [uploadId, setUploadId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState<string>('');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const fileSizeRef = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

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

    // Capture file size from mux-uploader's file-ready event
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const uploader = container.querySelector('mux-uploader');
        if (!uploader) return;

        const handleFileReady = (e: Event) => {
            const customEvent = e as CustomEvent;
            const file = customEvent.detail as File;
            if (file && file.size) {
                fileSizeRef.current = file.size;
            }
        };

        uploader.addEventListener('file-ready', handleFileReady);
        return () => uploader.removeEventListener('file-ready', handleFileReady);
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

            // Branch based on file size
            if (fileSizeRef.current >= LARGE_FILE_THRESHOLD && onLargeFileProcessing) {
                // Large file: skip encoding wait, delegate to background processing
                console.log('Large file detected (' + fileSizeRef.current + ' bytes), delegating to background processing');
                setIsProcessing(false);
                onLargeFileProcessing(uploadId, assetId);
                return;
            }

            // Small file: existing synchronous wait
            setProcessingStatus('Encoding video...');
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
        <div ref={containerRef} className="w-full">
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
