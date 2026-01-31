'use client';

import React, { createContext, useContext, useRef, useCallback, useEffect, ReactNode } from 'react';

/**
 * NavigationContext - Browser Back Button Interception
 *
 * This context maintains a LIFO stack of back handlers and intercepts the browser's
 * back button (popstate event) to call the top handler instead of default navigation.
 *
 * Key features:
 * - Pushes a dummy history entry to intercept back button
 * - Calls top handler when back is pressed
 * - Re-pushes history entry to continue intercepting
 * - Handles SSR, rapid presses, and direct URL entry
 */

type BackHandler = () => void;

interface NavigationContextType {
  /**
   * Register a back handler that will be called when the browser back button is pressed.
   * Returns an unregister function that should be called on component unmount.
   */
  registerBackHandler: (handler: BackHandler) => () => void;

  /**
   * Check if there's an active back handler registered
   */
  hasBackHandler: () => boolean;

  /**
   * Get the current back handler (used by CanvasHeader)
   */
  getCurrentHandler: () => BackHandler | null;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Unique marker for our history entries
const NAVIGATION_STATE_KEY = 'enhancedhr-nav-intercept';

export function NavigationProvider({ children }: { children: ReactNode }) {
  // LIFO stack of back handlers
  const handlersRef = useRef<BackHandler[]>([]);

  // Track number of history entries we've pushed (to match handler count)
  const historyEntriesRef = useRef(0);

  // Flag to prevent rapid back button presses from causing issues
  const isProcessingBackRef = useRef(false);

  // Track if we've pushed our dummy history entry
  const hasHistoryEntryRef = useRef(false);

  // SSR guard - only run on client
  const isClientRef = useRef(typeof window !== 'undefined');

  // Debug flag - set to true to see navigation logs
  const DEBUG = false;

  /**
   * Push a dummy history entry to intercept the back button
   * Each entry represents a "view" that can be backed out of
   */
  const pushHistoryEntry = useCallback(() => {
    if (!isClientRef.current) return;

    // Push a state entry with a unique ID to track each view
    const entryId = Date.now();
    window.history.pushState({ [NAVIGATION_STATE_KEY]: entryId }, '');
    historyEntriesRef.current++;
    hasHistoryEntryRef.current = true;

    if (DEBUG) {
      console.log('[NavigationContext] Pushed history entry', {
        entryId,
        totalEntries: historyEntriesRef.current,
        handlers: handlersRef.current.length
      });
    }
  }, []);

  /**
   * Register a new back handler
   * Each registration represents entering a new "view" that needs its own history entry
   */
  const registerBackHandler = useCallback((handler: BackHandler): (() => void) => {
    handlersRef.current.push(handler);

    if (DEBUG) {
      console.log('[NavigationContext] Registering handler', {
        handlerCount: handlersRef.current.length
      });
    }

    // Push a history entry for EVERY new handler (each represents a new view)
    // This ensures back button returns to previous view, not previous page
    pushHistoryEntry();

    // Return unregister function
    return () => {
      const index = handlersRef.current.indexOf(handler);
      if (index > -1) {
        handlersRef.current.splice(index, 1);
        if (DEBUG) {
          console.log('[NavigationContext] Unregistered handler', {
            handlerCount: handlersRef.current.length
          });
        }
      }

      // If no more handlers, we can let the history entry be consumed naturally
      // But we don't need to manually go back since user might navigate forward
    };
  }, [pushHistoryEntry]);

  /**
   * Check if there's an active handler
   */
  const hasBackHandler = useCallback((): boolean => {
    return handlersRef.current.length > 0;
  }, []);

  /**
   * Get the current (top) handler
   */
  const getCurrentHandler = useCallback((): BackHandler | null => {
    if (handlersRef.current.length === 0) return null;
    return handlersRef.current[handlersRef.current.length - 1];
  }, []);

  // Log when provider mounts
  useEffect(() => {
    if (DEBUG) {
      console.log('[NavigationContext] Provider mounted');
    }
  }, []);

  /**
   * Handle the popstate event (browser back/forward button)
   */
  useEffect(() => {
    if (!isClientRef.current) return;

    if (DEBUG) {
      console.log('[NavigationContext] Setting up popstate listener');
    }

    const handlePopstate = (event: PopStateEvent) => {
      if (DEBUG) {
        console.log('[NavigationContext] Popstate fired', {
          state: event.state,
          handlers: handlersRef.current.length,
          isProcessing: isProcessingBackRef.current
        });
      }

      // If we're already processing, ignore
      if (isProcessingBackRef.current) return;

      // If we have handlers, intercept the back button
      if (handlersRef.current.length > 0) {
        isProcessingBackRef.current = true;
        hasHistoryEntryRef.current = false;
        historyEntriesRef.current = Math.max(0, historyEntriesRef.current - 1);

        // Get and remove the top handler (LIFO - this handler is "consumed" by back)
        const handler = handlersRef.current.pop();

        if (DEBUG) {
          console.log('[NavigationContext] Executing back handler', {
            remainingHandlers: handlersRef.current.length,
            remainingEntries: historyEntriesRef.current
          });
        }

        // Execute the handler
        if (handler) {
          try {
            handler();
          } catch (error) {
            console.error('Error in back handler:', error);
          }
        }

        // Reset processing flag after a short delay
        setTimeout(() => {
          isProcessingBackRef.current = false;
        }, 50);
      } else {
        if (DEBUG) {
          console.log('[NavigationContext] No handlers - letting browser handle back');
        }
      }
    };

    window.addEventListener('popstate', handlePopstate);

    return () => {
      window.removeEventListener('popstate', handlePopstate);
    };
  }, []);

  // Clear forward history after custom back to prevent confusion
  // This is handled naturally by the history API when we push a new state

  return (
    <NavigationContext.Provider value={{ registerBackHandler, hasBackHandler, getCurrentHandler }}>
      {children}
    </NavigationContext.Provider>
  );
}

/**
 * Hook to access the navigation context
 */
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

/**
 * Optional hook that safely returns null if not within NavigationProvider
 * This is useful for components that may be used outside the provider
 */
export function useNavigationSafe(): NavigationContextType | null {
  const context = useContext(NavigationContext);
  return context ?? null;
}
