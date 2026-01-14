import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/shadcn/Button';
import { Input } from '@/components/ui/shadcn/Input';
import { Label } from '@/components/ui/shadcn/Label';
import { Filter, X, Search, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
    value: string;
    label: string;
}

interface FilterConfig {
    key: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'dateRange';
    options?: FilterOption[];
    placeholder?: string;
}

interface FiltersProps {
    config: FilterConfig[];
    values: Record<string, any>;
    onChange: (key: string, value: any) => void;
    onClear: () => void;
    onApply?: () => void;
    className?: string;
    collapsible?: boolean;
    defaultExpanded?: boolean;
}

export const Filters: React.FC<FiltersProps> = ({
    config,
    values,
    onChange,
    onClear,
    onApply,
    className,
    collapsible = true,
    defaultExpanded = false,
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const activeFiltersCount = Object.values(values).filter(v => v !== '' && v !== null && v !== undefined).length;

    const renderFilter = (filter: FilterConfig) => {
        switch (filter.type) {
            case 'text':
                return (
                    <div key={filter.key} className="space-y-1.5">
                        <Label htmlFor={filter.key} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{filter.label}</Label>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id={filter.key}
                                value={values[filter.key] || ''}
                                onChange={(e) => onChange(filter.key, e.target.value)}
                                placeholder={filter.placeholder || `Buscar...`}
                                className="pl-9 bg-background/50 border-input/50 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-lg"
                            />
                        </div>
                    </div>
                );

            case 'select':
                return (
                    <div key={filter.key} className="space-y-1.5">
                        <Label htmlFor={filter.key} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{filter.label}</Label>
                        <select
                            id={filter.key}
                            value={values[filter.key] || ''}
                            onChange={(e) => onChange(filter.key, e.target.value)}
                            className="w-full h-10 rounded-lg border border-input/50 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm"
                        >
                            <option value="">Todos</option>
                            {filter.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                );

            case 'date':
                return (
                    <div key={filter.key} className="space-y-1.5">
                        <Label htmlFor={filter.key} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{filter.label}</Label>
                        <div className="relative group">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id={filter.key}
                                type="date"
                                value={values[filter.key] || ''}
                                onChange={(e) => onChange(filter.key, e.target.value)}
                                className="pl-9 bg-background/50 border-input/50 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-lg"
                            />
                        </div>
                    </div>
                );

            case 'dateRange':
                return (
                    <div key={filter.key} className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{filter.label}</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1 group">
                                <Input
                                    type="date"
                                    value={values[`${filter.key}Start`] || ''}
                                    onChange={(e) => onChange(`${filter.key}Start`, e.target.value)}
                                    placeholder="De"
                                    className="bg-background/50 border-input/50 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-lg"
                                />
                            </div>
                            <div className="relative flex-1 group">
                                <Input
                                    type="date"
                                    value={values[`${filter.key}End`] || ''}
                                    onChange={(e) => onChange(`${filter.key}End`, e.target.value)}
                                    placeholder="Até"
                                    className="bg-background/50 border-input/50 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-lg"
                                />
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={cn('bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md', className)}>
            {collapsible ? (
                <>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/10 p-1.5 rounded-md text-primary">
                                <Filter className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-sm">Filtros Avançados</span>
                            {activeFiltersCount > 0 && (
                                <span className="px-2 py-0.5 text-xs font-bold bg-primary text-primary-foreground rounded-full shadow-sm">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </div>
                        {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                    </button>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 pt-0 border-t border-border/50">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
                                        {config.map(renderFilter)}
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dashed border-border/50">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={onClear}
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <X className="w-4 h-4 mr-1.5" />
                                            Limpar Filtros
                                        </Button>
                                        {onApply && (
                                            <Button size="sm" onClick={onApply} className="bg-primary shadow-lg shadow-primary/20">
                                                Aplicar Filtros
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            ) : (
                <div className="p-5">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="bg-primary/10 p-1.5 rounded-md text-primary">
                            <Filter className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-sm">Filtros</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {config.map(renderFilter)}
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="outline" size="sm" onClick={onClear}>
                            <X className="w-4 h-4 mr-1.5" />
                            Limpar
                        </Button>
                        {onApply && (
                            <Button size="sm" onClick={onApply}>
                                Aplicar
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Quick filter chips
interface QuickFilterProps {
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const QuickFilters: React.FC<QuickFilterProps> = ({
    options,
    value,
    onChange,
    className,
}) => {
    return (
        <div className={cn('flex flex-wrap gap-2', className)}>
            <Button
                variant={value === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('')}
                className={cn(
                    "rounded-full transition-all",
                    value === '' ? "shadow-md shadow-primary/20" : "bg-transparent border-dashed text-muted-foreground hover:text-primary hover:border-primary"
                )}
            >
                Todos
            </Button>
            {options.map((option) => (
                <Button
                    key={option.value}
                    variant={value === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onChange(option.value)}
                    className={cn(
                        "rounded-full transition-all",
                        value === option.value ? "shadow-md shadow-primary/20" : "bg-transparent border-dashed text-muted-foreground hover:text-primary hover:border-primary"
                    )}
                >
                    {option.label}
                </Button>
            ))}
        </div>
    );
};

// Search input with debounce
interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    debounceMs?: number;
}

export const SearchInput: React.FC<SearchInputProps> = ({
    value,
    onChange,
    placeholder = 'Buscar...',
    className,
}) => {
    return (
        <div className={cn('relative group', className)}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pl-9 bg-background/50 border-input/50 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-lg"
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
};

// Specific AppointmentFilters Component
interface AppointmentFiltersProps {
    filters: {
        search: string;
        status: string;
        startDate: string;
        endDate: string;
    };
    onFiltersChange: (filters: any) => void;
}

export const AppointmentFilters: React.FC<AppointmentFiltersProps> = ({ filters, onFiltersChange }) => {
    const handleFilterChange = (key: string, value: any) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    const handleClear = () => {
        onFiltersChange({
            search: '',
            status: '',
            startDate: '',
            endDate: '',
        });
    };

    const filterConfig: FilterConfig[] = [
        {
            key: 'search',
            label: 'Buscar',
            type: 'text',
            placeholder: 'Nome do médico...',
        },
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'pending', label: 'Pendente' },
                { value: 'booked', label: 'Agendado' },
                { value: 'completed', label: 'Concluído' },
                { value: 'cancelled', label: 'Cancelado' },
            ],
        },
        {
            key: 'dateRange', // Using virtual key for grouping logic if needed, but here mapping dates manually
            label: 'Período',
            type: 'dateRange',
        }
    ];

    // Adapter for dateRange which expects Start/End keys
    const adapterValues = {
        ...filters,
        dateRangeStart: filters.startDate,
        dateRangeEnd: filters.endDate,
    };

    const adapterChange = (key: string, value: any) => {
        if (key === 'dateRangeStart') handleFilterChange('startDate', value);
        else if (key === 'dateRangeEnd') handleFilterChange('endDate', value);
        else handleFilterChange(key, value);
    };

    return (
        <Filters
            config={filterConfig}
            values={adapterValues}
            onChange={adapterChange}
            onClear={handleClear}
            className="glass-card"
        />
    );
};
