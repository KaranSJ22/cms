import { useState, useMemo, useCallback } from 'react';

/**
 * Standard pagination state hook for client or server pagination
 * @param {Object} options
 * @param {number} options.initialPage - default 1
 * @param {number} options.initialPageSize - default 10
 * @param {number} options.initialTotalRows - default 0
 */
export function usePagination({
  initialPage = 1,
  initialPageSize = 10,
  initialTotalRows = 0,
} = {}) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalRows, setTotalRows] = useState(initialTotalRows);
  const [totalPagesOverride, setTotalPagesOverride] = useState(null);

  const totalPages = useMemo(() => {
    if (totalPagesOverride != null) return totalPagesOverride;
    return Math.max(1, Math.ceil(totalRows / (pageSize || 10)));
  }, [totalPagesOverride, totalRows, pageSize]);

  const canNext = page < totalPages;
  const canPrev = page > 1;

  const nextPage = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(p - 1, 1));
  }, []);

  const changePage = useCallback(
    (newPage) => {
      const target = Math.max(1, Math.min(Number(newPage) || 1, totalPages));
      setPage(target);
    },
    [totalPages]
  );

  const changePageSize = useCallback((newSize) => {
    const size = Number(newSize) || 10;
    setPageSize(size);
    setPage(1); // reset to first page whenever page size changes
  }, []);

  const updatePagination = useCallback((meta) => {
    if (!meta) return;
    if (meta.totalRows != null) setTotalRows(Number(meta.totalRows));
    if (meta.totalPages != null) setTotalPagesOverride(Number(meta.totalPages));
    if (meta.currentPage != null) setPage(Number(meta.currentPage));
    if (meta.pageSize != null) setPageSize(Number(meta.pageSize));
  }, []);

  const resetPagination = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    currentPage: page,
    pageSize,
    totalRows,
    totalPages,
    canNext,
    canPrev,
    nextPage,
    prevPage,
    setPage: changePage,
    setPageSize: changePageSize,
    updatePagination,
    resetPagination,
    paginationParams: useMemo(
      () => ({ page, pageSize }),
      [page, pageSize]
    ),
  };
}

export default usePagination;
