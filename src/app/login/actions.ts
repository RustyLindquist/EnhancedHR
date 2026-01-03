'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function signInWithOAuth(provider: 'google' | 'apple') {
    const supabase = await createClient()
    const headersList = await headers()
    const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${origin}/auth/callback`,
            queryParams: provider === 'google' ? {
                access_type: 'offline',
                prompt: 'consent',
            } : undefined,
        },
    })

    if (error) {
        return { error: error.message }
    }

    if (data.url) {
        redirect(data.url)
    }

    return { error: 'Failed to initiate OAuth flow' }
}

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    const accountType = formData.get('accountType') as string
    const orgName = formData.get('orgName') as string

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                // Pass metadata to trigger triggers if needed, or update profile manually after
                account_type: accountType,
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    if (data?.user && data?.session) {
        // If Org Account, create the Organization and Link User
        if (accountType === 'org' && orgName) {
            // 1. Create Organization
            const { data: org, error: orgError } = await supabase
                .from('organizations')
                .insert({ name: orgName })
                .select()
                .single();
            
            if (orgError) {
                console.error("Failed to create org:", orgError);
                // Fallback? or Error? For now logging.
            } else if (org) {
                // 2. Update User Profile with Org ID and Admin Status
                await supabase
                    .from('profiles')
                    .update({ 
                        org_id: org.id,
                        membership_status: 'org_admin',
                        role: 'admin' // Explicitly set role if needed by RLS
                    })
                    .eq('id', data.user.id);
            }
        } else {
             // Ensure individual default is correct? Default is usually free/trial from schema defaults.
             // If Pro was selected we need to handle that, but for now we let them in as free/trial 
             // and they can upgrade in dashboard.
        }

        // User is signed in immediately (email confirmation disabled)
        revalidatePath('/', 'layout')
        redirect('/')
    }

    return { success: true, message: 'Please check your email to confirm your account.', view: 'verify', email }
}

export async function verifyEmail(formData: FormData) {
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
    redirect('/dashboard')
}

export async function resendVerification(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true, message: 'Verification code resent.' }
}

export async function resetPassword(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/settings/account`,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true, message: 'Check your email for the password reset link.' }
}

export async function changePassword(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'You must be logged in to change your password.' }
    }

    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!newPassword || newPassword.length < 6) {
        return { error: 'Password must be at least 6 characters.' }
    }

    if (newPassword !== confirmPassword) {
        return { error: 'Passwords do not match.' }
    }

    const { error } = await supabase.auth.updateUser({
        password: newPassword
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true, message: 'Password changed successfully.' }
}
