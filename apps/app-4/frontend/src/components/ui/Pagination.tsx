import React from 'react';
import { Button } from '@/components/ui/shadcn/Button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    showFirstLast?: boolean;
    maxVisiblePages?: number;
    className?: string;
    // Optional props for compatibility
    totalItems?: number;
    pageSize?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    showFirstLast = true,
    maxVisiblePages = 5,
    className,
}) => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
        const pages: (number | 'ellipsis')[] = [];
        const half = Math.floor(maxVisiblePages / 2);
        
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + maxVisiblePages - 1);
        
        if (end - start + 1 < maxVisiblePages) {
            start = Math.max(1, end - maxVisiblePages + 1);
        }

        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push('ellipsis');
        }

        for (let i = start; i <= end; i++) {
            if (i !== 1 && i !== totalPages) {
                pages.push(i);
            }
        }

        if (end < totalPages) {
            if (end < totalPages - 1) pages.push('ellipsis');
            pages.push(totalPages);
        }

        return pages;
    };

    const visiblePages = getVisiblePages();

    return (
        <nav className={cn('flex items-center justify-center gap-1', className)} aria-label="Paginação">
            {showFirstLast && (
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    aria-label="Primeira página"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </Button>
            )}
            
            <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Página anterior"
            >
                <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1">
                {visiblePages.map((page, index) => (
                    page === 'ellipsis' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                            ...
                        </span>
                    ) : (
                        <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => onPageChange(page)}
                            aria-label={`Página ${page}`}
                            aria-current={currentPage === page ? 'page' : undefined}
                        >
                            {page}
                        </Button>
                    )
                ))}
            </div>

            <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Próxima página"
            >
                <ChevronRight className="w-4 h-4" />
            </Button>

            {showFirstLast && (
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    aria-label="Última página"
                >
                    <ChevronsRight className="w-4 h-4" />
                </Button>
            )}
        </nav>
    );
};

// Compact pagination for mobile
interface CompactPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export const CompactPagination: React.FC<CompactPaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    className,
}) => {
    if (totalPages <= 1) return null;

    return (
        <div className={cn('flex items-center justify-between gap-4', className)}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
            </Button>
            
            <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
            </span>
            
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Próxima
                <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
        </div>
    );
};

// Page size selector
interface PageSizeSelectorProps {
    pageSize: number;
    onPageSizeChange: (size: number) => void;
    options?: number[];
    className?: string;
}

export const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({
    pageSize,
    onPageSizeChange,
    options = [10, 20, 50, 100],
    className,
}) => {
    return (
        <div className={cn('flex items-center gap-2', className)}>
            <span className="text-sm text-muted-foreground">Itens por página:</span>
            <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
                {options.map((size) => (
                    <option key={size} value={size}>
                        {size}
                    </option>
                ))}
            </select>
        </div>
    );
};

// Combined pagination with info
interface PaginationWithInfoProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    className?: string;
}

export const PaginationWithInfo: React.FC<PaginationWithInfoProps> = ({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    className,
}) => {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4', className)}>
            <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                    Mostrando {startItem}-{endItem} de {totalItems} itens
                </span>
                {onPageSizeChange && (
                    <PageSizeSelector pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
                )}
            </div>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
            />
        </div>
    );
};
