import { redirect } from 'next/navigation';

interface EditCoursePageProps {
    params: Promise<{
        id: string;
    }>;
}

// Redirect legacy course editor route to the new visual builder
export default async function EditCoursePage({ params }: EditCoursePageProps) {
    const { id } = await params;
    redirect(`/admin/courses/${id}/builder`);
}
