/// <reference types="vite/client" />

declare module 'virtual:ascii-scene-dev-manifest' {
  const manifest: Record<
    string,
    readonly { key: string; path: string; mtimeMs: number }[]
  >;
  export default manifest;
}
