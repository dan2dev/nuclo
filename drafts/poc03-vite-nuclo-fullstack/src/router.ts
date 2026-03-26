import { homePage } from './pages/home.ts';
import { counterPage } from './pages/counter.ts';
import { todoPage } from './pages/todo.ts';

export type PageFactory = (pathname: string) => NodeModFn<'div'>;

const routes: Record<string, PageFactory> = {
  '/': homePage,
  '/counter': counterPage,
  '/todo': todoPage,
};

/**
 * Returns a ready-to-render NodeModFn for the given pathname.
 * Falls back to home for unmatched routes.
 */
export function matchRoute(pathname: string): NodeModFn<'div'> {
  const factory = routes[pathname] ?? routes['/'];
  return factory(pathname);
}
