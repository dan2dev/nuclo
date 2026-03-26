import { navBar } from '../components/nav.ts';

type PageCard = { href: string; title: string; description: string };

const PAGE_CARDS: PageCard[] = [
  { href: '/counter', title: 'Counter', description: 'Reactive counter using Nuclo update().' },
  { href: '/todo', title: 'Todo', description: 'Todo list using Nuclo list() with add, toggle, and delete.' },
];

export function homePage(pathname: string): NodeModFn<'div'> {
  return div(
    { class: 'page home-page' },
    navBar(pathname),
    main(
      { class: 'content' },
      div(
        { class: 'hero' },
        h1('Nuclo Demo'),
        p({ class: 'hero-subtitle' }, 'SSR + hydration + SPA navigation.'),
      ),
      div(
        { class: 'card-grid' },
        ...PAGE_CARDS.map(({ href, title, description }) =>
          a(
            { href, class: 'page-card' },
            h2(title),
            p(description),
          ),
        ),
      ),
    ),
  );
}
