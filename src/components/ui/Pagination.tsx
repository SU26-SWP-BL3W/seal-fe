"use client";

import React, { CSSProperties } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

type PaginationAccent = "primary" | "team" | "mentor" | "judge" | "coordinator";

const ACCENT_VALUE: Record<PaginationAccent, string> = {
  primary: "var(--accent-primary)",
  team: "var(--accent-team)",
  mentor: "var(--accent-mentor)",
  judge: "var(--accent-judge)",
  coordinator: "var(--accent-coordinator)",
};

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
  accent?: PaginationAccent;
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
  accent = "primary",
}) => {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(1, currentPage || 1), safeTotalPages);

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

  const navBtn =
    "border border-[#263339] bg-[#0a0e10] text-[#8a9ba8] hover:border-[var(--pager-accent)] hover:text-[#e1e7ec] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[#263339] disabled:hover:text-[#8a9ba8] cursor-pointer transition-colors";

  return (
    <div
      style={{ "--pager-accent": ACCENT_VALUE[accent] } as CSSProperties}
      className={`flex flex-col items-center justify-between gap-3 border border-[#263339] bg-[#13191c] p-3 font-mono text-xs text-[#8a9ba8] hud-clipped select-none sm:flex-row ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
          <span>
            Hiển thị <strong className="text-[#e1e7ec]">{totalItems > 0 ? startItem : 0}</strong> -{" "}
            <strong className="text-[#e1e7ec]">{endItem}</strong> trong{" "}
            <strong className="text-[var(--pager-accent)]">{totalItems}</strong> {itemLabel}
          </span>
        ) : (
          <span>
            Trang <strong className="text-[#e1e7ec]">{safeCurrentPage}</strong> /{" "}
            <strong className="text-[var(--pager-accent)]">{safeTotalPages}</strong>
          </span>
        )}

        {onPageSizeChange && pageSize && (
          <div className="flex items-center gap-1.5 border-l border-[#263339] pl-2">
            <span className="text-[11px]">Cỡ trang:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="cursor-pointer border border-[#263339] bg-[#0a0e10] px-2 py-1 text-xs font-bold text-[#e1e7ec] outline-none focus:border-[var(--pager-accent)]"
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

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage <= 1}
          title="Trang đầu"
          className={`rounded p-1.5 ${navBtn}`}
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          title="Trang trước"
          className={`flex items-center gap-1 rounded px-2.5 py-1.5 font-bold ${navBtn}`}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden text-[11px] sm:inline">Trước</span>
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`dots-${idx}`} className="px-2 py-1 text-xs text-[#8a9ba8]">
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
                className={`flex h-7 min-w-[28px] cursor-pointer items-center justify-center rounded px-2 text-xs font-bold transition-all ${
                  isActive
                    ? "scale-105 border border-[var(--pager-accent)] bg-[var(--pager-accent)] text-[var(--bg-base)]"
                    : "border border-[#263339] bg-[#0a0e10] text-[#8a9ba8] hover:border-[var(--pager-accent)] hover:text-[#e1e7ec]"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= safeTotalPages}
          title="Trang kế tiếp"
          className={`flex items-center gap-1 rounded px-2.5 py-1.5 font-bold ${navBtn}`}
        >
          <span className="hidden text-[11px] sm:inline">Sau</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={safeCurrentPage >= safeTotalPages}
          title="Trang cuối"
          className={`rounded p-1.5 ${navBtn}`}
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
