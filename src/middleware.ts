import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error) {
        console.error('[Middleware] Auth error:', error.message)
    } else if (user) {
        // console.log('[Middleware] User authenticated:', user.id)
    } else {
        // console.log('[Middleware] No user found')
    }

    // Protected routes pattern
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                            request.nextUrl.pathname.startsWith('/courses') ||
                            request.nextUrl.pathname.startsWith('/instructors');
    
    // Billing page check
    const isBillingPage = request.nextUrl.pathname.startsWith('/settings');

    if (!user && isProtectedRoute) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect to dashboard if logged in and trying to access login
    if (user && request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Access Control: Check Membership Status
    if (user && isProtectedRoute && !isBillingPage && !request.nextUrl.pathname.startsWith('/api')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('membership_status, trial_minutes_used')
            .eq('id', user.id)
            .single();

        if (profile) {
            const isInactive = profile.membership_status === 'inactive';
            const isTrialExpired = profile.membership_status === 'trial' && (profile.trial_minutes_used || 0) >= 60;

            if (isInactive || isTrialExpired) {
                // Redirect to billing, but include a query param to show a message if needed
                return NextResponse.redirect(new URL('/settings/billing?require_upgrade=true', request.url));
            }
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
