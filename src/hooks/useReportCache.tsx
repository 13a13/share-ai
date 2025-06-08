
import { useState, useCallback, useRef } from 'react';
import { Report, Property } from '@/types';

interface ReportCacheEntry {
  report: Report;
  property: Property | null;
  timestamp: number;
}

// Global cache with 5-minute TTL
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const reportCache = new Map<string, ReportCacheEntry>();

/**
 * Global report cache to prevent redundant API calls
 */
export const useReportCache = () => {
  const [loading, setLoading] = useState(false);
  const lastFetchRef = useRef<string>('');

  const getCachedReport = useCallback((reportId: string): ReportCacheEntry | null => {
    const cached = reportCache.get(reportId);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
    if (isExpired) {
      reportCache.delete(reportId);
      return null;
    }
    
    return cached;
  }, []);

  const setCachedReport = useCallback((reportId: string, report: Report, property: Property | null) => {
    reportCache.set(reportId, {
      report,
      property,
      timestamp: Date.now()
    });
  }, []);

  const invalidateCache = useCallback((reportId?: string) => {
    if (reportId) {
      reportCache.delete(reportId);
    } else {
      reportCache.clear();
    }
  }, []);

  const updateCachedReport = useCallback((reportId: string, updatedReport: Report) => {
    const cached = reportCache.get(reportId);
    if (cached) {
      cached.report = updatedReport;
      cached.timestamp = Date.now();
    }
  }, []);

  return {
    getCachedReport,
    setCachedReport,
    invalidateCache,
    updateCachedReport,
    loading,
    setLoading
  };
};
