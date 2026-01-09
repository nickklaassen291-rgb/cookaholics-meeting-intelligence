import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  showFirstLast?: boolean;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  showFirstLast = true,
  className,
}: PaginationProps) {
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    const showPages = 5; // Max pages to show

    if (totalPages <= showPages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, and pages around current
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className={cn("flex items-center justify-center gap-1", className)}
      aria-label="Paginatie"
    >
      {showFirstLast && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={!canGoPrev}
          aria-label="Eerste pagina"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={!canGoPrev}
        aria-label="Vorige pagina"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {showPageNumbers && (
        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNum, idx) =>
            pageNum === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                ...
              </span>
            ) : (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "ghost"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                aria-label={`Pagina ${pageNum}`}
                aria-current={page === pageNum ? "page" : undefined}
                className="min-w-[36px]"
              >
                {pageNum}
              </Button>
            )
          )}
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={!canGoNext}
        aria-label="Volgende pagina"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {showFirstLast && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          aria-label="Laatste pagina"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      )}
    </nav>
  );
}

// Page size selector
interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  options?: number[];
  className?: string;
}

export function PageSizeSelector({
  pageSize,
  onPageSizeChange,
  options = [10, 25, 50, 100],
  className,
}: PageSizeSelectorProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <span className="text-gray-500">Toon</span>
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <span className="text-gray-500">per pagina</span>
    </div>
  );
}

// Pagination info display
interface PaginationInfoProps {
  startIndex: number;
  endIndex: number;
  totalItems: number;
  className?: string;
}

export function PaginationInfo({
  startIndex,
  endIndex,
  totalItems,
  className,
}: PaginationInfoProps) {
  return (
    <span className={cn("text-sm text-gray-500", className)}>
      {startIndex} - {endIndex} van {totalItems} items
    </span>
  );
}

// Load more button for infinite scroll
interface LoadMoreButtonProps {
  onClick: () => void;
  loading?: boolean;
  hasMore: boolean;
  className?: string;
}

export function LoadMoreButton({
  onClick,
  loading = false,
  hasMore,
  className,
}: LoadMoreButtonProps) {
  if (!hasMore) {
    return null;
  }

  return (
    <div className={cn("flex justify-center py-4", className)}>
      <Button
        variant="outline"
        onClick={onClick}
        disabled={loading}
      >
        {loading ? "Laden..." : "Meer laden"}
      </Button>
    </div>
  );
}
