/// <reference path="../node_modules/nuclo/types/features/style.d.ts" />

declare module 'nuclo/ssr' {
  export function renderToString(node: unknown): string;
  export function renderManyToString(nodes: unknown[]): string;
  export function renderToStringWithContainer(
    node: unknown,
    container?: string,
  ): string;
}

declare module 'nuclo/styled' {
  export function setSSRCollector(collector: ((rule: string) => void) | null): void;
}
