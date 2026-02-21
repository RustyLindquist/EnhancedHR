/**
 * Shared duration parsing and formatting utilities.
 * Single source of truth for duration conversions used across
 * server actions, UI components, and display pages.
 */

/**
 * Format duration in seconds to a human-readable string.
 * Examples: 120 -> "2m", 90 -> "1m 30s", 3730 -> "1h 2m"
 */
export function formatDurationForCourse(seconds: number): string {
    if (seconds < 0 || !isFinite(seconds)) return '0m';

    const totalSeconds = Math.round(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
        if (mins > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${hours}h`;
    }

    if (mins > 0) {
        if (secs > 0 && mins < 10) {
            return `${mins}m ${secs}s`;
        }
        return `${mins}m`;
    }

    if (secs > 0) {
        return `${secs}s`;
    }

    return '0m';
}

/**
 * Parse a human-readable duration string to seconds.
 * Handles: "1h 30m", "45m", "2m 30s", "1h", "30s", "0m", null, undefined
 */
export function parseDurationToSeconds(duration: string | null | undefined): number {
    if (!duration) return 0;

    const hoursMatch = duration.match(/(\d+)\s*h/i);
    const minsMatch = duration.match(/(\d+)\s*m(?!s)/i);
    const secsMatch = duration.match(/(\d+)\s*s/i);

    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const mins = minsMatch ? parseInt(minsMatch[1], 10) : 0;
    const secs = secsMatch ? parseInt(secsMatch[1], 10) : 0;

    return hours * 3600 + mins * 60 + secs;
}
