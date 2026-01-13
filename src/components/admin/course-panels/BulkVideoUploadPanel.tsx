'use client';

import React, { useState, useCallback } from 'react';
import { Upload, Search, Loader2, CheckCircle, XCircle, Video, AlertCircle } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { scanDriveFolderForVideos, processBulkVideo, VideoFile, BulkUploadProgress } from '@/app/actions/bulk-upload';
import { createModule } from '@/app/actions/course-builder';
import { Module } from '@/types';

interface BulkVideoUploadPanelProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: number;
    modules: Module[];
    onComplete: () => void;
}

type PanelState = 'input' | 'scanning' | 'preview' | 'processing' | 'complete';

export default function BulkVideoUploadPanel({
    isOpen,
    onClose,
    courseId,
    modules,
    onComplete
}: BulkVideoUploadPanelProps) {
    const [state, setState] = useState<PanelState>('input');
    const [driveUrl, setDriveUrl] = useState('');
    const [videos, setVideos] = useState<VideoFile[]>([]);
    const [progress, setProgress] = useState<BulkUploadProgress[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleScanFolder = useCallback(async () => {
        if (!driveUrl.trim()) {
            setError('Please enter a Google Drive folder URL');
            return;
        }

        setError(null);
        setState('scanning');

        const result = await scanDriveFolderForVideos(driveUrl);

        if (result.success && result.videos) {
            setVideos(result.videos);
            setState('preview');
        } else {
            setError(result.error || 'Failed to scan folder');
            setState('input');
        }
    }, [driveUrl]);

    const handleStartUpload = useCallback(async () => {
        setError(null);
        setState('processing');

        // Initialize progress array
        setProgress(videos.map(v => ({
            videoId: v.id,
            videoName: v.name,
            status: 'pending' as const
        })));

        // Ensure we have a module - create one if needed
        let targetModuleId = modules[0]?.id;

        if (!targetModuleId) {
            const moduleResult = await createModule(courseId, 'Module 1');
            if (moduleResult.success && moduleResult.module?.id) {
                targetModuleId = moduleResult.module.id;
            } else {
                setError('Failed to create module');
                setState('preview');
                return;
            }
        }

        // Process videos sequentially
        for (let i = 0; i < videos.length; i++) {
            // Update status to uploading
            setProgress(prev => prev.map((p, idx) =>
                idx === i ? { ...p, status: 'uploading' as const, step: 'mux' as const } : p
            ));

            const result = await processBulkVideo(courseId, targetModuleId, videos[i]);

            // Update with result
            setProgress(prev => prev.map((p, idx) =>
                idx === i ? result : p
            ));
        }

        setState('complete');
    }, [videos, modules, courseId]);

    const handleComplete = useCallback(() => {
        // Reset state
        setState('input');
        setDriveUrl('');
        setVideos([]);
        setProgress([]);
        setError(null);
        onComplete();
        onClose();
    }, [onComplete, onClose]);

    const handleClose = useCallback(() => {
        // Only allow closing if not processing
        if (state !== 'processing') {
            setState('input');
            setDriveUrl('');
            setVideos([]);
            setProgress([]);
            setError(null);
            onClose();
        }
    }, [state, onClose]);

    // Calculate stats
    const completedCount = progress.filter(p => p.status === 'complete').length;
    const errorCount = progress.filter(p => p.status === 'error').length;

    return (
        <DropdownPanel
            isOpen={isOpen}
            onClose={handleClose}
            title="Bulk Video Upload"
            icon={Upload}
            iconColor="text-brand-orange"
        >
            <div className="max-w-3xl space-y-6">
                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Input State */}
                {state === 'input' && (
                    <>
                        <p className="text-slate-400">
                            Enter a Google Drive folder URL containing video files. All videos will be uploaded to Mux,
                            and lessons will be automatically created with AI-generated transcripts.
                        </p>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Google Drive Folder URL
                            </label>
                            <input
                                type="text"
                                value={driveUrl}
                                onChange={(e) => setDriveUrl(e.target.value)}
                                placeholder="https://drive.google.com/drive/folders/..."
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none focus:border-brand-blue-light/50"
                            />
                        </div>

                        <button
                            onClick={handleScanFolder}
                            className="flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-xl font-bold hover:bg-brand-orange/80 transition-colors"
                        >
                            <Search size={18} />
                            Scan Folder
                        </button>
                    </>
                )}

                {/* Scanning State */}
                {state === 'scanning' && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <Loader2 size={40} className="animate-spin mb-4" />
                        <p>Scanning folder for videos...</p>
                    </div>
                )}

                {/* Preview State */}
                {state === 'preview' && (
                    <>
                        <div className="flex items-center justify-between">
                            <p className="text-slate-400">
                                Found <span className="text-white font-bold">{videos.length}</span> video{videos.length !== 1 ? 's' : ''} in the folder.
                            </p>
                            <button
                                onClick={() => setState('input')}
                                className="text-sm text-slate-500 hover:text-white transition-colors"
                            >
                                Change URL
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto dropdown-scrollbar">
                            {videos.map((video, index) => (
                                <div
                                    key={video.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-brand-blue-light/10 flex items-center justify-center text-brand-blue-light">
                                        <Video size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">{video.name}</p>
                                    </div>
                                    <div className="text-xs text-slate-500">#{index + 1}</div>
                                </div>
                            ))}
                        </div>

                        {modules.length === 0 && (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                                No modules exist yet. A new &quot;Module 1&quot; will be created automatically.
                            </div>
                        )}

                        <button
                            onClick={handleStartUpload}
                            className="flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-xl font-bold hover:bg-brand-orange/80 transition-colors"
                        >
                            <Upload size={18} />
                            Start Upload ({videos.length} video{videos.length !== 1 ? 's' : ''})
                        </button>
                    </>
                )}

                {/* Processing State */}
                {state === 'processing' && (
                    <>
                        <div className="flex items-center gap-3">
                            <Loader2 size={20} className="animate-spin text-brand-orange" />
                            <p className="text-white font-medium">
                                Processing {videos.length} video{videos.length !== 1 ? 's' : ''}...
                            </p>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto dropdown-scrollbar">
                            {progress.map((p) => (
                                <div
                                    key={p.videoId}
                                    className={`p-4 rounded-xl border ${
                                        p.status === 'complete'
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : p.status === 'error'
                                            ? 'bg-red-500/10 border-red-500/30'
                                            : p.status === 'uploading' || p.status === 'processing'
                                            ? 'bg-brand-blue-light/10 border-brand-blue-light/30'
                                            : 'bg-white/5 border-white/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {p.status === 'complete' && (
                                            <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                                        )}
                                        {p.status === 'error' && (
                                            <XCircle size={20} className="text-red-400 flex-shrink-0" />
                                        )}
                                        {(p.status === 'uploading' || p.status === 'processing') && (
                                            <Loader2 size={20} className="animate-spin text-brand-blue-light flex-shrink-0" />
                                        )}
                                        {p.status === 'pending' && (
                                            <div className="w-5 h-5 rounded-full border-2 border-slate-600 flex-shrink-0" />
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white truncate">{p.videoName}</p>
                                            {p.step && p.status !== 'complete' && p.status !== 'error' && (
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {p.step === 'mux' && 'Uploading to Mux...'}
                                                    {p.step === 'lesson' && 'Creating lesson...'}
                                                    {p.step === 'transcript' && 'Generating transcript...'}
                                                    {p.step === 'duration' && 'Setting duration...'}
                                                </p>
                                            )}
                                            {p.error && (
                                                <p className="text-xs text-red-400 mt-1">{p.error}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Complete State */}
                {state === 'complete' && (
                    <>
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} className="text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Upload Complete</h3>
                            <p className="text-slate-400">
                                Successfully processed {completedCount} of {videos.length} video{videos.length !== 1 ? 's' : ''}.
                                {errorCount > 0 && (
                                    <span className="text-red-400"> ({errorCount} failed)</span>
                                )}
                            </p>
                        </div>

                        {errorCount > 0 && (
                            <div className="space-y-2 max-h-[200px] overflow-y-auto dropdown-scrollbar">
                                {progress.filter(p => p.status === 'error').map((p) => (
                                    <div
                                        key={p.videoId}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30"
                                    >
                                        <XCircle size={16} className="text-red-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white truncate">{p.videoName}</p>
                                            <p className="text-xs text-red-400">{p.error}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={handleComplete}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-xl font-bold hover:bg-brand-orange/80 transition-colors"
                        >
                            Done
                        </button>
                    </>
                )}
            </div>
        </DropdownPanel>
    );
}
