import { createClient } from '@/lib/supabase/client';

export interface CertificateDetails {
    id: string;
    recipientName: string;
    courseTitle: string;
    completionDate: string;
    duration: string;
    courseId: number;
}

export async function issueCertificate(userId: string, courseId: number): Promise<string | null> {
    const supabase = createClient();

    // 1. Check if already exists
    const { data: existing } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

    if (existing) return existing.id;

    // 2. Calculate Credits (Strict Logic)
    // Fetch all progress for this course
    const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('view_time_seconds')
        .eq('user_id', userId)
        .eq('course_id', courseId);

    if (progressError) {
        console.error("Error fetching course progress for credits:", progressError);
        return null;
    }

    const totalSeconds = progressData?.reduce((acc, curr) => acc + (curr.view_time_seconds || 0), 0) || 0;
    const totalMinutes = Math.floor(totalSeconds / 60);

    // SHRM: 60 mins = 1 PDC. Round DOWN to nearest 0.25
    const rawShrm = totalMinutes / 60;
    const shrmCredits = Math.floor(rawShrm * 4) / 4;

    // HRCI: < 45 mins = 0. Else round DOWN to nearest 0.25
    let hrciCredits = 0;
    if (totalMinutes >= 45) {
        const rawHrci = totalMinutes / 60;
        hrciCredits = Math.floor(rawHrci * 4) / 4;
    }

    // 3. Create new certificate
    const { data, error } = await supabase
        .from('certificates')
        .insert({
            user_id: userId,
            course_id: courseId
        })
        .select('id')
        .single();

    if (error) {
        console.error("Error issuing certificate:", error);
        return null;
    }

    // 4. Record in Ledger
    // We record separate entries for SHRM and HRCI if applicable
    const ledgerEntries = [];
    if (shrmCredits > 0) {
        ledgerEntries.push({
            user_id: userId,
            course_id: courseId,
            credit_type: 'SHRM',
            amount_awarded: shrmCredits,
            minutes_recorded: totalMinutes
        });
    }
    if (hrciCredits > 0) {
        ledgerEntries.push({
            user_id: userId,
            course_id: courseId,
            credit_type: 'HRCI_General', // Default to General for now
            amount_awarded: hrciCredits,
            minutes_recorded: totalMinutes
        });
    }

    if (ledgerEntries.length > 0) {
        const { error: ledgerError } = await supabase
            .from('user_credits_ledger')
            .insert(ledgerEntries);

        if (ledgerError) console.error("Error updating credit ledger:", ledgerError);
    }

    return data.id;
}

export async function fetchCertificate(id: string): Promise<CertificateDetails | null> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('certificates')
        .select(`
            id,
            issued_at,
            profiles:user_id (full_name),
            courses:course_id (title, duration, id)
        `)
        .eq('id', id)
        .single();

    if (error || !data) {
        console.error("Error fetching certificate:", error);
        return null;
    }

    const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
    const course = Array.isArray(data.courses) ? data.courses[0] : data.courses;

    return {
        id: data.id,
        recipientName: profile?.full_name || 'Unknown User',
        courseTitle: course?.title || 'Unknown Course',
        completionDate: new Date(data.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        duration: course?.duration || 'N/A',
        courseId: course?.id
    };
}
