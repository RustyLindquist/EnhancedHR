'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { trackLoginEvent } from '@/app/actions/org-dashboard'

/**
 * Generate a URL-friendly slug from an organization name
 * Example: "Acme Corp" → "acme-corp"
 */
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, '')       // Trim leading/trailing hyphens
        .replace(/-+/g, '-');          // Consolidate multiple hyphens
}

/**
 * Generate a random invite hash (16 characters)
 */
function generateInviteHash(): string {
    return Math.random().toString(36).substring(2, 10) +
           Math.random().toString(36).substring(2, 10);
}

/**
 * Find a unique slug by appending a number if needed
 */
async function findUniqueSlug(supabase: Awaited<ReturnType<typeof createClient>>, baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const { data: existing } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', slug)
            .single();

        if (!existing) {
            return slug;
        }

        counter++;
        slug = `${baseSlug}-${counter}`;

        // Safety limit to prevent infinite loops
        if (counter > 100) {
            // Fall back to timestamp-based uniqueness
            return `${baseSlug}-${Date.now().toString(36)}`;
        }
    }
}

export async function signInWithOAuth(provider: 'google' | 'apple', next?: string) {
    const supabase = await createClient()
    const headersList = await headers()
    const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Include 'next' param in callback URL if provided
    const redirectTo = next && next.startsWith('/')
        ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
        : `${origin}/auth/callback`

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo,
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
    const next = formData.get('next') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    // Track login event for analytics
    const headersList = await headers()
    await trackLoginEvent(headersList.get('user-agent') || undefined)

    revalidatePath('/', 'layout')

    // Redirect to the 'next' URL if provided, otherwise dashboard
    const redirectUrl = next && next.startsWith('/') ? next : '/dashboard'
    redirect(redirectUrl)
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const next = formData.get('next') as string

    const accountType = formData.get('accountType') as string
    const orgName = formData.get('orgName') as string

    // Check if this is an org join flow (skip email verification for org invites)
    // Org join URLs match pattern: /{slug}/{hash} (two path segments, not a known route)
    const isOrgJoinFlow = next && /^\/[^/]+\/[^/]+$/.test(next) &&
        !next.startsWith('/login') && !next.startsWith('/dashboard') &&
        !next.startsWith('/settings') && !next.startsWith('/org')

    if (isOrgJoinFlow) {
        // Use admin client to create user with auto-confirmed email for org join flow
        const { createAdminClient } = await import('@/lib/supabase/server')
        const adminClient = await createAdminClient()

        const { data: adminData, error: adminError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email for org join flow
            user_metadata: {
                full_name: fullName,
                account_type: accountType,
            },
        })

        if (adminError) {
            if (adminError.message.includes('already been registered') || adminError.message.includes('already exists')) {
                return { error: 'An account with this email already exists. Please sign in instead.' }
            }
            return { error: adminError.message }
        }

        // Sign in the newly created user
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (signInError) {
            return { error: 'Account created but sign-in failed. Please try logging in.' }
        }

        // Redirect to org join page
        revalidatePath('/', 'layout')
        redirect(next)
    }

    // Standard signup flow with email verification
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                // Pass metadata to trigger triggers if needed, or update profile manually after
                account_type: accountType,
                // Store org name in metadata so we can create org after email verification
                org_name: accountType === 'org' ? orgName : undefined,
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    // Check if user needs email confirmation (no session means confirmation required)
    // Supabase returns session only if email confirmations are disabled
    if (data?.user && !data?.session) {
        // Email confirmation is required - show verify view
        return { success: true, message: 'Please check your email for a verification code.', view: 'verify', email }
    }

    // If we have both user and session, email confirmations are disabled in Supabase
    // This shouldn't happen in production but handle it gracefully
    if (data?.user && data?.session) {
        // If Org Account, create the Organization and Link User
        if (accountType === 'org' && orgName) {
            // Generate slug and invite hash for the organization
            const baseSlug = generateSlug(orgName);
            const slug = await findUniqueSlug(supabase, baseSlug);
            const inviteHash = generateInviteHash();

            // 1. Create Organization with slug and invite_hash
            const { data: org, error: orgError } = await supabase
                .from('organizations')
                .insert({
                    name: orgName,
                    slug,
                    invite_hash: inviteHash,
                })
                .select()
                .single();

            if (orgError) {
                console.error("Failed to create org:", orgError);
            } else if (org) {
                // 2. Update User Profile with Org ID and Admin Status
                await supabase
                    .from('profiles')
                    .update({
                        org_id: org.id,
                        membership_status: 'org_admin',
                        role: 'admin'
                    })
                    .eq('id', data.user.id);
            }
        }

        // Redirect to dashboard after signup
        revalidatePath('/', 'layout')
        redirect('/dashboard')
    }

    // Fallback: return verify view
    return { success: true, message: 'Please check your email to confirm your account.', view: 'verify', email }
}

export async function verifyEmail(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const token = formData.get('code') as string
    const next = formData.get('next') as string

    const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
    })

    if (error) {
        return { error: error.message }
    }

    // After successful verification, check if this is an org account that needs setup
    if (data?.user) {
        const accountType = data.user.user_metadata?.account_type
        const orgName = data.user.user_metadata?.org_name

        if (accountType === 'org' && orgName) {
            // Generate slug and invite hash for the organization
            const baseSlug = generateSlug(orgName);
            const slug = await findUniqueSlug(supabase, baseSlug);
            const inviteHash = generateInviteHash();

            // Create Organization with slug and invite_hash
            const { data: org, error: orgError } = await supabase
                .from('organizations')
                .insert({
                    name: orgName,
                    slug,
                    invite_hash: inviteHash,
                })
                .select()
                .single();

            if (orgError) {
                console.error("Failed to create org:", orgError);
            } else if (org) {
                // Update User Profile with Org ID and Admin Status
                await supabase
                    .from('profiles')
                    .update({
                        org_id: org.id,
                        membership_status: 'org_admin',
                        role: 'admin'
                    })
                    .eq('id', data.user.id);
            }
        }
    }

    revalidatePath('/', 'layout')

    // Redirect to the 'next' URL if provided, otherwise dashboard
    const redirectUrl = next && next.startsWith('/') ? next : '/dashboard'
    redirect(redirectUrl)
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
