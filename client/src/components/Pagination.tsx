import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 7
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages = [];
    const half = Math.floor(maxVisiblePages / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();
  
  return (
    <div className="flex items-center justify-center space-x-2 py-8" data-testid="pagination">
      {/* Previous Button */}
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        variant="outline"
        size="icon"
        className="bg-frost backdrop-blur-md border border-frost-light text-white hover:bg-frost-heavy disabled:opacity-30 disabled:cursor-not-allowed"
        data-testid="pagination-previous"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {/* First Page */}
      {visiblePages[0] > 1 && (
        <>
          <Button
            onClick={() => onPageChange(1)}
            variant="outline"
            className="bg-frost backdrop-blur-md border border-frost-light text-white hover:bg-frost-heavy"
            data-testid="pagination-page-1"
          >
            1
          </Button>
          {visiblePages[0] > 2 && (
            <span className="text-gray-400 px-2">...</span>
          )}
        </>
      )}

      {/* Visible Page Numbers */}
      {visiblePages.map((page) => (
        <Button
          key={page}
          onClick={() => onPageChange(page)}
          variant={page === currentPage ? "default" : "outline"}
          className={`${
            page === currentPage
              ? 'bg-white text-black hover:bg-gray-200'
              : 'bg-frost backdrop-blur-md border border-frost-light text-white hover:bg-frost-heavy'
          }`}
          data-testid={`pagination-page-${page}`}
        >
          {page}
        </Button>
      ))}

      {/* Last Page */}
      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="text-gray-400 px-2">...</span>
          )}
          <Button
            onClick={() => onPageChange(totalPages)}
            variant="outline"
            className="bg-frost backdrop-blur-md border border-frost-light text-white hover:bg-frost-heavy"
            data-testid={`pagination-page-${totalPages}`}
          >
            {totalPages}
          </Button>
        </>
      )}

      {/* Next Button */}
      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        variant="outline"
        size="icon"
        className="bg-frost backdrop-blur-md border border-frost-light text-white hover:bg-frost-heavy disabled:opacity-30 disabled:cursor-not-allowed"
        data-testid="pagination-next"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};