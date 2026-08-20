"use client";

import { useState, useMemo, useEffect } from "react";

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export function usePagination<T>(
  items: T[] = [],
  options: UsePaginationOptions | number = 8
) {
  const initialPageSize = typeof options === "number" ? options : options.initialPageSize || 8;
  const initialPage = typeof options === "number" ? 1 : options.initialPage || 1;

  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  const safeItems = Array.isArray(items) ? items : [];
  const totalItems = safeItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Auto adjust page when item length drops
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedItems = useMemo(() => {
    return safeItems.slice(startIndex, endIndex);
  }, [safeItems, startIndex, endIndex]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const nextPage = () => {
    if (safeCurrentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (safeCurrentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return {
    currentPage: safeCurrentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems,
    setCurrentPage: goToPage,
    setPageSize,
    nextPage,
    prevPage,
    canNext: safeCurrentPage < totalPages,
    canPrev: safeCurrentPage > 1,
    startIndex,
    endIndex,
  };
}
