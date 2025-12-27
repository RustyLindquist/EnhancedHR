/**
 * Collection Events - Unified event system for collection count refresh
 *
 * Problem Solved:
 * Different components need to trigger collection count refreshes, but they
 * don't all have access to the refresh callback via props. This event system
 * allows ANY component to dispatch a refresh event that the top-level
 * collection state manager listens to.
 *
 * Usage:
 * - To trigger refresh: dispatchCollectionRefresh()
 * - To listen: useCollectionRefreshListener(callback)
 */

// Custom event name
const COLLECTION_REFRESH_EVENT = 'collection:refresh';

/**
 * Dispatch a collection refresh event.
 * Call this after any operation that changes collection item counts.
 */
export function dispatchCollectionRefresh() {
    if (typeof window !== 'undefined') {
        console.log('[CollectionEvents] Dispatching refresh event');
        window.dispatchEvent(new CustomEvent(COLLECTION_REFRESH_EVENT));
    }
}

/**
 * Hook to listen for collection refresh events.
 * Use this in the top-level component that manages collection counts.
 */
export function useCollectionRefreshListener(callback: () => void) {
    if (typeof window === 'undefined') return;

    const handleRefresh = () => {
        console.log('[CollectionEvents] Refresh event received');
        callback();
    };

    // Add event listener
    window.addEventListener(COLLECTION_REFRESH_EVENT, handleRefresh);

    // Return cleanup function
    return () => {
        window.removeEventListener(COLLECTION_REFRESH_EVENT, handleRefresh);
    };
}
