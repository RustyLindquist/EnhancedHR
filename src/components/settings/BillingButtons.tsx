'use client';

import React, { useState } from 'react';
import { PRICING_PLANS } from '@/config/pricing';
import { CreditCard, Settings } from 'lucide-react';

export function UpgradeButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId: PRICING_PLANS.INDIVIDUAL_MONTHLY })
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Checkout failed');
            }

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (error: any) {
            console.error(error);
            alert(`Failed to start checkout: ${error.message}`);
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-brand-orange text-white font-bold uppercase tracking-wider hover:bg-brand-orange/80 transition-colors disabled:opacity-50"
        >
            <CreditCard size={18} />
            {isLoading ? 'Processing...' : 'Upgrade to Pro ($30/mo)'}
        </button>
    );
}

export function ManageSubscriptionButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleManage = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/stripe/portal', {
                method: 'POST'
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Portal failed');
            }

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No portal URL returned');
            }
        } catch (error: any) {
            console.error(error);
            alert(`Failed to open portal: ${error.message}`);
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleManage}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white font-bold uppercase tracking-wider hover:bg-white/20 transition-colors disabled:opacity-50"
        >
            <Settings size={18} />
            {isLoading ? 'Loading...' : 'Manage Subscription'}
        </button>
    );
}

export function OrgSubscriptionButton({ orgId }: { orgId: string }) {
    const [isLoading, setIsLoading] = useState(false)

    const handleOrgCheckout = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/stripe/checkout-org', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId, quantity: 1 }) // Default to 1 seat for now or dynamic
            })

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Checkout failed');
            }

            const data = await response.json()
            if (data.url) {
                window.location.href = data.url
            }
        } catch (error: any) {
            console.error('Error starting org checkout:', error)
            alert(`Failed to start checkout: ${error.message}`);
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={handleOrgCheckout}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
            <CreditCard size={16} />
            {isLoading ? 'Processing...' : 'Upgrade Organization'}
        </button>
    )
}
