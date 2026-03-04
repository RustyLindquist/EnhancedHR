'use client';

import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

interface VideoProcessingBannerProps {
    fileSizeMB?: number;
    isPolling: boolean;
    lastChecked: Date | null;
    onCheckNow: () => void;
}

function getProcessingEstimate(fileSizeMB?: number): string {
    if (!fileSizeMB) {
        return 'Processing times depend on file size. Large files (1 GB+) can take several hours.';
    }
    if (fileSizeMB < 500) {
        return 'Processing typically completes within a few minutes.';
    }
    if (fileSizeMB < 2000) {
        return 'Files this size typically take 15\u201360 minutes to process.';
    }
    if (fileSizeMB < 5000) {
        return 'Files this size typically take 1\u20133 hours to process.';
    }
    return 'Large files like this can take 3\u20138+ hours to process. This is normal for high-resolution video.';
}

function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
}

export default function VideoProcessingBanner({
    fileSizeMB,
    isPolling,
    lastChecked,
    onCheckNow,
}: VideoProcessingBannerProps) {
    return (
        <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-amber-500/20">
                    <Loader2 size={24} className="text-amber-400 animate-spin" />
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-amber-400 mb-1">Video Processing in Progress</h4>
                    <p className="text-xs text-slate-400 mb-2">
                        Your video was uploaded successfully and is now being processed by the video hosting provider. This is normal and no action is needed on your part.
                    </p>
                    <p className="text-xs text-slate-500 mb-2">
                        {getProcessingEstimate(fileSizeMB)}
                    </p>
                    <p className="text-xs text-slate-500">
                        You can save this lesson and close the editor. The video will appear automatically when processing completes.
                    </p>

                    {/* Polling status */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.06]">
                        <span className="text-xs text-slate-500">
                            {isPolling ? 'Checking status every 30s' : 'Status check paused'}
                            {lastChecked && ` \u00b7 Last checked: ${formatTimeAgo(lastChecked)}`}
                        </span>
                        <button
                            onClick={onCheckNow}
                            className="inline-flex items-center gap-1 text-xs text-brand-blue-light hover:text-white transition-colors"
                        >
                            <RefreshCw size={12} />
                            Check Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
