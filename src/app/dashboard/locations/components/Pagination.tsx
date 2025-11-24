'use client';

import React from 'react';

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >Prev</button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >Next</button>
      </div>
    </div>
  );
}
