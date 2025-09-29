import { useState, useCallback, useEffect } from 'react';
import api, { PaginatedResponse } from '../services/api';

interface UsePaginationOptions {
  endpoint: string;
  limit?: number;
  enabled?: boolean;
  params?: Record<string, any>;
}

export function usePagination<T>({
  endpoint,
  limit = 20,
  enabled = true,
  params = {}
}: UsePaginationOptions) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metadata, setMetadata] = useState<PaginatedResponse<T>['metadata'] | null>(null);

  const fetchPage = useCallback(async (pageNumber: number, isRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getPaginated<T>(
        endpoint,
        pageNumber,
        limit,
        params
      );

      if (isRefresh) {
        setData(response.data);
      } else {
        setData(prev => [...prev, ...response.data]);
      }

      setMetadata(response.metadata);
      setHasMore(response.metadata.hasNext);
      setPage(pageNumber);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [endpoint, limit, params]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPage(page + 1);
    }
  }, [loading, hasMore, page, fetchPage]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchPage(1, true);
  }, [fetchPage]);

  useEffect(() => {
    if (enabled) {
      fetchPage(1, true);
    }
  }, [endpoint, enabled]);

  return {
    data,
    loading,
    error,
    hasMore,
    refreshing,
    metadata,
    loadMore,
    refresh,
  };
}

export function useInfinitePagination<T>(options: UsePaginationOptions) {
  return usePagination<T>(options);
}