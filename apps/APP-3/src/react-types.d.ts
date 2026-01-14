/// <reference types="react" />
/// <reference types="react-dom" />

declare module 'react' {
  import * as React from 'react';
  export = React;
  export as namespace React;
  
  export function useState<S>(initialState: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>];
  export function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: React.DependencyList): T;
  export function useMemo<T>(factory: () => T, deps: React.DependencyList | undefined): T;
  export function useRef<T>(initialValue: T): React.MutableRefObject<T>;
  export function useRef<T>(initialValue: T | null): React.RefObject<T>;
  export function useRef<T = undefined>(): React.MutableRefObject<T | undefined>;
  
  export interface FC<P = {}> {
    (props: P): React.ReactElement<any, any> | null;
    displayName?: string | undefined;
    defaultProps?: Partial<P> | undefined;
  }
  
  export interface ReactElement<P = any, T extends string | React.JSXElementConstructor<any> = string | React.JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: React.Key | null;
  }
}