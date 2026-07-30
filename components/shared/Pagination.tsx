import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Show at most 5 page numbers
  const getVisiblePages = () => {
    if (totalPages <= 5) return pages;
    if (currentPage <= 3) return pages.slice(0, 5);
    if (currentPage >= totalPages - 2) return pages.slice(totalPages - 5);
    return pages.slice(currentPage - 3, currentPage + 2);
  };

  const visiblePages = getVisiblePages();

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          'inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm transition-colors',
          currentPage === 1
            ? 'text-outline cursor-not-allowed'
            : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
        )}
        aria-label="Go to previous page"
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>

      {/* First page + ellipsis */}
      {visiblePages[0] > 1 && (
        <>
          <PageButton page={1} currentPage={currentPage} onPageChange={onPageChange} />
          {visiblePages[0] > 2 && (
            <span className="w-9 h-9 flex items-center justify-center text-outline text-sm">…</span>
          )}
        </>
      )}

      {/* Visible pages */}
      {visiblePages.map((page) => (
        <PageButton key={page} page={page} currentPage={currentPage} onPageChange={onPageChange} />
      ))}

      {/* Ellipsis + last page */}
      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="w-9 h-9 flex items-center justify-center text-outline text-sm">…</span>
          )}
          <PageButton page={totalPages} currentPage={currentPage} onPageChange={onPageChange} />
        </>
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          'inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm transition-colors',
          currentPage === totalPages
            ? 'text-outline cursor-not-allowed'
            : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
        )}
        aria-label="Go to next page"
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}

function PageButton({
  page,
  currentPage,
  onPageChange,
}: {
  page: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  const isActive = page === currentPage;
  return (
    <button
      onClick={() => onPageChange(page)}
      aria-label={`Go to page ${page}`}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-white cursor-default'
          : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
      )}
    >
      {page}
    </button>
  );
}
