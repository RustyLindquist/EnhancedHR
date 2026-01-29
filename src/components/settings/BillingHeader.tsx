'use client';

import { useRouter } from 'next/navigation';
import CanvasHeader from '@/components/CanvasHeader';
import { useBackHandler } from '@/hooks/useBackHandler';

export default function BillingHeader() {
    const router = useRouter();

    // Register browser back button handler to go to settings
    useBackHandler(() => router.push('/settings'));

    return (
        <CanvasHeader
            context="Settings"
            title="Billing & Membership"
            onBack={() => router.push('/settings')}
            backLabel="Back to Settings"
        />
    );
}
