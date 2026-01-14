import React from 'react';
import { Input } from '@/components/ui/shadcn/Input';
import { Label } from '@/components/ui/shadcn/Label';
import { cn } from '@/lib/utils';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

interface FormFieldProps {
    id: string;
    label: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'time' | 'datetime-local' | 'textarea' | 'select';
    value: string | number;
    onChange: (value: string) => void;
    error?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    hint?: string;
    options?: { value: string; label: string }[];
    rows?: number;
    className?: string;
    autoComplete?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
    id,
    label,
    type = 'text',
    value,
    onChange,
    error,
    placeholder,
    required = false,
    disabled = false,
    icon,
    hint,
    options,
    rows = 3,
    className,
    autoComplete,
}) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const inputType = type === 'password' && showPassword ? 'text' : type;

    const renderInput = () => {
        const baseClassName = cn(
            icon ? 'pl-10' : '',
            type === 'password' ? 'pr-10' : '',
            error ? 'border-destructive focus:ring-destructive' : ''
        );

        if (type === 'textarea') {
            return (
                <textarea
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    rows={rows}
                    className={cn(
                        'w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                        icon ? 'pl-10' : '',
                        error ? 'border-destructive focus:ring-destructive' : ''
                    )}
                />
            );
        }

        if (type === 'select') {
            return (
                <select
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                    disabled={disabled}
                    className={cn(
                        'w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                        icon ? 'pl-10' : '',
                        error ? 'border-destructive focus:ring-destructive' : ''
                    )}
                >
                    <option value="">{placeholder || 'Selecione...'}</option>
                    {options?.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            );
        }

        return (
            <Input
                id={id}
                type={inputType}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                autoComplete={autoComplete}
                className={baseClassName}
            />
        );
    };

    return (
        <div className={cn('space-y-2', className)}>
            <Label htmlFor={id} className="flex items-center gap-1">
                {label}
                {required && <span className="text-destructive">*</span>}
            </Label>
            
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {icon}
                    </div>
                )}
                
                {renderInput()}
                
                {type === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
            </div>
            
            {hint && !error && (
                <p className="text-xs text-muted-foreground">{hint}</p>
            )}
            
            {error && (
                <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                </p>
            )}
        </div>
    );
};

// Form group for organizing fields
interface FormGroupProps {
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({
    title,
    description,
    children,
    className,
}) => {
    return (
        <div className={cn('space-y-4', className)}>
            {(title || description) && (
                <div className="space-y-1">
                    {title && <h3 className="font-medium">{title}</h3>}
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
            )}
            <div className="grid gap-4">{children}</div>
        </div>
    );
};

// Form row for horizontal layout
interface FormRowProps {
    children: React.ReactNode;
    columns?: 1 | 2 | 3 | 4;
    className?: string;
}

export const FormRow: React.FC<FormRowProps> = ({
    children,
    columns = 2,
    className,
}) => {
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    };

    return (
        <div className={cn('grid gap-4', gridCols[columns], className)}>
            {children}
        </div>
    );
};

// Checkbox field
interface CheckboxFieldProps {
    id: string;
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    description?: string;
    disabled?: boolean;
    className?: string;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
    id,
    label,
    checked,
    onChange,
    description,
    disabled = false,
    className,
}) => {
    return (
        <div className={cn('flex items-start gap-3', className)}>
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="space-y-1">
                <Label htmlFor={id} className="cursor-pointer">
                    {label}
                </Label>
                {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                )}
            </div>
        </div>
    );
};
