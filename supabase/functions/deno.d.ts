// Ambient type definitions for Supabase Edge Functions (Deno Runtime)
// This enables autocomplete and removes IDE TypeScript errors without requiring global Deno installation.

declare module 'jsr:@supabase/functions-js/edge-runtime.d.ts' {}

declare namespace Deno {
  export interface ServeOptions {
    port?: number;
    hostname?: string;
    signal?: AbortSignal;
    onError?: (error: unknown) => Response | Promise<Response>;
    onListen?: (params: { hostname: string; port: number }) => void;
  }

  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
    options?: ServeOptions
  ): void;

  export const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    has(key: string): boolean;
    delete(key: string): void;
    toObject(): Record<string, string>;
  };
}
