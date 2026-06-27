import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);
      
      if (start === 1) {
        end = 5;
      } else if (end === totalPages) {
        start = totalPages - 4;
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/20 rounded-b-2xl">
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Hiển thị <span className="font-semibold text-slate-700 dark:text-slate-200">{startItem}-{endItem}</span> trong số{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{totalItems}</span> mục
      </div>
      
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {getPageNumbers().map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            className={`h-8 w-8 rounded-lg text-sm p-0 ${
              currentPage === page
                ? 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 hover:bg-slate-900'
                : ''
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
