'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useNavigationSafe } from '@/contexts/NavigationContext';

interface UseBackHandlerOptions {
  /**
   * Whether the back handler is enabled (default: true)
   * Use this for conditional back handling
   */
  enabled?: boolean;
}

/**
 * Hook to register a back handler that will be called when the browser back button is pressed.
 *
 * @example
 * ```typescript
 * // Simple usage - always handle back
 * useBackHandler(() => router.push('/dashboard'));
 *
 * // Conditional usage - only handle when in specific mode
 * useBackHandler(viewMode === 'player' ? goToDescription : onBack, { enabled: viewMode === 'player' });
 *
 * // Or with inline condition
 * useBackHandler(() => {
 *   if (viewMode === 'player') {
 *     goToDescription();
 *   } else {
 *     onBack();
 *   }
 * });
 * ```
 *
 * @param handler - The function to call when back is pressed
 * @param options - Optional configuration
 */
const DEBUG = false;

export function useBackHandler(
  handler: (() => void) | undefined | null,
  options: UseBackHandlerOptions = {}
): void {
  const { enabled = true } = options;
  const navigation = useNavigationSafe();

  // Keep stable references to avoid unnecessary re-registrations
  const handlerRef = useRef(handler);
  const enabledRef = useRef(enabled);
  const hasHandlerRef = useRef(!!handler);

  // Update refs on every render
  handlerRef.current = handler;
  enabledRef.current = enabled;
  hasHandlerRef.current = !!handler;

  // Wrapped handler that calls the current handler ref
  const wrappedHandler = useCallback(() => {
    if (DEBUG) {
      console.log('[useBackHandler] Handler invoked');
    }
    if (handlerRef.current) {
      handlerRef.current();
    }
  }, []);

  // Register once on mount (if conditions are met), unregister on unmount
  // Re-register only when navigation context changes or enabled state changes
  useEffect(() => {
    if (DEBUG) {
      console.log('[useBackHandler] Effect running', {
        hasNavigation: !!navigation,
        hasHandler: hasHandlerRef.current,
        enabled: enabledRef.current
      });
    }

    // Don't register if:
    // - Navigation context is not available (e.g., not wrapped in provider)
    // - Handler is null/undefined
    // - Explicitly disabled
    if (!navigation || !hasHandlerRef.current || !enabledRef.current) {
      if (DEBUG) {
        console.log('[useBackHandler] Skipping registration', {
          reason: !navigation ? 'no navigation context' : !hasHandlerRef.current ? 'no handler' : 'disabled'
        });
      }
      return;
    }

    if (DEBUG) {
      console.log('[useBackHandler] Registering handler');
    }

    // Register the handler and get the unregister function
    const unregister = navigation.registerBackHandler(wrappedHandler);

    // Cleanup on unmount only
    return () => {
      if (DEBUG) {
        console.log('[useBackHandler] Unregistering handler (cleanup)');
      }
      unregister();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, enabled]); // Only re-run when navigation context or enabled state actually changes
}

/**
 * Hook variant that returns the handler for use in other components.
 * Useful when you need to get the current back handler to pass to child components.
 *
 * @returns The current back handler or null if none registered
 */
export function useCurrentBackHandler(): (() => void) | null {
  const navigation = useNavigationSafe();
  return navigation?.getCurrentHandler() ?? null;
}

/**
 * Hook to check if there's an active back handler
 *
 * @returns Whether there's an active back handler
 */
export function useHasBackHandler(): boolean {
  const navigation = useNavigationSafe();
  return navigation?.hasBackHandler() ?? false;
}
