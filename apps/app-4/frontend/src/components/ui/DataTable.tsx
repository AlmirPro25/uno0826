import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

export interface Column<T> {
    key: string;
    header: string;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
    render?: (item: T, index: number) => React.ReactNode;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
    key: string;
    direction: SortDirection;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyMessage?: string;
    emptyIcon?: React.ReactNode;
    sortConfig?: SortConfig;
    onSort?: (key: string) => void;
    onRowClick?: (item: T, index: number) => void;
    rowKey?: (item: T, index: number) => string | number;
    className?: string;
    striped?: boolean;
    hoverable?: boolean;
    compact?: boolean;
}

export function DataTable<T>({
    columns,
    data,
    loading = false,
    emptyMessage = 'Nenhum dado encontrado',
    emptyIcon,
    sortConfig,
    onSort,
    onRowClick,
    rowKey = (_, index) => index,
    className,
    striped = false,
    hoverable = true,
    compact = false,
}: DataTableProps<T>) {
    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
        }
        if (sortConfig.direction === 'asc') {
            return <ArrowUp className="w-4 h-4 ml-1" />;
        }
        return <ArrowDown className="w-4 h-4 ml-1" />;
    };

    const getCellValue = (item: T, column: Column<T>, index: number) => {
        if (column.render) {
            return column.render(item, index);
        }
        return (item as any)[column.key];
    };

    const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';
    const alignClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };

    if (loading) {
        return (
            <div className={cn('border rounded-lg overflow-hidden', className)}>
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={cn(cellPadding, 'font-medium text-muted-foreground', alignClass[column.align || 'left'])}
                                    style={{ width: column.width }}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(5)].map((_, i) => (
                            <tr key={i} className="border-t">
                                {columns.map((column) => (
                                    <td key={column.key} className={cellPadding}>
                                        <Skeleton className="h-4 w-full" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className={cn('border rounded-lg p-8', className)}>
                <EmptyState
                    title={emptyMessage}
                />
            </div>
        );
    }

    return (
        <div className={cn('border rounded-lg overflow-hidden', className)}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={cn(
                                        cellPadding,
                                        'font-medium text-muted-foreground',
                                        alignClass[column.align || 'left'],
                                        column.sortable && onSort && 'cursor-pointer hover:bg-muted transition-colors'
                                    )}
                                    style={{ width: column.width }}
                                    onClick={() => column.sortable && onSort?.(column.key)}
                                >
                                    <div className={cn('flex items-center', column.align === 'right' && 'justify-end', column.align === 'center' && 'justify-center')}>
                                        {column.header}
                                        {column.sortable && onSort && getSortIcon(column.key)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                            <motion.tr
                                key={rowKey(item, index)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.02 }}
                                className={cn(
                                    'border-t transition-colors',
                                    striped && index % 2 === 1 && 'bg-muted/30',
                                    hoverable && 'hover:bg-muted/50',
                                    onRowClick && 'cursor-pointer'
                                )}
                                onClick={() => onRowClick?.(item, index)}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={cn(cellPadding, alignClass[column.align || 'left'])}
                                    >
                                        {getCellValue(item, column, index)}
                                    </td>
                                ))}
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Actions dropdown for table rows
interface TableActionsProps {
    children: React.ReactNode;
}

export const TableActions: React.FC<TableActionsProps> = ({ children }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
            >
                <MoreHorizontal className="w-4 h-4" />
            </Button>
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-popover border rounded-md shadow-lg py-1">
                        {React.Children.map(children, (child) =>
                            React.isValidElement(child)
                                ? React.cloneElement(child as React.ReactElement<any>, {
                                    onClick: (e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        (child.props as any).onClick?.(e);
                                        setIsOpen(false);
                                    },
                                })
                                : child
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// Action item for TableActions
interface TableActionItemProps {
    onClick?: () => void;
    icon?: React.ReactNode;
    children: React.ReactNode;
    variant?: 'default' | 'destructive';
}

export const TableActionItem: React.FC<TableActionItemProps> = ({
    onClick,
    icon,
    children,
    variant = 'default',
}) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors',
                variant === 'destructive' && 'text-destructive hover:bg-destructive/10'
            )}
        >
            {icon}
            {children}
        </button>
    );
};
