'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardData } from '@/app/actions/dashboard-data';
import { getDashboardDataAction } from '@/app/actions/dashboard-data';

const CACHE_KEY = 'ehr:dashboard';
const CACHE_TTL = 300_000; // 5 minutes in milliseconds

interface CacheEntry {
  data: DashboardData;
  timestamp: number;
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  invalidate: () => void;
}

function readCache(): CacheEntry | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

function writeCache(data: DashboardData): void {
  try {
    const entry: CacheEntry = { data, timestamp: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage may be unavailable or full — silently ignore
  }
}

function clearCache(): void {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // silently ignore
  }
}

export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track whether the component is still mounted to avoid state updates after unmount
  const mountedRef = useRef(true);

  const fetchFresh = useCallback(async () => {
    try {
      const freshData = await getDashboardDataAction();
      if (!mountedRef.current) return;
      setData(freshData);
      writeCache(freshData);
    } catch {
      // On error, keep whatever data we already have (cached or null)
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  const invalidate = useCallback(() => {
    clearCache();
    setIsRefreshing(true);
    fetchFresh();
  }, [fetchFresh]);

  // Initial mount: check cache and decide fetch strategy
  useEffect(() => {
    mountedRef.current = true;

    const cached = readCache();

    if (cached) {
      const age = Date.now() - cached.timestamp;
      setData(cached.data);
      setIsLoading(false);

      if (age > CACHE_TTL) {
        // Stale cache: show cached data immediately, refresh in background
        setIsRefreshing(true);
        fetchFresh();
      }
      // Fresh cache: no fetch needed
    } else {
      // No cache: fetch fresh (isLoading remains true)
      fetchFresh();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [fetchFresh]);

  // Listen for external invalidation events
  useEffect(() => {
    const handleInvalidate = () => {
      invalidate();
    };

    window.addEventListener('dashboard:invalidate', handleInvalidate);
    return () => {
      window.removeEventListener('dashboard:invalidate', handleInvalidate);
    };
  }, [invalidate]);

  return { data, isLoading, isRefreshing, invalidate };
}
