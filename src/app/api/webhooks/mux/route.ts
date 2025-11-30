import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, data } = body;

        console.log('Received Mux Webhook:', type);

        if (type === 'video.viewing.session') {
            // 1. Extract Data
            const userId = data.viewer_user_id;
            const videoId = data.video_id; // This is our Lesson ID
            const viewingTimeSeconds = data.viewing_time || 0;
            const viewingTimeMinutes = Math.ceil(viewingTimeSeconds / 60);

            if (!userId) {
                console.warn('No viewer_user_id found in webhook data');
                return NextResponse.json({ message: 'No user ID' }, { status: 200 });
            }

            console.log(`Processing viewing session for User ${userId}: ${viewingTimeMinutes} minutes`);

            // 2. Update Trial Usage (Global)
            // Fetch current usage
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('trial_minutes_used')
                .eq('id', userId)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
            } else {
                const newUsage = (profile.trial_minutes_used || 0) + viewingTimeMinutes;

                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ trial_minutes_used: newUsage })
                    .eq('id', userId);

                if (updateError) console.error('Error updating trial usage:', updateError);
            }

            // 3. Update Course Progress (Instructional Time)
            // We need to find the course_id for this lesson
            if (videoId) {
                const { data: lesson, error: lessonError } = await supabase
                    .from('lessons')
                    .select('module_id, modules(course_id)')
                    .eq('id', videoId)
                    .single();

                if (lesson && lesson.modules) {
                    // @ts-ignore
                    const courseId = lesson.modules.course_id;

                    // Update or Insert User Course Progress
                    // We increment view_time_seconds
                    const { data: progress, error: progressFetchError } = await supabase
                        .from('user_progress')
                        .select('view_time_seconds')
                        .eq('user_id', userId)
                        .eq('lesson_id', videoId)
                        .single();

                    if (progressFetchError && progressFetchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
                        console.error('Error fetching progress:', progressFetchError);
                    }

                    const currentSeconds = progress?.view_time_seconds || 0;
                    const newSeconds = currentSeconds + viewingTimeSeconds;

                    const { error: progressUpdateError } = await supabase
                        .from('user_progress')
                        .upsert({
                            user_id: userId,
                            lesson_id: videoId,
                            course_id: courseId,
                            view_time_seconds: newSeconds,
                            last_accessed: new Date().toISOString()
                        }, { onConflict: 'user_id, lesson_id' });

                    if (progressUpdateError) {
                        console.error('Error updating course progress:', progressUpdateError);
                    } else {
                        console.log(`Updated instructional time for User ${userId}, Lesson ${videoId}: +${viewingTimeSeconds}s`);
                    }
                }
            }
        }

        return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
    } catch (error) {
        console.error('Error processing Mux webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
