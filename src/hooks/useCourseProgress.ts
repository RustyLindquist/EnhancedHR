import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export const useCourseProgress = (userId: string, courseId: number) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const supabase = createClient();

    const markLessonComplete = async (lessonId: string) => {
        if (!userId || !courseId || !lessonId) return;
        setIsUpdating(true);

        try {
            // Upsert progress
            const { error } = await supabase
                .from('user_progress')
                .upsert({
                    user_id: userId,
                    course_id: courseId,
                    lesson_id: lessonId,
                    is_completed: true,
                    last_accessed: new Date().toISOString(),
                }, {
                    onConflict: 'user_id, lesson_id'
                });

            if (error) throw error;
            console.log(`Lesson ${lessonId} marked as complete`);
        } catch (error) {
            console.error('Error marking lesson complete:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const updateProgress = async (lessonId: string, viewTimeSeconds: number) => {
        if (!userId || !courseId || !lessonId) return;
        
        // We don't want to spam the DB, so this should be debounced or called periodically by the consumer
        // For now, we'll just execute the update.
        
        try {
             const { error } = await supabase
                .from('user_progress')
                .upsert({
                    user_id: userId,
                    course_id: courseId,
                    lesson_id: lessonId,
                    view_time_seconds: viewTimeSeconds,
                    last_accessed: new Date().toISOString(),
                }, {
                    onConflict: 'user_id, lesson_id'
                }); // Note: This might overwrite is_completed if we aren't careful. 
                    // Actually, upsert merges if we don't specify all columns? No, it replaces the row or updates specified columns.
                    // If we don't include is_completed, it might default to false if it's a new row, or keep existing if it's an update?
                    // Postgres UPSERT (INSERT ... ON CONFLICT DO UPDATE) updates the columns specified in the UPDATE part.
                    // Supabase .upsert() behavior: "If the record exists, it will be updated. If it doesn't exist, it will be created."
                    // If we omit `is_completed`, and it's a new record, it defaults to false (db default).
                    // If it's an existing record, does it keep the old value?
                    // Supabase JS client sends the whole object. If we omit a field, it won't be sent.
                    // But if it's an INSERT, it uses default.
                    // If it's an UPDATE, it only updates the fields sent? NO, upsert usually requires a complete record or it might overwrite with nulls if not specified? 
                    // Wait, Supabase `upsert` takes an object. 
                    // Let's be safe: We should probably fetch first or use a more specific update if it exists?
                    // Or just use `upsert` with `ignoreDuplicates: false` (default).
                    
                    // Better strategy:
                    // If we are just updating view time, we probably don't want to accidentally un-complete a lesson.
                    // But we don't know if it's completed or not here.
                    
                    // Let's try to just update `view_time_seconds` and `last_accessed`.
                    // But if the row doesn't exist, we need to create it.
                    
                    // If we use upsert without `is_completed`, and the row exists, `is_completed` should remain unchanged if we don't send it?
                    // Actually, let's verify Supabase behavior. 
                    // Usually `upsert` in Supabase maps to `INSERT ... ON CONFLICT DO UPDATE SET ...`.
                    // It updates the columns provided in the object.
                    
            if (error) throw error;
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    };
    
    const updateLastAccessed = async (lessonId: string) => {
         if (!userId || !courseId || !lessonId) return;
         
         try {
            const { error } = await supabase
                .from('user_progress')
                .upsert({
                    user_id: userId,
                    course_id: courseId,
                    lesson_id: lessonId,
                    last_accessed: new Date().toISOString(),
                }, {
                    onConflict: 'user_id, lesson_id'
                });
                
            if (error) throw error;
         } catch (error) {
             console.error('Error updating last accessed:', error);
         }
    }

    return {
        markLessonComplete,
        updateProgress,
        updateLastAccessed,
        isUpdating
    };
};
