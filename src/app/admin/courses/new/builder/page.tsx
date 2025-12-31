'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createBlankCourse } from '@/app/actions/course-builder';

export default function NewCourseBuilderPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function createAndRedirect() {
            const result = await createBlankCourse();

            if (result.success && result.courseId) {
                // Redirect to the newly created course's builder
                router.replace(`/admin/courses/${result.courseId}/builder`);
            } else {
                setError(result.error || 'Failed to create course');
            }
        }

        createAndRedirect();
    }, [router]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="text-red-400 mb-4">Error creating course</div>
                <p className="text-slate-400 text-sm mb-6">{error}</p>
                <button
                    onClick={() => router.push('/admin/courses')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                    Back to Courses
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 size={48} className="animate-spin text-brand-blue-light mb-4" />
            <p className="text-slate-400">Creating your course...</p>
        </div>
    );
}
