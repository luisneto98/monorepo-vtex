import { useCallback, useEffect } from 'react';
import { useStore } from '../stores/useStore';
import HomeService from '../services/HomeService';

export function useHomeData() {
  const {
    homeData,
    homeLoading,
    homeError,
    isHomeCacheValid,
    setHomeData,
    setHomeLoading,
    setHomeError,
    clearHomeError,
    updateLastHomeFetch,
  } = useStore();

  const fetchHomeData = useCallback(async (force = false) => {
    try {
      // Check if we need to fetch data
      if (!force && homeData && isHomeCacheValid()) {
        return;
      }

      clearHomeError();
      setHomeLoading(true);

      const data = await HomeService.fetchHomeData();
      setHomeData(data);
      updateLastHomeFetch();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setHomeError(errorMessage);
      console.error('Error fetching home data:', error);
    } finally {
      setHomeLoading(false);
    }
  }, [homeData, isHomeCacheValid, clearHomeError, setHomeLoading, setHomeData, updateLastHomeFetch, setHomeError]);

  const refreshHomeData = useCallback(async () => {
    return fetchHomeData(true);
  }, [fetchHomeData]);

  const retryFetch = useCallback(async () => {
    clearHomeError();
    return fetchHomeData(true);
  }, [clearHomeError, fetchHomeData]);

  // Auto-fetch on mount if no data or cache is invalid
  useEffect(() => {
    if (!homeData || !isHomeCacheValid()) {
      fetchHomeData();
    }
  }, [fetchHomeData, homeData, isHomeCacheValid]);

  return {
    homeData,
    homeLoading,
    homeError,
    fetchHomeData,
    refreshHomeData,
    retryFetch,
  };
}