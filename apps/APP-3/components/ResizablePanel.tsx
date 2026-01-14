/**
 * ============================================
 * RESIZABLE PANEL - PAINEL REDIMENSIONÁVEL
 * ============================================
 * 
 * Componente para criar painéis com divisores arrastáveis
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ResizablePanelProps {
    children: React.ReactNode;
    defaultSize?: number; // Porcentagem (0-100)
    minSize?: number; // Porcentagem mínima
    maxSize?: number; // Porcentagem máxima
    direction?: 'horizontal' | 'vertical';
    onResize?: (size: number) => void;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
    children,
    defaultSize = 50,
    minSize = 10,
    maxSize = 90,
    direction = 'horizontal',
    onResize
}) => {
    const [size, setSize] = useState(defaultSize);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);
    
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing || !containerRef.current) return;
        
        const container = containerRef.current.parentElement;
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        let newSize: number;
        
        if (direction === 'horizontal') {
            const x = e.clientX - rect.left;
            newSize = (x / rect.width) * 100;
        } else {
            const y = e.clientY - rect.top;
            newSize = (y / rect.height) * 100;
        }
        
        // Aplicar limites
        newSize = Math.max(minSize, Math.min(maxSize, newSize));
        
        setSize(newSize);
        if (onResize) onResize(newSize);
    }, [isResizing, direction, minSize, maxSize, onResize]);
    
    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);
    
    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
            document.body.style.userSelect = 'none';
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };
        }
    }, [isResizing, handleMouseMove, handleMouseUp, direction]);
    
    return (
        <div 
            ref={containerRef}
            style={{
                [direction === 'horizontal' ? 'width' : 'height']: `${size}%`,
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {children}
        </div>
    );
};

interface ResizerProps {
    direction?: 'horizontal' | 'vertical';
    onMouseDown: (e: React.MouseEvent) => void;
}

export const Resizer: React.FC<ResizerProps> = ({ direction = 'horizontal', onMouseDown }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
        <div
            onMouseDown={onMouseDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
                ${direction === 'horizontal' ? 'w-1 h-full cursor-col-resize' : 'h-1 w-full cursor-row-resize'}
                ${isHovered ? 'bg-sky-500/80' : 'bg-slate-700/50'}
                hover:bg-sky-500/80
                transition-all
                duration-200
                relative
                group
                flex-shrink-0
            `}
            style={{
                zIndex: 10
            }}
        >
            {/* Área de clique maior (invisível) */}
            <div className={`
                absolute
                ${direction === 'horizontal' 
                    ? 'w-3 h-full -left-1 top-0' 
                    : 'h-3 w-full -top-1 left-0'
                }
            `} />
            
            {/* Indicador visual - 3 pontinhos */}
            <div className={`
                absolute
                ${direction === 'horizontal' 
                    ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1' 
                    : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-row gap-1'
                }
                opacity-0
                group-hover:opacity-100
                transition-opacity
                duration-200
            `}>
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
            </div>
        </div>
    );
};
