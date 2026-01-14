import React, { useEffect } from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { Button } from './shadcn/Button';
import { Tooltip } from './Tooltip';

interface UndoRedoButtonsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  size?: 'sm' | 'default' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export function UndoRedoButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  size = 'default',
  showLabels = false,
  className = '',
}: UndoRedoButtonsProps) {
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          if (canRedo) {
            e.preventDefault();
            onRedo();
          }
        } else {
          if (canUndo) {
            e.preventDefault();
            onUndo();
          }
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        if (canRedo) {
          e.preventDefault();
          onRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, onUndo, onRedo]);

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <Tooltip content="Desfazer (Ctrl+Z)">
        <Button
          variant="ghost"
          size={size === 'sm' ? 'sm' : 'icon'}
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Desfazer"
        >
          <Undo2 className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
          {showLabels && <span className="ml-1">Desfazer</span>}
        </Button>
      </Tooltip>
      
      <Tooltip content="Refazer (Ctrl+Shift+Z)">
        <Button
          variant="ghost"
          size={size === 'sm' ? 'sm' : 'icon'}
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Refazer"
        >
          <Redo2 className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
          {showLabels && <span className="ml-1">Refazer</span>}
        </Button>
      </Tooltip>
    </div>
  );
}

// History indicator showing number of undo/redo steps
interface HistoryIndicatorProps {
  pastCount: number;
  futureCount: number;
}

export function HistoryIndicator({ pastCount, futureCount }: HistoryIndicatorProps) {
  if (pastCount === 0 && futureCount === 0) return null;

  return (
    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
      {pastCount > 0 && (
        <span className="flex items-center">
          <Undo2 className="w-3 h-3 mr-1" />
          {pastCount}
        </span>
      )}
      {futureCount > 0 && (
        <span className="flex items-center">
          <Redo2 className="w-3 h-3 mr-1" />
          {futureCount}
        </span>
      )}
    </div>
  );
}
