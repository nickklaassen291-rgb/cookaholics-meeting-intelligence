import { useState, useCallback, useMemo } from "react";

interface UsePaginationOptions {
  initialPageSize?: number;
  initialPage?: number;
}

interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
}

interface UsePaginationResult<T> {
  // Current page data
  currentPageData: T[];
  // Pagination state
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  // Navigation
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  // Status
  hasNextPage: boolean;
  hasPrevPage: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
  // Range info
  startIndex: number;
  endIndex: number;
}

export function usePagination<T>(
  data: T[],
  options: UsePaginationOptions = {}
): UsePaginationResult<T> {
  const { initialPageSize = 10, initialPage = 1 } = options;

  const [state, setState] = useState<PaginationState>({
    page: initialPage,
    pageSize: initialPageSize,
    totalItems: data.length,
  });

  // Calculate derived values
  const totalPages = Math.ceil(data.length / state.pageSize);
  const startIndex = (state.page - 1) * state.pageSize;
  const endIndex = Math.min(startIndex + state.pageSize, data.length);

  // Get current page data
  const currentPageData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  // Navigation functions
  const goToPage = useCallback((page: number) => {
    setState((prev) => ({
      ...prev,
      page: Math.max(1, Math.min(page, Math.ceil(data.length / prev.pageSize))),
    }));
  }, [data.length]);

  const nextPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      page: Math.min(prev.page + 1, Math.ceil(data.length / prev.pageSize)),
    }));
  }, [data.length]);

  const prevPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      page: Math.max(1, prev.page - 1),
    }));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setState((prev) => ({
      ...prev,
      pageSize: size,
      page: 1, // Reset to first page when changing page size
    }));
  }, []);

  return {
    currentPageData,
    page: state.page,
    pageSize: state.pageSize,
    totalPages,
    totalItems: data.length,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    hasNextPage: state.page < totalPages,
    hasPrevPage: state.page > 1,
    isFirstPage: state.page === 1,
    isLastPage: state.page === totalPages,
    startIndex: startIndex + 1, // 1-indexed for display
    endIndex,
  };
}

// Hook for infinite scroll / load more pattern
interface UseInfiniteLoadOptions {
  initialLoadCount?: number;
  loadMoreCount?: number;
}

interface UseInfiniteLoadResult<T> {
  visibleData: T[];
  loadMore: () => void;
  hasMore: boolean;
  loadedCount: number;
  totalCount: number;
  reset: () => void;
}

export function useInfiniteLoad<T>(
  data: T[],
  options: UseInfiniteLoadOptions = {}
): UseInfiniteLoadResult<T> {
  const { initialLoadCount = 20, loadMoreCount = 20 } = options;

  const [loadedCount, setLoadedCount] = useState(initialLoadCount);

  const visibleData = useMemo(() => {
    return data.slice(0, loadedCount);
  }, [data, loadedCount]);

  const loadMore = useCallback(() => {
    setLoadedCount((prev) => Math.min(prev + loadMoreCount, data.length));
  }, [data.length, loadMoreCount]);

  const reset = useCallback(() => {
    setLoadedCount(initialLoadCount);
  }, [initialLoadCount]);

  return {
    visibleData,
    loadMore,
    hasMore: loadedCount < data.length,
    loadedCount,
    totalCount: data.length,
    reset,
  };
}

// Hook for virtualized lists (shows items in viewport only)
interface UseVirtualListOptions {
  itemHeight: number;
  overscan?: number;
}

interface UseVirtualListResult {
  virtualItems: Array<{ index: number; start: number }>;
  totalHeight: number;
  startIndex: number;
  endIndex: number;
}

export function useVirtualList(
  totalItems: number,
  containerHeight: number,
  scrollTop: number,
  options: UseVirtualListOptions
): UseVirtualListResult {
  const { itemHeight, overscan = 3 } = options;

  const totalHeight = totalItems * itemHeight;

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + overscan * 2);

  // Generate virtual items
  const virtualItems = useMemo(() => {
    const items: Array<{ index: number; start: number }> = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
      });
    }
    return items;
  }, [startIndex, endIndex, itemHeight]);

  return {
    virtualItems,
    totalHeight,
    startIndex,
    endIndex,
  };
}
