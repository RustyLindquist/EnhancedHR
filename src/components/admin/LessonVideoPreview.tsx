'use client';

import React from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { Video, Loader2 } from 'lucide-react';

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Extract Vimeo video ID
function extractVimeoId(url: string): string | null {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
}

// Detect video type from URL
function detectVideoType(url: string): 'mux' | 'youtube' | 'vimeo' | 'unknown' {
    if (!url) return 'unknown';

    // Check if it's a YouTube URL
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return 'youtube';
    }

    // Check if it's a Vimeo URL
    if (url.includes('vimeo.com')) {
        return 'vimeo';
    }

    // Check if it looks like a Mux playback ID (alphanumeric, no slashes/dots)
    // Mux playback IDs are typically alphanumeric strings without special characters
    if (/^[a-zA-Z0-9]+$/.test(url) && url.length > 10 && url.length < 50) {
        return 'mux';
    }

    // Could also be a full Mux URL
    if (url.includes('stream.mux.com') || url.includes('mux.com')) {
        return 'mux';
    }

    return 'unknown';
}

// Extract Mux playback ID from URL if it's a full URL
function extractMuxPlaybackId(url: string): string | null {
    if (!url) return null;

    // If it's already just a playback ID
    if (/^[a-zA-Z0-9]+$/.test(url) && url.length > 10 && url.length < 50) {
        return url;
    }

    // Extract from Mux URL format: https://stream.mux.com/{playbackId}.m3u8
    const match = url.match(/stream\.mux\.com\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

interface LessonVideoPreviewProps {
    videoUrl: string;
    lessonTitle?: string;
    isProcessing?: boolean;
}

export default function LessonVideoPreview({
    videoUrl,
    lessonTitle = 'Lesson Video',
    isProcessing = false
}: LessonVideoPreviewProps) {
    if (!videoUrl) {
        return null;
    }

    if (isProcessing) {
        return (
            <div className="bg-black/30 border border-white/10 rounded-xl p-8 text-center">
                <Loader2 size={32} className="mx-auto text-purple-400 mb-3 animate-spin" />
                <p className="text-white font-medium">Processing video...</p>
                <p className="text-slate-400 text-sm mt-1">This may take a few minutes</p>
            </div>
        );
    }

    const videoType = detectVideoType(videoUrl);

    // Mux Video
    if (videoType === 'mux') {
        const playbackId = extractMuxPlaybackId(videoUrl);
        if (playbackId) {
            return (
                <div className="bg-black rounded-xl overflow-hidden shadow-lg">
                    <MuxPlayer
                        streamType="on-demand"
                        playbackId={playbackId}
                        metadata={{
                            video_title: lessonTitle,
                        }}
                        primaryColor="#3B82F6"
                        accentColor="#1D4ED8"
                        style={{ width: '100%', aspectRatio: '16/9' }}
                    />
                </div>
            );
        }
    }

    // YouTube Video
    if (videoType === 'youtube') {
        const videoId = extractYouTubeId(videoUrl);
        if (videoId) {
            return (
                <div className="bg-black rounded-xl overflow-hidden shadow-lg">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
                        title={lessonTitle}
                        className="w-full aspect-video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            );
        }
    }

    // Vimeo Video
    if (videoType === 'vimeo') {
        const videoId = extractVimeoId(videoUrl);
        if (videoId) {
            return (
                <div className="bg-black rounded-xl overflow-hidden shadow-lg">
                    <iframe
                        src={`https://player.vimeo.com/video/${videoId}`}
                        title={lessonTitle}
                        className="w-full aspect-video"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            );
        }
    }

    // Unknown video type - show placeholder with link
    return (
        <div className="bg-black/30 border border-white/10 rounded-xl p-6 text-center">
            <Video size={32} className="mx-auto text-slate-500 mb-3" />
            <p className="text-slate-400 text-sm mb-2">Video preview not available</p>
            <p className="text-xs text-slate-500 font-mono break-all">{videoUrl}</p>
        </div>
    );
}
