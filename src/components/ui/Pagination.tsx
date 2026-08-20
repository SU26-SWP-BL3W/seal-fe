"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  compact?: boolean;
  className?: string;
  itemLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 8, 10, 15, 20],
  compact = false,
  className = "",
  itemLabel = "mục",
}) => {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(1, currentPage || 1), safeTotalPages);

  // Generate page numbers with window
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = compact ? 3 : 5;

    if (safeTotalPages <= maxVisible + 2) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(safeTotalPages - 1, safeCurrentPage + 1);

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < safeTotalPages - 1) {
        pages.push("...");
      }

      pages.push(safeTotalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const startItem = totalItems !== undefined && pageSize !== undefined
    ? Math.min((safeCurrentPage - 1) * pageSize + 1, totalItems)
    : undefined;
  const endItem = totalItems !== undefined && pageSize !== undefined
    ? Math.min(safeCurrentPage * pageSize, totalItems)
    : undefined;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[#13191c] border border-[#263339] font-mono text-xs text-[#8a9ba8] hud-clipped select-none ${className}`}
    >
      {/* Left: Summary Info & Page Size */}
      <div className="flex items-center gap-3 flex-wrap">
        {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
          <span>
            Hiển thị <strong className="text-[#e1e7ec]">{totalItems > 0 ? startItem : 0}</strong> -{" "}
            <strong className="text-[#e1e7ec]">{endItem}</strong> trong{" "}
            <strong className="text-[#00d9ff]">{totalItems}</strong> {itemLabel}
          </span>
        ) : (
          <span>
            Trang <strong className="text-[#e1e7ec]">{safeCurrentPage}</strong> /{" "}
            <strong className="text-[#00d9ff]">{safeTotalPages}</strong>
          </span>
        )}

        {onPageSizeChange && pageSize && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-[#263339]">
            <span className="text-[11px]">Cỡ trang:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="bg-[#0a0e10] border border-[#263339] px-2 py-1 text-[#e1e7ec] text-xs font-bold outline-none focus:border-[#8b5cf6] cursor-pointer"
            >
              {pageSizeOptions.map((sz) => (
                <option key={sz} value={sz}>
                  {sz} / trang
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Navigation Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage <= 1}
          title="Trang đầu"
          className="p-1.5 rounded bg-[#0a0e10] border border-[#263339] text-[#8a9ba8] hover:text-[#e1e7ec] hover:border-[#8b5cf6] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#263339] disabled:hover:text-[#8a9ba8] cursor-pointer transition-colors"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          title="Trang trước"
          className="px-2.5 py-1.5 rounded bg-[#0a0e10] border border-[#263339] text-[#8a9ba8] hover:text-[#e1e7ec] hover:border-[#8b5cf6] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#263339] disabled:hover:text-[#8a9ba8] flex items-center gap-1 font-bold cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Trước</span>
        </button>

        {/* Numeric Pages */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`dots-${idx}`} className="px-2 py-1 text-[#8a9ba8] text-xs">
                  ...
                </span>
              );
            }

            const pageNum = Number(p);
            const isActive = pageNum === safeCurrentPage;

            return (
              <button
                key={`page-${pageNum}`}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[28px] h-7 px-2 flex items-center justify-center font-bold text-xs rounded transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#8b5cf6] text-white border border-[#8b5cf6] shadow-[0_0_10px_rgba(139,92,246,0.4)] scale-105"
                    : "bg-[#0a0e10] border border-[#263339] text-[#8a9ba8] hover:text-[#e1e7ec] hover:border-[#8b5cf6]"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= safeTotalPages}
          title="Trang kế tiếp"
          className="px-2.5 py-1.5 rounded bg-[#0a0e10] border border-[#263339] text-[#8a9ba8] hover:text-[#e1e7ec] hover:border-[#8b5cf6] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#263339] disabled:hover:text-[#8a9ba8] flex items-center gap-1 font-bold cursor-pointer transition-colors"
        >
          <span className="hidden sm:inline text-[11px]">Sau</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={safeCurrentPage >= safeTotalPages}
          title="Trang cuối"
          className="p-1.5 rounded bg-[#0a0e10] border border-[#263339] text-[#8a9ba8] hover:text-[#e1e7ec] hover:border-[#8b5cf6] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#263339] disabled:hover:text-[#8a9ba8] cursor-pointer transition-colors"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
