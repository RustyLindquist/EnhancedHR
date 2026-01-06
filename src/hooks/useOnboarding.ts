'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getProfileForOnboardingAction,
    completeOnboardingAction,
    skipOnboardingAction
} from '@/app/actions/profile';

interface OnboardingProfile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    onboarding_completed_at: string | null;
    onboarding_skipped_at: string | null;
}

interface UseOnboardingReturn {
    showOnboarding: boolean;
    isLoading: boolean;
    profile: OnboardingProfile | null;
    completeOnboarding: () => Promise<void>;
    skipOnboarding: () => Promise<void>;
    dismissOnboarding: () => void;
}

export function useOnboarding(): UseOnboardingReturn {
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<OnboardingProfile | null>(null);

    useEffect(() => {
        async function checkOnboardingStatus() {
            try {
                const { profile: fetchedProfile } = await getProfileForOnboardingAction();

                if (fetchedProfile) {
                    setProfile(fetchedProfile);

                    // Show onboarding if neither completed nor skipped
                    const shouldShow = !fetchedProfile.onboarding_completed_at &&
                        !fetchedProfile.onboarding_skipped_at;

                    setShowOnboarding(shouldShow);
                } else {
                    setShowOnboarding(false);
                }
            } catch (error) {
                console.error('Error checking onboarding status:', error);
                setShowOnboarding(false);
            } finally {
                setIsLoading(false);
            }
        }

        checkOnboardingStatus();
    }, []);

    const completeOnboarding = useCallback(async () => {
        try {
            await completeOnboardingAction();
            setShowOnboarding(false);
        } catch (error) {
            console.error('Error completing onboarding:', error);
        }
    }, []);

    const skipOnboarding = useCallback(async () => {
        try {
            await skipOnboardingAction();
            setShowOnboarding(false);
        } catch (error) {
            console.error('Error skipping onboarding:', error);
        }
    }, []);

    const dismissOnboarding = useCallback(() => {
        // Immediate UI dismiss, calls skipOnboarding in background
        setShowOnboarding(false);
        skipOnboardingAction().catch(console.error);
    }, []);

    return {
        showOnboarding,
        isLoading,
        profile,
        completeOnboarding,
        skipOnboarding,
        dismissOnboarding,
    };
}
