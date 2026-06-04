"use client";

import React from "react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
}) => {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Catalog pagination" className="flex items-center justify-center gap-6 font-sans py-8 select-none">
      <button
        disabled={currentPage <= 1 || loading}
        onClick={() => onPageChange(currentPage - 1)}
        className="p-2 text-text-primary hover:text-accent disabled:text-text-secondary disabled:cursor-not-allowed transition-colors"
        aria-label="Go to previous page"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <span className="text-xs uppercase tracking-luxury text-text-primary font-medium">
        {currentPage} / {totalPages}
      </span>

      <button
        disabled={currentPage >= totalPages || loading}
        onClick={() => onPageChange(currentPage + 1)}
        className="p-2 text-text-primary hover:text-accent disabled:text-text-secondary disabled:cursor-not-allowed transition-colors"
        aria-label="Go to next page"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
};
