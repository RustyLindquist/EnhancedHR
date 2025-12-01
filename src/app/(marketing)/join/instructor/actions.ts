'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signupInstructor(formData: FormData) {
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
                role: 'pending_author', // Key: Sets the user as a pending instructor
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    if (data?.session) {
        // User is signed in immediately
        revalidatePath('/', 'layout')
        redirect('/dashboard')
    }

    // Email confirmation required
    return { success: true, message: 'Please check your email to confirm your instructor account.' }
}
