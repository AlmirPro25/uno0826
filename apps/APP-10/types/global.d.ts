/**
 * Global type declarations
 */

declare global {
  interface Window {
    __AETHER_LOCAL_MODE__?: boolean;
    crossOriginIsolated: boolean;
  }
}

export {};
