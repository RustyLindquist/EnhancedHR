'use client';

import { useRouter } from 'next/navigation';
import CanvasHeader from '@/components/CanvasHeader';

export default function BillingHeader() {
    const router = useRouter();

    return (
        <CanvasHeader
            context="Settings"
            title="Billing & Membership"
            onBack={() => router.push('/settings')}
            backLabel="Back to Settings"
        />
    );
}
