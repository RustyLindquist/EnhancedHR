'use client';

import React, { useState } from 'react';
import { Rocket, Loader2, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { promoteCourseToProduction } from '@/app/actions/course-promotion';

interface Course {
    id: number;
    title: string;
    subtitle?: string;
    status: string;
}

interface CoursePromotionButtonProps {
    course: Course;
    moduleCount?: number;
    lessonCount?: number;
    onSuccess?: (productionCourseId: number) => void;
}

// Only render in development
const isDevelopment = process.env.NODE_ENV === 'development';

export default function CoursePromotionButton({
    course,
    moduleCount = 0,
    lessonCount = 0,
    onSuccess
}: CoursePromotionButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [isPromoting, setIsPromoting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; productionCourseId?: number; error?: string } | null>(null);

    // Don't render anything in production
    if (!isDevelopment) {
        return null;
    }

    const handlePromote = async () => {
        setIsPromoting(true);
        setResult(null);

        try {
            const res = await promoteCourseToProduction(course.id);
            setResult(res);

            if (res.success && res.productionCourseId) {
                onSuccess?.(res.productionCourseId);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setResult({ success: false, error: errorMessage });
        } finally {
            setIsPromoting(false);
        }
    };

    return (
        <>
            {/* Promote Button */}
            <button
                onClick={() => setShowModal(true)}
                className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                title="Promote to Production"
            >
                <Rocket size={16} />
            </button>

            {/* Confirmation Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-xl">
                                    <Rocket className="text-purple-400" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Promote to Production</h2>
                                    <p className="text-sm text-slate-400">This will copy the course to production</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setResult(null);
                                }}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Course Details */}
                        {!result && (
                            <div className="p-4 bg-white/5 rounded-xl space-y-3">
                                <h3 className="font-medium text-white">{course.title}</h3>
                                {course.subtitle && (
                                    <p className="text-sm text-slate-400">{course.subtitle}</p>
                                )}
                                <div className="flex gap-4 text-sm">
                                    <span className="text-slate-500">
                                        {moduleCount} module{moduleCount !== 1 ? 's' : ''}
                                    </span>
                                    <span className="text-slate-500">
                                        {lessonCount} lesson{lessonCount !== 1 ? 's' : ''}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs ${
                                        course.status === 'published'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                        {course.status}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Result */}
                        {result && (
                            <div className={`p-4 rounded-xl ${
                                result.success
                                    ? 'bg-green-500/10 border border-green-500/20'
                                    : 'bg-red-500/10 border border-red-500/20'
                            }`}>
                                <div className="flex items-start gap-3">
                                    {result.success ? (
                                        <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
                                    ) : (
                                        <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                                    )}
                                    <div>
                                        <p className={`font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                                            {result.success ? 'Course Promoted Successfully!' : 'Promotion Failed'}
                                        </p>
                                        {result.success && result.productionCourseId && (
                                            <p className="text-sm text-slate-400 mt-1">
                                                Production Course ID: {result.productionCourseId}
                                            </p>
                                        )}
                                        {result.error && (
                                            <p className="text-sm text-red-300 mt-1">{result.error}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            {!result ? (
                                <>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2 text-slate-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handlePromote}
                                        disabled={isPromoting}
                                        className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isPromoting ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Promoting...
                                            </>
                                        ) : (
                                            <>
                                                <Rocket size={16} />
                                                Promote
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setResult(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
