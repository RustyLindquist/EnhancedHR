import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOrgContext } from '@/lib/org-context';
import { createOrgCourse } from '@/app/actions/org-courses';

export default async function NewOrgCoursePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const orgContext = await getOrgContext();

    if (!orgContext) {
        redirect('/');
    }

    // Only org admins and platform admins can create courses
    if (!orgContext.isOrgAdmin && !orgContext.isPlatformAdmin) {
        redirect('/org/courses');
    }

    // Create the new course
    const result = await createOrgCourse(orgContext.orgId);

    if (result.error || !result.courseId) {
        // Redirect back with error (could use search params for error message)
        redirect('/org/courses?error=create_failed');
    }

    // Redirect to the builder for the new course
    redirect(`/org/courses/${result.courseId}/builder`);
}
