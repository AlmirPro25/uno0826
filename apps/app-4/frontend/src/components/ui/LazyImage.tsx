import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    placeholder?: string;
    className?: string;
    containerClassName?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
    src,
    alt,
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+',
    className,
    containerClassName,
    ...props
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '100px', threshold: 0.1 }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div className={cn('relative overflow-hidden', containerClassName)}>
            <img
                ref={imgRef}
                src={isInView ? src : placeholder}
                alt={alt}
                className={cn(
                    'transition-opacity duration-300',
                    isLoaded ? 'opacity-100' : 'opacity-0',
                    className
                )}
                onLoad={() => setIsLoaded(true)}
                {...props}
            />
            {!isLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
        </div>
    );
};

// Avatar with lazy loading
interface LazyAvatarProps {
    src?: string;
    alt: string;
    fallback?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
};

export const LazyAvatar: React.FC<LazyAvatarProps> = ({
    src,
    alt,
    fallback,
    size = 'md',
    className,
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const initials = fallback || alt.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    if (!src || hasError) {
        return (
            <div
                className={cn(
                    'rounded-full bg-primary/10 flex items-center justify-center font-medium text-primary',
                    sizeClasses[size],
                    className
                )}
            >
                {initials}
            </div>
        );
    }

    return (
        <div className={cn('relative rounded-full overflow-hidden', sizeClasses[size], className)}>
            <img
                src={src}
                alt={alt}
                className={cn(
                    'w-full h-full object-cover transition-opacity duration-300',
                    isLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => setIsLoaded(true)}
                onError={() => setHasError(true)}
            />
            {!isLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse rounded-full" />
            )}
        </div>
    );
};
