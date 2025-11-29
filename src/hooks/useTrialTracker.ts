import { useState, useEffect, useRef } from 'react';
import { getMembershipStatus, incrementTrialUsage, MembershipStatus } from '@/lib/membership';

const TRIAL_LIMIT_MINUTES = 60;
const TRACKING_INTERVAL_MS = 60000; // Check every minute

export function useTrialTracker(isActive: boolean) {
    const [minutesUsed, setMinutesUsed] = useState(0);
    const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>('trial');
    const [isLocked, setIsLocked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initial fetch
    useEffect(() => {
        const fetchStatus = async () => {
            const status = await getMembershipStatus();
            if (status) {
                setMinutesUsed(status.trialMinutesUsed);
                setMembershipStatus(status.membershipStatus);

                // Check lock status immediately
                if (status.membershipStatus === 'trial' && status.trialMinutesUsed >= TRIAL_LIMIT_MINUTES) {
                    setIsLocked(true);
                }
            }
            setIsLoading(false);
        };

        fetchStatus();
    }, []);

    // Tracking logic
    useEffect(() => {
        // Only track if:
        // 1. User is active (watching video, chatting)
        // 2. User is on a trial
        // 3. Not already locked
        if (!isActive || membershipStatus !== 'trial' || isLocked) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        intervalRef.current = setInterval(async () => {
            // Increment local state
            setMinutesUsed(prev => {
                const newVal = prev + 1;
                if (newVal >= TRIAL_LIMIT_MINUTES) {
                    setIsLocked(true);
                }
                return newVal;
            });

            // Sync to DB
            await incrementTrialUsage(1);

        }, TRACKING_INTERVAL_MS);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive, membershipStatus, isLocked]);

    return {
        minutesUsed,
        minutesRemaining: Math.max(0, TRIAL_LIMIT_MINUTES - minutesUsed),
        isLocked,
        membershipStatus,
        isLoading
    };
}
