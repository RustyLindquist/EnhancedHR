'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signupExpert(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role: 'pending_author', // Sets the user as a pending expert/instructor
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    if (data?.user && data?.session) {
        // User is signed in immediately (email confirmation disabled in Supabase settings)
        // Redirect to expert application page to complete their profile and course proposal
        revalidatePath('/', 'layout')
        redirect('/expert-application')
    }

    // Email confirmation required - return to show verification view
    return {
        success: true,
        message: 'Please check your email for a verification code.',
        view: 'verify' as const,
        email
    }
}

export async function verifyExpertEmail(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const token = formData.get('code') as string

    const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/expert-application')
}

export async function resendExpertVerification(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true, message: 'Verification code resent. Please check your email.' }
}
