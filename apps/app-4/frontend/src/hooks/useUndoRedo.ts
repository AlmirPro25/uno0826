import { useState, useCallback, useRef } from 'react';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseUndoRedoOptions {
  maxHistory?: number;
}

export function useUndoRedo<T>(initialState: T, options: UseUndoRedoOptions = {}) {
  const { maxHistory = 50 } = options;
  
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const set = useCallback((newPresent: T | ((prev: T) => T)) => {
    setState((currentState) => {
      const resolvedPresent = typeof newPresent === 'function'
        ? (newPresent as (prev: T) => T)(currentState.present)
        : newPresent;

      // Don't add to history if value hasn't changed
      if (JSON.stringify(resolvedPresent) === JSON.stringify(currentState.present)) {
        return currentState;
      }

      const newPast = [...currentState.past, currentState.present].slice(-maxHistory);

      return {
        past: newPast,
        present: resolvedPresent,
        future: [],
      };
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    setState((currentState) => {
      if (currentState.past.length === 0) return currentState;

      const previous = currentState.past[currentState.past.length - 1];
      const newPast = currentState.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [currentState.present, ...currentState.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((currentState) => {
      if (currentState.future.length === 0) return currentState;

      const next = currentState.future[0];
      const newFuture = currentState.future.slice(1);

      return {
        past: [...currentState.past, currentState.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((newPresent: T) => {
    setState({
      past: [],
      present: newPresent,
      future: [],
    });
  }, []);

  const clear = useCallback(() => {
    setState((currentState) => ({
      past: [],
      present: currentState.present,
      future: [],
    }));
  }, []);

  return {
    state: state.present,
    set,
    undo,
    redo,
    reset,
    clear,
    canUndo,
    canRedo,
    pastStates: state.past,
    futureStates: state.future,
  };
}

// Hook for tracking form changes with undo/redo
export function useFormHistory<T extends Record<string, unknown>>(initialValues: T) {
  const {
    state: values,
    set: setValues,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  } = useUndoRedo(initialValues);

  const setField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, [setValues]);

  const setFields = useCallback((fields: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...fields }));
  }, [setValues]);

  return {
    values,
    setField,
    setFields,
    setValues,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  };
}

// Hook for action history (for complex operations)
interface Action<T> {
  type: string;
  payload: T;
  timestamp: number;
  description?: string;
}

export function useActionHistory<T>() {
  const [actions, setActions] = useState<Action<T>[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < actions.length - 1;

  const addAction = useCallback((type: string, payload: T, description?: string) => {
    const newAction: Action<T> = {
      type,
      payload,
      timestamp: Date.now(),
      description,
    };

    setActions((prev) => {
      // Remove any future actions if we're not at the end
      const newActions = prev.slice(0, currentIndex + 1);
      return [...newActions, newAction];
    });
    setCurrentIndex((prev) => prev + 1);

    return newAction;
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (!canUndo) return null;
    const action = actions[currentIndex];
    setCurrentIndex((prev) => prev - 1);
    return action;
  }, [actions, currentIndex, canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return null;
    const action = actions[currentIndex + 1];
    setCurrentIndex((prev) => prev + 1);
    return action;
  }, [actions, currentIndex, canRedo]);

  const clear = useCallback(() => {
    setActions([]);
    setCurrentIndex(-1);
  }, []);

  const getCurrentAction = useCallback(() => {
    return currentIndex >= 0 ? actions[currentIndex] : null;
  }, [actions, currentIndex]);

  return {
    actions,
    currentIndex,
    addAction,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
    getCurrentAction,
  };
}
