import { headers } from 'next/headers';

/**
 * Get the base URL for the application.
 * Works in server components and server actions by reading request headers.
 * Falls back to NEXT_PUBLIC_BASE_URL env var, then localhost.
 */
export async function getBaseUrl(): Promise<string> {
    // First check environment variable
    if (process.env.NEXT_PUBLIC_BASE_URL) {
        return process.env.NEXT_PUBLIC_BASE_URL;
    }

    // Try to get from request headers (works in server components/actions)
    try {
        const headersList = await headers();
        const host = headersList.get('host');
        const protocol = headersList.get('x-forwarded-proto') || 'https';

        if (host) {
            // Use http for localhost, https for everything else
            const scheme = host.includes('localhost') ? 'http' : protocol;
            return `${scheme}://${host}`;
        }
    } catch {
        // headers() throws outside of request context
    }

    // Final fallback
    return 'http://localhost:3000';
}

/**
 * Get the base URL on the client side.
 * Uses window.location.origin when available.
 */
export function getClientBaseUrl(): string {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    // Fallback for SSR
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}
