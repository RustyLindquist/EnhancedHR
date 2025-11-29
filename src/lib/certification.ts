import { createClient } from '@/lib/supabase/client';

export type CreditType = 'SHRM' | 'HRCI';

interface CreditCalculation {
    shrm: number;
    hrci: number;
}

/**
 * Calculates SHRM and HRCI credits based on total minutes viewed.
 * Rules:
 * - SHRM: 60 mins = 1 PDC. Round DOWN to nearest 0.25.
 * - HRCI: Threshold 45 mins. If < 45, 0 credits. Else, round DOWN to nearest 0.25 hours.
 */
export function calculateCredits(totalMinutes: number): CreditCalculation {
    // SHRM Calculation
    const shrmRaw = totalMinutes / 60;
    const shrm = Math.floor(shrmRaw * 4) / 4; // Round down to nearest 0.25

    // HRCI Calculation
    let hrci = 0;
    if (totalMinutes >= 45) {
        const hrciRaw = totalMinutes / 60;
        hrci = Math.floor(hrciRaw * 4) / 4; // Round down to nearest 0.25
    }

    return { shrm, hrci };
}

/**
 * Awards credits to a user for a specific course.
 * Uses the Supabase RPC function 'award_course_credits' for safety.
 */
export async function awardCredits(
    userId: string,
    courseId: number,
    creditType: CreditType,
    amount: number
) {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('award_course_credits', {
        p_user_id: userId,
        p_course_id: courseId,
        p_credit_type: creditType,
        p_amount: amount
    });

    if (error) {
        console.error('Error awarding credits:', error);
        throw error;
    }

    return data;
}

/**
 * Checks if a user has already claimed credits for a course.
 */
export async function checkCreditStatus(userId: string, courseId: number) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('user_credits_ledger')
        .select('credit_type, amount, awarded_at')
        .eq('user_id', userId)
        .eq('course_id', courseId);

    if (error) {
        console.error('Error checking credit status:', error);
        return [];
    }

    return data;
}
