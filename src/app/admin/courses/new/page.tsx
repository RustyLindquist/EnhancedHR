'use client';

import React, { useState } from 'react';
import CourseEditor from '@/components/admin/CourseEditor';
import GoogleDriveImporter from '@/components/admin/GoogleDriveImporter';
import { HardDrive, Edit, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewCoursePage() {
    const router = useRouter();
    const [mode, setMode] = useState<'select' | 'drive' | 'manual'>('select');

    if (mode === 'select') {
        return (
            <div className="max-w-4xl mx-auto py-20 px-4">
                <button
                    onClick={() => router.back()}
                    className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} /> Back to Courses
                </button>

                <h1 className="text-3xl font-bold text-white mb-2">Create New Course</h1>
                <p className="text-slate-400 mb-12">Choose how you want to start creating your course.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Option 1: Drive */}
                    <button
                        onClick={() => setMode('drive')}
                        className="group relative p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-blue-500/50 transition-all text-left"
                    >
                        <div className="w-14 h-14 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 mb-6 group-hover:scale-110 transition-transform">
                            <HardDrive size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Import from Google Drive</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Automatically generated structure (modules, lessons) and Mux video uploads from a Google Drive folder.
                        </p>
                    </button>

                    {/* Option 2: Manual */}
                    <button
                        onClick={() => setMode('manual')}
                        className="group relative p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-brand-blue-light/50 transition-all text-left"
                    >
                        <div className="w-14 h-14 rounded-xl bg-white/10 text-brand-blue-light flex items-center justify-center border border-white/20 mb-6 group-hover:scale-110 transition-transform">
                            <Edit size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Create Manually</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Build your course from scratch using the course editor. Manually add modules and upload videos one by one.
                        </p>
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'drive') {
        return (
            <div className="py-20 px-4">
                <button
                    onClick={() => setMode('select')}
                    className="mb-8 max-w-4xl mx-auto flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} /> Back
                </button>
                <GoogleDriveImporter />
            </div>
        );
    }

    return <CourseEditor courseId="new" />;
}
