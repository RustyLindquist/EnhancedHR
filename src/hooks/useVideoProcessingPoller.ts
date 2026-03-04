'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { recoverProcessingVideo } from '@/app/actions/mux';

interface UseVideoProcessingPollerOptions {
    lessonId: string | undefined;
    assetId: string | null;
    isProcessing: boolean;
    onRecovered: (playbackId: string, duration?: string) => void;
}

interface UseVideoProcessingPollerResult {
    isPolling: boolean;
    lastChecked: Date | null;
    checkNow: () => Promise<void>;
}

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export function useVideoProcessingPoller({
    lessonId,
    assetId,
    isProcessing,
    onRecovered,
}: UseVideoProcessingPollerOptions): UseVideoProcessingPollerResult {
    const [isPolling, setIsPolling] = useState(false);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);
    const onRecoveredRef = useRef(onRecovered);
    const checkingRef = useRef(false);

    // Keep callback ref current without restarting interval
    useEffect(() => {
        onRecoveredRef.current = onRecovered;
    }, [onRecovered]);

    const performCheck = useCallback(async () => {
        if (!lessonId || !assetId || checkingRef.current) return;
        checkingRef.current = true;

        try {
            const result = await recoverProcessingVideo(lessonId, assetId);
            setLastChecked(new Date());

            if (result.recovered && result.playbackId) {
                onRecoveredRef.current(result.playbackId, result.duration);
            }
        } catch (err) {
            console.error('Video processing poll failed:', err);
        } finally {
            checkingRef.current = false;
        }
    }, [lessonId, assetId]);

    // Start/stop polling based on processing state
    useEffect(() => {
        if (!isProcessing || !lessonId || !assetId) {
            setIsPolling(false);
            return;
        }

        setIsPolling(true);

        // Initial check immediately
        performCheck();

        // Poll at interval
        const intervalId = setInterval(performCheck, POLL_INTERVAL_MS);

        return () => {
            clearInterval(intervalId);
            setIsPolling(false);
        };
    }, [isProcessing, lessonId, assetId, performCheck]);

    return { isPolling, lastChecked, checkNow: performCheck };
}
