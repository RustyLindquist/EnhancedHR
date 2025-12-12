'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HardDrive, Search, Check, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { previewCourseFromDrive, syncCourseFromDrive } from '@/app/actions/drive';
import { IngestionPreview } from '@/lib/course-ingestor';

export default function GoogleDriveImporter() {
    const router = useRouter();
    const [driveUrl, setDriveUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState<IngestionPreview | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success'>('idle');

    const handlePreview = async () => {
        if (!driveUrl) return;
        setIsLoading(true);
        setError(null);
        setPreview(null);

        try {
            const result = await previewCourseFromDrive(driveUrl);
            if (result.success && result.data) {
                setPreview(result.data);
            } else {
                setError(result.error || 'Failed to preview course');
            }
        } catch (err) {
            setError('An app error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSync = async () => {
        if (!driveUrl) return;
        setSyncStatus('syncing');

        try {
            const result = await syncCourseFromDrive(driveUrl);
            if (result.success) {
                setSyncStatus('success');
                // Redirect after short delay
                setTimeout(() => {
                    router.push(`/admin/courses/${result.courseId}`);
                }, 1500);
            } else {
                setError(result.error || 'Sync failed');
                setSyncStatus('idle');
            }
        } catch (err) {
            setError('An app error occurred during sync');
            setSyncStatus('idle');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Input Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                        <HardDrive size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Import from Google Drive</h2>
                        <p className="text-sm text-slate-400">Paste a Google Drive folder URL to automatically structure your course.</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={driveUrl}
                            onChange={(e) => setDriveUrl(e.target.value)}
                            placeholder="https://drive.google.com/drive/folders/..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-4 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                    <button
                        onClick={handlePreview}
                        disabled={isLoading || !driveUrl || syncStatus === 'syncing'}
                        className="px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                        {isLoading ? 'Scanning...' : 'Preview'}
                    </button>
                </div>

                {error && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                )}
            </div>

            {/* Preview Section */}
            {preview && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 animate-fade-in-up">
                    <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="text-2xl">{preview.courseTitle}</span>
                            </h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                                <span>{preview.modules.length} Modules</span>
                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                <span>{preview.totalVideos} Videos</span>
                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                <span>{preview.totalScripts} Scripts</span>
                            </div>
                        </div>
                        {syncStatus === 'success' ? (
                            <div className="flex items-center gap-2 text-green-400 px-6 py-3 bg-green-500/10 rounded-xl border border-green-500/20">
                                <Check size={20} />
                                <span className="font-bold">Import Successful! Redirecting...</span>
                            </div>
                        ) : (
                            <button
                                onClick={handleSync}
                                disabled={syncStatus === 'syncing'}
                                className="px-8 py-3 rounded-full bg-brand-blue-light text-brand-black hover:bg-white font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(120,192,240,0.3)] hover:scale-105 flex items-center gap-2 disabled:opacity-50"
                            >
                                {syncStatus === 'syncing' ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" /> Ingesting...
                                    </>
                                ) : (
                                    <>
                                        Confirm & Sync <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Structure Visualization */}
                    <div className="space-y-4">
                        {preview.modules.map((mod, i) => (
                            <div key={i} className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                                <div className="px-4 py-3 bg-white/5 flex items-center justify-between">
                                    <h4 className="font-bold text-slate-200 text-sm">
                                        Module {mod.order}: {mod.title}
                                    </h4>
                                    <span className="text-xs text-slate-500">{mod.lessons.length} Lessons</span>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {mod.lessons.map((lesson, j) => (
                                        <div key={j} className="px-4 py-3 flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-500 font-mono w-6 text-right">{lesson.order}.</span>
                                                <span className="text-slate-300">{lesson.title}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {/* Video Status */}
                                                <div className={`flex items-center gap-1.5 text-xs ${lesson.videoFile ? 'text-green-400' : 'text-red-400'}`}>
                                                    <div className={`w-2 h-2 rounded-full ${lesson.videoFile ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                    {lesson.videoFile ? 'Video Found' : 'Missing Video'}
                                                </div>

                                                {/* Script Status */}
                                                <div className={`flex items-center gap-1.5 text-xs ${lesson.scriptFile ? 'text-blue-400' : 'text-slate-600'}`}>
                                                    <div className={`w-2 h-2 rounded-full ${lesson.scriptFile ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                                                    {lesson.scriptFile ? 'Script Found' : 'No Script'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {mod.lessons.length === 0 && (
                                        <div className="px-4 py-3 text-xs text-slate-600 italic">No lessons detected in this module folder.</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Issues / Info at bottom */}
                    {(preview.featuredImage || preview.descriptionFile) && (
                        <div className="mt-6 flex gap-4 text-xs text-slate-400">
                            {preview.featuredImage && (
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                                    <Check size={12} className="text-green-400" /> Cover Image Detected
                                </div>
                            )}
                            {preview.descriptionFile && (
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                                    <Check size={12} className="text-green-400" /> Description Detected
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
