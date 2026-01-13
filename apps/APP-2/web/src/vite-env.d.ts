/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LIGHTHOUSE_URL: string
  readonly VITE_API_URL: string
  readonly VITE_KERNEL_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
