'use server';

import { CourseIngestor, IngestionPreview } from '@/lib/course-ingestor';
import { createClient } from '@/lib/supabase/server';
import { createMuxAssetFromUrl } from './mux';
import { revalidatePath } from 'next/cache';

/**
 * Preview the course structure from a Drive URL
 */
export async function previewCourseFromDrive(driveUrl: string): Promise<{ success: boolean; data?: IngestionPreview; error?: string }> {
    try {
        const ingestor = new CourseIngestor();
        const preview = await ingestor.previewCourse(driveUrl);
        return { success: true, data: preview };
    } catch (error: any) {
        console.error('Preview Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sync the course from Drive to DB
 */
export async function syncCourseFromDrive(driveUrl: string, courseId?: number): Promise<{ success: boolean; courseId?: number; error?: string }> {
    const supabase = await createClient();
    const ingestor = new CourseIngestor();

    try {
        // 1. Re-analyze structure (to be safe)
        const preview = await ingestor.previewCourse(driveUrl);
        
        // 2. Create or Update Course
        // If courseId is passed, update it. If not, create new.
        // We also check by Drive Folder ID if existing
        
        // Get Drive Folder ID
        const folderId = preview.modules[0]?.folderId ? '' : 'unknown'; // Note: Ingestor doesn't return root ID yet. 
        // We need to fix Ingestor to return root ID or extract it here.
        // For now, let's extract it from URL again
        const extractedFolderId = (driveUrl.match(/[-\w]{25,}/) || [])[0];

        let targetCourseId = courseId;

        // Check if exists by drive_folder_id
        if (!targetCourseId && extractedFolderId) {
            const { data: existing } = await supabase.from('courses').select('id').eq('drive_folder_id', extractedFolderId).single();
            if (existing) targetCourseId = existing.id;
        }

        const courseData = {
            title: preview.courseTitle, // In real world we might not want to overwrite title if changed by user? For now, we sync.
            // description: preview.description? ... 
            drive_folder_id: extractedFolderId,
            sync_status: 'syncing',
            last_synced_at: new Date().toISOString()
        };

        let resultCourse;
        if (targetCourseId) {
            const { data, error } = await supabase.from('courses').update(courseData).eq('id', targetCourseId).select().single();
            if (error) throw error;
            resultCourse = data;
        } else {
            const { data, error } = await supabase.from('courses').insert({
                ...courseData,
                status: 'draft',
                author: 'Imported Author', // Placeholder
            }).select().single();
            if (error) throw error;
            resultCourse = data;
        }

        targetCourseId = resultCourse.id;

        // 3. Process Modules & Lessons
        for (const mod of preview.modules) {
             // Upsert Module
             const { data: savedModule, error: modError } = await supabase.from('modules').upsert({
                 course_id: targetCourseId,
                 title: mod.title,
                 order: mod.order
             }, { onConflict: 'course_id, order' as any }).select().single(); // Note: Schema might not have unique constraint on course_id, order. Using ID would be better but we don't track Drive ID for module yet.
             // Fallback: Query by title? Or just insert?
             // Ideally we should add `drive_folder_id` to modules too, but for now let's query by title/order
             
             // BETTER STRATEGY: Select module by title/order first
             let moduleId;
             const { data: existingModule } = await supabase.from('modules').select('id').eq('course_id', targetCourseId).eq('order', mod.order).single();
             if (existingModule) {
                 await supabase.from('modules').update({ title: mod.title }).eq('id', existingModule.id);
                 moduleId = existingModule.id;
             } else {
                 const { data: newModule } = await supabase.from('modules').insert({
                     course_id: targetCourseId,
                     title: mod.title,
                     order: mod.order
                 }).select().single();
                 moduleId = newModule.id;
             }

             // Process Lessons
             for (const lesson of mod.lessons) {
                 // Check if video URL is already a Mux ID? No, it's a Drive File
                 // If we have a Drive File, we need to upload to Mux
                 
                 let muxPlaybackId = null;
                 let muxAssetId = null;

                 if (lesson.videoFile) {
                     // Check if lesson exists and has same drive_file_id
                     const { data: existingLesson } = await supabase.from('lessons')
                        .select('id, drive_file_id, mux_asset_id, mux_playback_id, video_url')
                        .eq('module_id', moduleId)
                        .eq('order', lesson.order)
                        .single();

                     if (existingLesson && existingLesson.drive_file_id === lesson.videoFile.id && existingLesson.video_url) {
                        // Skipping Mux upload, already synced
                        muxPlaybackId = existingLesson.mux_playback_id || existingLesson.video_url; // video_url often holds playbackId in our app
                        muxAssetId = existingLesson.mux_asset_id;
                     } else {
                        // New or Changed
                        // 1. Get Download Link (or we can pass webContentLink if public? Drive usually needs Auth header)
                        // Mux "fetch" input needs a public URL. 
                        // Since our files are private/shared with Service Account, we need to Generate a Signed URL? 
                        // OR: Access Token in URL? 
                        
                        // For MVP: We assume the user makes the folder "Anyone with Link" OR we stream it?
                        // Streaming to Mux via Node buffer is harder. 
                        // Mux supports authenticated URLs if credentials are in URL? No.
                        
                        // SOLUTION: Generate a temporary public link? No drive doesn't do that easily without "publishing".
                        // ALTERNATIVE: Use the `webContentLink` and hope Mux can reach it? 
                        // Google Drive `webContentLink` usually requires cookies/auth.
                        
                        // ALTERNATIVE 2: We proxy it. (Too heavy for Vercel/Next functions).
                        
                        // ALTERNATIVE 3: Assuming the Admin shares the folder with "Anyone with the link can view".
                        // This is the most robust "mvp" way without a dedicated heavy server.
                        // Let's assume `webContentLink` works.
                         
                         if (lesson.videoFile.webContentLink) {
                             // Note: webContentLink asks for virus scan confirmation for large files.
                             // Better to use `https://drive.google.com/uc?id=${FILE_ID}&export=download`
                             const downloadUrl = `https://drive.google.com/uc?id=${lesson.videoFile.id}&export=download`;
                             
                             const asset = await createMuxAssetFromUrl(downloadUrl, JSON.stringify({ courseId: targetCourseId, lesson: lesson.title }));
                             muxAssetId = asset.id;
                             muxPlaybackId = asset.playback_ids?.[0]?.id;
                         }
                     }
                 }

                 // Upsert Lesson
                 const lessonData = {
                     module_id: moduleId,
                     title: lesson.title,
                     type: 'video', // hardcoded for now
                     order: lesson.order,
                     drive_file_id: lesson.videoFile?.id,
                     mux_asset_id: muxAssetId,
                     mux_playback_id: muxPlaybackId,
                     video_url: muxPlaybackId, // We use video_url as the playback ID usually
                 };

                 const { data: existingLesson } = await supabase.from('lessons').select('id').eq('module_id', moduleId).eq('order', lesson.order).single();
                 
                 if (existingLesson) {
                     await supabase.from('lessons').update(lessonData).eq('id', existingLesson.id);
                 } else {
                     await supabase.from('lessons').insert(lessonData);
                 }
             }
        }

        // Update status to idle
        await supabase.from('courses').update({ sync_status: 'idle' }).eq('id', targetCourseId);

        revalidatePath('/admin/courses');
        return { success: true, courseId: targetCourseId };

    } catch (error: any) {
        console.error('Sync Error:', error);
        return { success: false, error: error.message };
    }
}
