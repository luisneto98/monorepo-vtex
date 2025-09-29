import { useState, useCallback, useEffect } from 'react';
import type {
  PressMaterialFilters,
  PressMaterialPaginationDto,
} from '@shared/types/press-materials';

interface UseMaterialFiltersResult {
  filters: PressMaterialFilters;
  pagination: {
    page: number;
    limit: number;
    sortBy: PressMaterialPaginationDto['sortBy'];
    sortOrder: PressMaterialPaginationDto['sortOrder'];
  };
  setFilter: <K extends keyof PressMaterialFilters>(key: K, value: PressMaterialFilters[K]) => void;
  setFilters: (filters: PressMaterialFilters) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSorting: (
    sortBy: PressMaterialPaginationDto['sortBy'],
    sortOrder: PressMaterialPaginationDto['sortOrder'],
  ) => void;
  getQueryParams: () => PressMaterialPaginationDto;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

const defaultFilters: PressMaterialFilters = {
  type: undefined,
  status: undefined,
  accessLevel: undefined,
  tags: [],
  search: '',
};

const defaultPagination: {
  page: number;
  limit: number;
  sortBy: PressMaterialPaginationDto['sortBy'];
  sortOrder: PressMaterialPaginationDto['sortOrder'];
} = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useMaterialFilters(): UseMaterialFiltersResult {
  const [filters, setFiltersState] = useState<PressMaterialFilters>(defaultFilters);
  const [pagination, setPaginationState] = useState(defaultPagination);

  // Save filters to sessionStorage for persistence
  useEffect(() => {
    const savedFilters = sessionStorage.getItem('press-materials-filters');
    if (savedFilters) {
      try {
        setFiltersState(JSON.parse(savedFilters));
      } catch (error) {
        console.error('Failed to load saved filters:', error);
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('press-materials-filters', JSON.stringify(filters));
  }, [filters]);

  const setFilter = useCallback(
    <K extends keyof PressMaterialFilters>(key: K, value: PressMaterialFilters[K]) => {
      setFiltersState((prev) => ({
        ...prev,
        [key]: value,
      }));
      // Reset to first page when filters change
      setPaginationState((prev) => ({ ...prev, page: 1 }));
    },
    [],
  );

  const setFilters = useCallback((newFilters: PressMaterialFilters) => {
    setFiltersState(newFilters);
    setPaginationState((prev) => ({ ...prev, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setPaginationState((prev) => ({ ...prev, page: 1 }));
    sessionStorage.removeItem('press-materials-filters');
  }, []);

  const setPage = useCallback((page: number) => {
    setPaginationState((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPaginationState((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const setSorting = useCallback(
    (
      sortBy: PressMaterialPaginationDto['sortBy'],
      sortOrder: PressMaterialPaginationDto['sortOrder'],
    ) => {
      setPaginationState((prev) => ({ ...prev, sortBy, sortOrder }));
    },
    [],
  );

  const getQueryParams = useCallback((): PressMaterialPaginationDto => {
    const activeFilters: PressMaterialFilters = {};

    // Only include filters with actual values
    if (filters.type) activeFilters.type = filters.type;
    if (filters.status) activeFilters.status = filters.status;
    if (filters.accessLevel) activeFilters.accessLevel = filters.accessLevel;
    if (filters.search && filters.search.trim()) activeFilters.search = filters.search.trim();
    if (filters.tags && filters.tags.length > 0) activeFilters.tags = filters.tags;

    return {
      ...pagination,
      filters: Object.keys(activeFilters).length > 0 ? activeFilters : undefined,
    };
  }, [filters, pagination]);

  const hasActiveFilters = Boolean(
    filters.type ||
      filters.status ||
      filters.accessLevel ||
      (filters.search && filters.search.trim()) ||
      (filters.tags && filters.tags.length > 0),
  );

  const activeFilterCount = [
    filters.type,
    filters.status,
    filters.accessLevel,
    filters.search && filters.search.trim(),
    filters.tags && filters.tags.length > 0,
  ].filter(Boolean).length;

  return {
    filters,
    pagination,
    setFilter,
    setFilters,
    clearFilters,
    setPage,
    setLimit,
    setSorting,
    getQueryParams,
    hasActiveFilters,
    activeFilterCount,
  };
}
