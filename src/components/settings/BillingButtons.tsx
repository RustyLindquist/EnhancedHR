'use client';

import React, { useState } from 'react';
import { createCheckoutSession, createPortalSession } from '@/app/actions/stripe';
import { PRICING_PLANS } from '@/config/pricing';
import { CreditCard, Settings } from 'lucide-react';

export function UpgradeButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            await createCheckoutSession(PRICING_PLANS.INDIVIDUAL_MONTHLY);
        } catch (error) {
            console.error(error);
            alert('Failed to start checkout.');
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
            await createPortalSession();
        } catch (error) {
            console.error(error);
            alert('Failed to open portal.');
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
