'use client';

import React from 'react';
import { Video, Calendar, Clock, Loader2 } from 'lucide-react';
import MuxPlayer from '@mux/mux-player-react';
import { UserContextItem } from '@/types';
import GlobalTopPanel from './GlobalTopPanel';

interface VideoViewPanelProps {
    isOpen: boolean;
    onClose: () => void;
    resource: UserContextItem | null;
}

export default function VideoViewPanel({ isOpen, onClose, resource }: VideoViewPanelProps) {
    if (!resource) return null;

    const playbackId = (resource.content as any)?.muxPlaybackId;
    const description = (resource.content as any)?.description;
    const duration = (resource.content as any)?.duration;
    const status = (resource.content as any)?.status;

    const formattedDate = new Date(resource.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const renderTitle = () => (
        <>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Video size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Video</h2>
        </>
    );

    return (
        <GlobalTopPanel
            isOpen={isOpen}
            onClose={onClose}
            title={renderTitle()}
        >
            <div className="max-w-4xl mx-auto space-y-6 pb-32 pt-[30px]">
                {/* Title */}
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {resource.title}
                    </h1>
                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>{formattedDate}</span>
                        </div>
                        {duration && (
                            <div className="flex items-center gap-2">
                                <Clock size={14} />
                                <span>{formatDuration(duration)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Video Player */}
                {playbackId && status === 'ready' ? (
                    <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
                        <MuxPlayer
                            streamType="on-demand"
                            playbackId={playbackId}
                            metadata={{
                                video_id: resource.id,
                                video_title: resource.title,
                            }}
                            primaryColor="#A855F7"
                            accentColor="#7C3AED"
                            style={{ width: '100%', aspectRatio: '16/9' }}
                        />
                    </div>
                ) : status === 'processing' ? (
                    <div className="bg-black/30 border border-white/10 rounded-2xl p-12 text-center">
                        <Loader2 size={48} className="mx-auto text-purple-400 mb-4 animate-spin" />
                        <p className="text-slate-400">Video is processing...</p>
                        <p className="text-slate-500 text-sm mt-2">This may take a few minutes</p>
                    </div>
                ) : status === 'uploading' ? (
                    <div className="bg-black/30 border border-white/10 rounded-2xl p-12 text-center">
                        <Loader2 size={48} className="mx-auto text-blue-400 mb-4 animate-spin" />
                        <p className="text-slate-400">Video is uploading...</p>
                    </div>
                ) : status === 'error' ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-12 text-center">
                        <Video size={48} className="mx-auto text-red-400 mb-4" />
                        <p className="text-red-400">Video processing failed</p>
                        <p className="text-slate-500 text-sm mt-2">Please try uploading again</p>
                    </div>
                ) : (
                    <div className="bg-black/30 border border-white/10 rounded-2xl p-12 text-center">
                        <Video size={48} className="mx-auto text-slate-500 mb-4" />
                        <p className="text-slate-400">Video not available</p>
                    </div>
                )}

                {/* Description */}
                {description && (
                    <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-purple-500 to-violet-500" />
                        <div className="p-6">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Description</h3>
                            <p className="text-slate-300 leading-relaxed">{description}</p>
                        </div>
                    </div>
                )}
            </div>
        </GlobalTopPanel>
    );
}
